import { Group as MlsGroup, MlsMessage } from '@river-build/mls-rs-wasm'
import { OnChainView } from './onChainView'
import { dlog } from '@river-build/dlog'
import { EpochEncryption } from './epochEncryption'
import { MlsLogger } from './logger'

type PendingInfo = {
    eventId: string
    // miniblock known before joining
    miniblockBefore: bigint
}

const defaultLogger = dlog('csb:mls:view:remote')

export type LocalViewOpts = {
    log: MlsLogger
}

const defaultOnChainViewOpts = {
    log: {
        info: defaultLogger.extend('info'),
        error: defaultLogger.extend('error'),
    },
}

export type LocalEpochSecret = {
    epoch: bigint
    secret: Uint8Array
    derivedKeys: {
        publicKey: Uint8Array
        secretKey: Uint8Array
    }
}

export type LocalViewStatus = 'pending' | 'active' | 'rejected' | 'corrupted'

export class LocalView {
    public group: MlsGroup
    public pendingInfo?: PendingInfo
    public readonly epochSecrets: Map<bigint, LocalEpochSecret> = new Map()
    // this will mark the epoch rejected by the group
    public rejectedEpoch?: bigint

    private crypto: EpochEncryption = new EpochEncryption()

    // public readonly pending: Map<bigint, Uint8Array> = new Map()

    private log: MlsLogger

    public get status(): LocalViewStatus {
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

        // process all epoch secrets in descending order
        const secrets = Array.from(view.sealedEpochSecrets.entries())
        secrets.sort((a, b) => (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0))
        for (const [epoch, sealedSecret] of secrets) {
            await this.processSealedEpochSecret(epoch, sealedSecret)
        }
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
    latestEpochSecret(): LocalEpochSecret | undefined {
        return this.epochSecrets.get(this.group.currentEpoch)
    }

    getEpochSecret(epoch: bigint): LocalEpochSecret | undefined {
        return this.epochSecrets.get(epoch)
    }

    public async sealEpochSecret(secret: LocalEpochSecret): Promise<Uint8Array | undefined> {
        const nextEpochSecret = this.epochSecrets.get(secret.epoch + 1n)
        if (nextEpochSecret === undefined) {
            return undefined
        }
        return await this.crypto.seal(nextEpochSecret.derivedKeys, secret.secret)
    }

    public async processSealedEpochSecret(epoch: bigint, sealedSecret: Uint8Array): Promise<void> {
        if (this.epochSecrets.has(epoch)) {
            return
        }

        const nextEpochSecret = this.epochSecrets.get(epoch + 1n)
        if (nextEpochSecret === undefined) {
            return
        }

        const secret = await this.crypto.open(nextEpochSecret.derivedKeys, sealedSecret)
        const derivedKeys = await this.crypto.deriveKeys(secret)
        this.epochSecrets.set(epoch, {
            epoch,
            secret,
            derivedKeys,
        })
    }
}
