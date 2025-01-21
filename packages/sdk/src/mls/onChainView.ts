import {
    ExternalClient as MlsExternalClient,
    ExternalGroup as MlsExternalGroup,
    ExternalSnapshot as MlsExternalSnapshot,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import {
    ConfirmedEpochSecrets,
    ConfirmedInitializeGroup,
    ConfirmedMlsEvent,
    ConfirmedMlsEventWithCommit,
    MlsSnapshot,
} from './types'
import { dlog } from '@river-build/dlog'
import { logNever } from '../check'
import { IStreamStateView } from '../streamStateView'
import { MlsLogger } from './logger'

const defaultLogger = dlog('csb:mls:onChainView')

export type OnChainViewOpts = {
    log: MlsLogger
}

const defaultOnChainViewOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

type ExternalGroup = {
    group: MlsExternalGroup
    groupInfoWithExternalKey: Uint8Array
}

export type ExternalInfo = {
    exportedTree: Uint8Array
    latestGroupInfo: Uint8Array
    epoch: bigint
}

/// Class to represent on-chain view of MLS
export class OnChainView {
    // for bookkeeping
    private lastConfirmedEventNumFor = {
        mlsEvent: BigInt(-1),
        snapshot: BigInt(-1),
    }
    private externalGroup?: ExternalGroup

    // confirmed events by event id
    public readonly accepted: Map<string, ConfirmedMlsEvent> = new Map()

    // rejected events by event id
    public readonly rejected: Map<string, ConfirmedMlsEvent> = new Map()

    // commits by epoch
    public readonly commits: Map<bigint, Uint8Array> = new Map()
    public readonly sealedEpochSecrets: Map<bigint, Uint8Array> = new Map()

    private log: MlsLogger

    public constructor(opts: OnChainViewOpts = defaultOnChainViewOpts) {
        this.log = opts.log
    }

    get processedCount(): number {
        return this.accepted.size + this.rejected.size
    }

    get externalInfo(): ExternalInfo | undefined {
        if (this.externalGroup === undefined) {
            return undefined
        }

        return {
            exportedTree: this.externalGroup.group.exportTree(),
            latestGroupInfo: this.externalGroup.groupInfoWithExternalKey,
            epoch: this.externalGroup.group.epoch,
        }
    }

    /// Processing snapshot will reload the external group from the snapshot
    public async processSnapshot(snapshot: MlsSnapshot): Promise<void> {
        this.log.debug?.('processSnapshot', {
            miniblockNum: snapshot.miniblockNum,
            confirmedEventNum: snapshot.confirmedEventNum,
        })

        if (this.lastConfirmedEventNumFor.snapshot >= snapshot.confirmedEventNum) {
            this.log.warn?.('processSnapshot: snapshot older than last one', {
                prev: this.lastConfirmedEventNumFor.snapshot,
                curr: snapshot.confirmedEventNum,
            })
        }
        this.lastConfirmedEventNumFor.snapshot = snapshot.confirmedEventNum
        // nop
    }

    /// Process event
    public async processConfirmedMlsEvent(event: ConfirmedMlsEvent): Promise<void> {
        this.log.debug?.('processConfirmedMlsEvent', {
            miniblockNum: event.miniblockNum,
            confirmedEventNum: event.confirmedEventNum,
            case: event.case,
        })

        if (this.lastConfirmedEventNumFor.mlsEvent >= event.confirmedEventNum) {
            this.log.warn?.('processConfirmedMlsEvent: event older than last one', {
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

    private async loadExternalGroupSnapshotWithError(
        snapshot: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<ExternalGroup> {
        const externalClient = new MlsExternalClient()
        const externalSnapshot = MlsExternalSnapshot.fromBytes(snapshot)
        const group = await externalClient.loadGroup(externalSnapshot)
        return {
            group,
            groupInfoWithExternalKey,
        }
    }

    private async processCommitWithError(
        externalGroup: ExternalGroup,
        commit: Uint8Array,
        groupInfo: Uint8Array,
    ): Promise<void> {
        const message = MlsMessage.fromBytes(commit)
        await externalGroup.group.processIncomingMessage(message)
        externalGroup.groupInfoWithExternalKey = groupInfo
    }

    private async processInitializeGroup(event: ConfirmedInitializeGroup): Promise<void> {
        this.log.debug?.('processInitializeGroup', {
            miniblockNum: event.miniblockNum,
            confirmedEventNum: event.confirmedEventNum,
        })

        if (this.externalGroup !== undefined) {
            this.log.debug?.('processInitializeGroup: already loaded')
            this.rejected.set(event.eventId, event)
            return
        }

        try {
            const snapshot = event.value.externalGroupSnapshot
            const groupInfoWithExternalKey = event.value.groupInfoMessage
            this.externalGroup = await this.loadExternalGroupSnapshotWithError(
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
        if (this.externalGroup === undefined) {
            this.log.debug?.('processCommit: externalGroup not loaded')
            this.rejected.set(event.eventId, event)
            return
        }

        try {
            const commit = event.value.commit
            const groupInfo = event.value.groupInfoMessage
            const epoch = this.externalGroup.group.epoch
            await this.processCommitWithError(this.externalGroup, commit, groupInfo)
            this.accepted.set(event.eventId, event)
            this.commits.set(epoch, commit)
        } catch (e) {
            // this.log.error?.('processCommit', e)
            this.rejected.set(event.eventId, event)
        }
    }

    public static async loadFromStreamStateView(
        streamView: IStreamStateView,
        opts: OnChainViewOpts = defaultOnChainViewOpts,
    ): Promise<OnChainView> {
        const onChainView = new OnChainView(opts)

        let lastConfirmedMlsSnapshot: MlsSnapshot | undefined
        streamView.timeline.forEach((event) => {
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

            const confirmedMlsSnapshot = {
                confirmedEventNum: event.confirmedEventNum,
                miniblockNum: event.miniblockNum,
                eventId: event.remoteEvent.hashStr,
                ...mlsSnapshot,
            }

            if (
                confirmedMlsSnapshot.confirmedEventNum >
                (lastConfirmedMlsSnapshot?.confirmedEventNum ?? BigInt(-1))
            ) {
                lastConfirmedMlsSnapshot = confirmedMlsSnapshot
            }
        })

        const snapshotConfirmedEventNum = lastConfirmedMlsSnapshot?.confirmedEventNum ?? BigInt(-1)
        const confirmedMlsEvents: ConfirmedMlsEvent[] = []

        streamView.timeline.forEach((event) => {
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

        confirmedMlsEvents.sort((a, b) => {
            const difference = a.confirmedEventNum - b.confirmedEventNum
            if (difference > 0n) {
                return 1
            }
            if (difference < 0n) {
                return -1
            }
            return 0
        })

        if (lastConfirmedMlsSnapshot !== undefined) {
            await onChainView.processSnapshot(lastConfirmedMlsSnapshot)
        }
        for (const confirmedMlsEvent of confirmedMlsEvents) {
            await onChainView.processConfirmedMlsEvent(confirmedMlsEvent)
        }
        return onChainView
    }

    private processEpochSecrets(event: ConfirmedEpochSecrets): void {
        event.value.secrets.forEach((secret) => {
            this.sealedEpochSecrets.set(secret.epoch, secret.secret)
        })
    }
}
