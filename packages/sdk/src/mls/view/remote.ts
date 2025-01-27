import {
    ExternalClient as MlsExternalClient,
    ExternalGroup as MlsExternalGroup,
    ExternalSnapshot as MlsExternalSnapshot,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import {
    ConfirmedEpochSecrets,
    ConfirmedInitializeGroup,
    MlsConfirmedEvent,
    ConfirmedMlsEventWithCommit,
    MlsSnapshot,
    MlsConfirmedSnapshot,
} from '../types'
import { elogger, ELogger } from '@river-build/dlog'
import { logNever } from '../../check'
import { IStreamStateView } from '../../streamStateView'
import { StreamTimelineEvent } from '../../types'
import { MemberPayload_Snapshot_Mls } from '@river-build/proto'

const defaultLogger = elogger('csb:mls:view:remote')

export type RemoteViewOpts = {
    log: ELogger
}

class RemoteGroup {
    constructor(
        public group: MlsExternalGroup,
        public groupInfoWithExternalKey: Uint8Array,
    ) {}

    static async loadExternalGroupSnapshotWithError(
        snapshot: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<RemoteGroup> {
        const externalClient = new MlsExternalClient()
        const externalSnapshot = MlsExternalSnapshot.fromBytes(snapshot)
        const group = await externalClient.loadGroup(externalSnapshot)
        return new RemoteGroup(group, groupInfoWithExternalKey)
    }


    async processCommitWithError(
        commit: Uint8Array,
        groupInfo: Uint8Array,
    ): Promise<void> {
        const message = MlsMessage.fromBytes(commit)
        await this.group.processIncomingMessage(message)
        this.groupInfoWithExternalKey = groupInfo
    }
}

export type RemoteGroupInfo = {
    exportedTree: Uint8Array
    latestGroupInfo: Uint8Array
    epoch: bigint
}

export type SnapshotAndConfirmedEvents = {
    snapshot: MlsSnapshot
    confirmedEvents: MlsConfirmedEvent[]
}

function extractLastConfirmedMlsSnapshot(timeline: StreamTimelineEvent[]): MlsConfirmedSnapshot {
    let lastConfirmedSnapshot = {
        confirmedEventNum: -1n,
        miniblockNum: -1n,
        eventId: '',
        ...new MemberPayload_Snapshot_Mls(),
    }
    timeline.forEach((event) => {
        if (event.confirmedEventNum === undefined) {
            return
        }

        if (event.miniblockNum === undefined) {
            return
        }

        if (event.remoteEvent?.event.payload?.case !== 'miniblockHeader') {
            return
        }

        const mlsSnapshot = event.remoteEvent?.event.payload?.value.snapshot?.members?.mls
        if (mlsSnapshot === undefined) {
            return
        }

        if (event.confirmedEventNum > lastConfirmedSnapshot.confirmedEventNum) {
            lastConfirmedSnapshot = {
                confirmedEventNum: event.confirmedEventNum,
                miniblockNum: event.miniblockNum,
                eventId: event.remoteEvent.hashStr,
                ...mlsSnapshot,
            }
        }
    })
    return lastConfirmedSnapshot
}

export function extractConfirmedEvents(
    timeline: StreamTimelineEvent[],
    snapshotConfirmedEventNum = 1n,
): MlsConfirmedEvent[] {
    const confirmedMlsEvents: MlsConfirmedEvent[] = []

    timeline.forEach((event) => {
        if (event.confirmedEventNum === undefined) {
            return
        }

        if (event.miniblockNum === undefined) {
            return
        }

        if (event.remoteEvent?.event.payload?.case !== 'memberPayload') {
            return
        }

        const payload = event.remoteEvent?.event.payload?.value.content
        if (payload?.case !== 'mls') {
            return
        }

        const confirmedMlsEvent = {
            confirmedEventNum: event.confirmedEventNum,
            miniblockNum: event.miniblockNum,
            eventId: event.remoteEvent.hashStr,
            ...payload.value.content,
        }

        if (confirmedMlsEvent.confirmedEventNum > snapshotConfirmedEventNum) {
            confirmedMlsEvents.push(confirmedMlsEvent)
        }
    })

    // Sort numerically in ascending order
    confirmedMlsEvents.sort((a, b) => {
        const d = a.confirmedEventNum - b.confirmedEventNum
        return d > 0n ? 1 : d < 0n ? -1 : 0
    })

    return confirmedMlsEvents
}

export function extractFromTimeLine(timeline: StreamTimelineEvent[]): SnapshotAndConfirmedEvents {
    const snapshot = extractLastConfirmedMlsSnapshot(timeline)
    const confirmedEvents = extractConfirmedEvents(timeline, snapshot.confirmedEventNum)
    return {
        snapshot,
        confirmedEvents,
    }
}

/// Class to represent on-chain view of MLS
export class RemoteView {
    // for bookkeeping
    private lastConfirmedEventNumFor = {
        mlsEvent: BigInt(-1),
        snapshot: BigInt(-1),
    }
    private remoteGroup?: RemoteGroup

    // confirmed events by event id
    public readonly accepted: Map<string, MlsConfirmedEvent> = new Map()

    // rejected events by event id
    public readonly rejected: Map<string, MlsConfirmedEvent> = new Map()

    // commits by epoch
    public readonly commits: Map<bigint, Uint8Array> = new Map()
    public readonly sealedEpochSecrets: Map<bigint, Uint8Array> = new Map()

    private log: ELogger

    public constructor(opts?: RemoteViewOpts) {
        this.log = opts?.log ?? defaultLogger
    }

    get processedCount(): number {
        return this.accepted.size + this.rejected.size
    }

    get externalInfo(): RemoteGroupInfo | undefined {
        if (this.remoteGroup === undefined) {
            return undefined
        }

        return {
            exportedTree: this.remoteGroup.group.exportTree(),
            latestGroupInfo: this.remoteGroup.groupInfoWithExternalKey,
            epoch: this.remoteGroup.group.epoch,
        }
    }

    /// Processing snapshot will reload the external group from the snapshot
    public async processSnapshot(snapshot: MlsSnapshot): Promise<void> {
        const externalGroupSnapshot = snapshot.externalGroupSnapshot
        const groupInfoMessage = snapshot.groupInfoMessage
        try {
            this.remoteGroup = await RemoteGroup.loadExternalGroupSnapshotWithError(
                externalGroupSnapshot,
                groupInfoMessage,
            )
        } catch (e) {
            this.log.error('processSnapshot', snapshot, e)
        }
    }

    /// Process event
    public async processConfirmedMlsEvent(event: MlsConfirmedEvent): Promise<void> {
        this.log.log('processConfirmedMlsEvent', {
            miniblockNum: event.miniblockNum,
            confirmedEventNum: event.confirmedEventNum,
            case: event.case,
        })

        if (this.lastConfirmedEventNumFor.mlsEvent >= event.confirmedEventNum) {
            this.log.log('processConfirmedMlsEvent: event older than last one', {
                prev: this.lastConfirmedEventNumFor.mlsEvent,
                curr: event.confirmedEventNum,
            })
        }
        this.lastConfirmedEventNumFor.mlsEvent = event.confirmedEventNum

        switch (event.case) {
            case 'initializeGroup':
                return this.processInitializeGroup(event)
            // events with commit
            case 'externalJoin':
            case 'welcomeMessage':
                return this.processEventWithCommit(event)
            case 'epochSecrets':
                return this.processEpochSecrets(event)
            case 'keyPackage':
            case undefined:
                break
            default:
                logNever(event)
        }
    }



    private async processInitializeGroup(event: ConfirmedInitializeGroup): Promise<void> {
        this.log.log('processInitializeGroup', {
            miniblockNum: event.miniblockNum,
            confirmedEventNum: event.confirmedEventNum,
        })

        if (this.remoteGroup !== undefined) {
            this.log.log('processInitializeGroup: already loaded')
            this.rejected.set(event.eventId, event)
            return
        }

        try {
            const snapshot = event.value.externalGroupSnapshot
            const groupInfoWithExternalKey = event.value.groupInfoMessage
            this.remoteGroup = await RemoteGroup.loadExternalGroupSnapshotWithError(
                snapshot,
                groupInfoWithExternalKey,
            )
            this.accepted.set(event.eventId, event)
        } catch (e) {
            this.log.error?.('processInitializeGroup', e)
            this.rejected.set(event.eventId, event)
        }
    }

    private async processEventWithCommit(event: ConfirmedMlsEventWithCommit): Promise<void> {
        if (this.remoteGroup === undefined) {
            this.log.log('processCommit: externalGroup not loaded')
            this.rejected.set(event.eventId, event)
            return
        }

        try {
            const commit = event.value.commit
            const groupInfo = event.value.groupInfoMessage
            const epoch = this.remoteGroup.group.epoch
            await this.remoteGroup.processCommitWithError(commit, groupInfo)
            this.accepted.set(event.eventId, event)
            this.commits.set(epoch, commit)
        } catch (e) {
            // this.log.error?.('processCommit', e)
            this.rejected.set(event.eventId, event)
        }
    }

    public static async loadFromStreamStateView(
        streamView: IStreamStateView,
        opts?: RemoteViewOpts,
    ): Promise<RemoteView> {
        const { snapshot, confirmedEvents } = extractFromTimeLine(streamView.timeline)

        const onChainView = new RemoteView(opts)
        await onChainView.processSnapshot(snapshot)
        for (const confirmedEvent of confirmedEvents) {
            await onChainView.processConfirmedMlsEvent(confirmedEvent)
        }
        return onChainView
    }

    private processEpochSecrets(event: ConfirmedEpochSecrets): void {
        this.accepted.set(event.eventId, event)

        event.value.secrets.forEach((secret) => {
            this.sealedEpochSecrets.set(secret.epoch, secret.secret)
        })
    }
}
