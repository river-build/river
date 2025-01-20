import { Group as MlsGroup, MlsMessage } from '@river-build/mls-rs-wasm'
import { OnChainView } from './onChainView'
import { dlog, DLogger } from '@river-build/dlog'
import { EpochEncryption } from './epochEncryption'

type PendingInfo = {
    eventId: string
    // miniblock known before joining
    miniblockBefore: bigint
}

const defaultLogger = dlog('csb:mls:onChainView')

export type LocalViewOpts = {
    log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }
}

const defaultOnChainViewOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

type LocalEpochSecret = {
    epoch: bigint
    secret: Uint8Array
    derivedKeys: {
        publicKey: Uint8Array
        secretKey: Uint8Array
    }
}

export class LocalView {
    private group: MlsGroup
    private pendingInfo?: PendingInfo
    private epochSecrets: Map<bigint, LocalEpochSecret> = new Map()
    // this will mark the epoch rejected by the group
    private rejectedEpoch?: bigint

    private crypto: EpochEncryption = new EpochEncryption()

    // public readonly pending: Map<bigint, Uint8Array> = new Map()

    private log: {
        info?: DLogger
        debug?: DLogger
        error?: DLogger
        warn?: DLogger
    }

    public get status(): string {
        if (this.rejectedEpoch === this.group.currentEpoch) {
            return 'rejected'
        }
        if (this.rejectedEpoch !== undefined) {
            return 'corrupted'
        }
        if (this.pendingInfo !== undefined) {
            return 'pending'
        }
        return 'active'
    }

    public constructor(
        group: MlsGroup,
        pendingInfo?: PendingInfo,
        rejectedEpoch?: bigint,
        opts = defaultOnChainViewOpts,
    ) {
        this.group = group
        this.pendingInfo = pendingInfo
        this.rejectedEpoch = rejectedEpoch
        this.log = opts.log
    }

    public async processOnChainView(view: OnChainView) {
        if (this.rejectedEpoch !== undefined) {
            // Group is corrupted
            return
        }

        // check if we are waiting for an event
        if (this.pendingInfo !== undefined) {
            if (view.rejected.has(this.pendingInfo.eventId)) {
                // our event got rejected, we clear the group
                this.rejectedEpoch = this.group.currentEpoch
                return
            }

            if (view.accepted.has(this.pendingInfo.eventId)) {
                // our event got accepted, we mark group as active
                this.pendingInfo = undefined
                await this.addCurrentEpochSecret()
            }
        }

        // check if maybe we can find the next commit anyways
        if (this.pendingInfo !== undefined) {
            const epoch = this.group.currentEpoch
            const commit = view.commits.get(epoch)
            if (commit !== undefined) {
                try {
                    const message = MlsMessage.fromBytes(commit)
                    await this.group.processIncomingMessage(message)
                    await this.addCurrentEpochSecret()
                } catch (e) {
                    this.log.error?.('processCommit: rejected epoch', epoch)
                    this.rejectedEpoch = epoch
                    // nothing to do here
                    return
                }
            }
        }

        // grab all the commits that are in sequential order and start with our epoch
        const processableCommits: Map<bigint, Uint8Array> = new Map()
        let currentEpoch = this.group.currentEpoch
        while (view.commits.has(currentEpoch)) {
            processableCommits.set(currentEpoch, view.commits.get(currentEpoch)!)
            currentEpoch = currentEpoch + 1n
        }

        // process all the processableCommits
        for (const [epoch, commit] of processableCommits) {
            try {
                const message = MlsMessage.fromBytes(commit)
                await this.group.processIncomingMessage(message)
                await this.addCurrentEpochSecret()
            } catch (e) {
                this.log.error?.('processCommit: rejected epoch', epoch)
                this.rejectedEpoch = epoch
                // nothing to do here
                return
            }
        }

        // move all unprocessable commits to pending
        // for (const [epoch, commit] of view.commits) {
        //     if (!processableCommits.has(epoch)) {
        //         this.pending.set(epoch, commit)
        //     }
        // }
    }

    private async addCurrentEpochSecret(): Promise<void> {
        const epoch = this.group.currentEpoch
        const secret = (await this.group.currentEpochSecret()).toBytes()
        const derivedKeys = await this.crypto.deriveKeys(secret)
        const epochSecret = {
            epoch,
            secret,
            derivedKeys,
        }

        this.epochSecrets.set(epoch, epochSecret)
    }

    // TODO: What to do if corrupted?
    latestEpochSecret(): LocalEpochSecret {
        return this.epochSecrets.get(this.group.currentEpoch)!
    }
}