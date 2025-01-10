import {
    CipherSuite as MlsCipherSuite,
    Client as MlsClient,
    Group as MlsGroup,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { dlog, DLogger } from '@river-build/dlog'
import { Group } from './group'

// export class Awaiter {
//     // top level promise
//     public promise: Promise<void>
//     // resolve handler to the inner promise
//     public resolve!: () => void
//     public constructor(timeoutMS: number, msg: string = 'Awaiter timed out') {
//         log('creating awaiter')
//         let timeout: NodeJS.Timeout
//         const timeoutPromise = new Promise<never>((_resolve, reject) => {
//             timeout = setTimeout(() => {
//                 reject(new Error(msg))
//             }, timeoutMS)
//         })
//         const internalPromise: Promise<void> = new Promise(
//             (resolve: (value: void) => void, _reject) => {
//                 this.resolve = () => {
//                     log('resolve')
//                     resolve()
//                 }
//             },
//         ).finally(() => {
//             log('clearing timeout')
//             clearTimeout(timeout)
//         })
//         this.promise = Promise.race([internalPromise, timeoutPromise])
//     }
// }

const log = dlog('csb:mls:crypto')

export class MlsCrypto {
    private client!: MlsClient
    public readonly userAddress: Uint8Array
    public readonly deviceKey: Uint8Array
    protected readonly log: {
        info: DLogger
        debug: DLogger
        error: DLogger
    }

    cipherSuite: MlsCipherSuite = new MlsCipherSuite()

    constructor(userAddress: Uint8Array, deviceKey: Uint8Array, opts?: { log: DLogger }) {
        this.userAddress = userAddress
        this.deviceKey = deviceKey
        const log_ = opts?.log ?? log
        this.log = {
            info: log_.extend('info'),
            debug: log_.extend('debug'),
            error: log_.extend('error'),
        }
    }

    public async initialize() {
        const name = new Uint8Array(this.userAddress.length + this.deviceKey.length)
        name.set(this.userAddress, 0)
        name.set(this.deviceKey, this.userAddress.length)
        this.client = await MlsClient.create(name)
    }

    public async createGroup(streamId: string): Promise<Group> {
        if (!this.client) {
            this.log.error('createGroup: Client not initialized')
            throw new Error('Client not initialized')
        }

        // TODO: Create group with a particular group id
        const mlsGroup = await this.client.createGroup()
        const groupInfoWithExternalKey = (
            await mlsGroup.groupInfoMessageAllowingExtCommit(true)
        ).toBytes()

        return Group.createGroup(streamId, mlsGroup, groupInfoWithExternalKey)
    }

    public async externalJoin(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ group: Group; epoch: bigint }> {
        if (!this.client) {
            this.log.error('externalJoin: Client not initialized')
            throw new Error('Client not initialized')
        }

        const { group: mlsGroup, commit } = await this.client.commitExternal(
            MlsMessage.fromBytes(groupInfo),
        )
        const groupInfoWithExternalKey = (
            await mlsGroup.groupInfoMessageAllowingExtCommit(true)
        ).toBytes()
        const commitBytes = commit.toBytes()
        const group = Group.externalJoin(streamId, mlsGroup, commitBytes, groupInfoWithExternalKey)

        return {
            group,
            epoch: mlsGroup.currentEpoch,
        }
    }

    /// Process current group commit and return epoch
    public async processCommit(group: MlsGroup, commit: Uint8Array): Promise<bigint> {
        await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        return group.currentEpoch
    }

    // TODO: Make this return undefined in case of an error?
    public async loadGroup(groupId: Uint8Array): Promise<MlsGroup> {
        if (!this.client) {
            this.log.error('loadGroup: Client not initialized')
            throw new Error('Client not initialized')
        }

        return this.client.loadGroup(groupId)
    }

    public async writeGroupToStorage(group: MlsGroup): Promise<void> {
        await group.writeToStorage()
    }

    // public async awaitGroupActive(streamId: string): Promise<void> {
    //     this.log(`awaitGroupActive ${streamId}`)
    //     if ((await this.groupStore.getGroup(streamId))?.state.status === 'GROUP_ACTIVE') {
    //         return
    //     }
    //     // NOTE: Critical section, no awaits permitted
    //     const awaiting = this.awaitingGroupActive.get(streamId)
    //     if (awaiting) {
    //         return await awaiting.promise
    //     }
    //     const awaiter = new Awaiter(
    //         this.awaitTimeoutMS,
    //         `Await group timed out for ${this.nickname} ${streamId}`,
    //     )
    //
    //     this.awaitingGroupActive.set(streamId, awaiter)
    //
    //     return awaiter.promise.finally(() => {
    //         this.awaitingGroupActive.delete(streamId)
    //     })
    // }

    // public async handleInitializeGroup(
    //     streamId: string,
    //     userAddress: Uint8Array,
    //     deviceKey: Uint8Array,
    //     groupInfoWithExternalKey: Uint8Array,
    // ): Promise<Group | undefined> {
    //     // - If we have a group in PENDING_CREATE, and
    //     //   - we sent the message,
    //     //     then we can switch that group into a confirmed state; or
    //     //   - and we did not sent the message,
    //     //     then we clear it, and request to join using external join
    //     // - Any other state should be impossible
    //
    //     const group = await this.groupStore.getGroup(streamId)
    //
    //     // TODO: Are other cases even possible?
    //     if (!group) {
    //         return undefined
    //     }
    //     if (group.state.status !== 'GROUP_PENDING_CREATE') {
    //         return group
    //     }
    //
    //     const ourGroupInfoWithExternalKey = group.state.groupInfoWithExternalKey
    //
    //     const ourOwnInitializeGroup: boolean =
    //         uint8ArrayEqual(userAddress, this.userAddress) &&
    //         uint8ArrayEqual(deviceKey, this.deviceKey) &&
    //         uint8ArrayEqual(groupInfoWithExternalKey, ourGroupInfoWithExternalKey)
    //
    //     if (ourOwnInitializeGroup) {
    //         group.markActive()
    //         await this.groupStore.updateGroup(group)
    //         // check if anyone is waiting for it
    //         this.log('resolve')
    //         this.awaitingGroupActive.get(streamId)?.resolve()
    //         return group
    //     } else {
    //         // Someone else created a group
    //         await this.groupStore.clearGroup(streamId)
    //
    //         // let's initialise a new group
    //         return undefined
    //     }
    // }

    // public async handleExternalJoin(
    //     streamId: string,
    //     userAddress: Uint8Array,
    //     deviceKey: Uint8Array,
    //     commit: Uint8Array,
    //     groupInfoWithExternalKey: Uint8Array,
    //     epoch: bigint,
    // ): Promise<Group | undefined> {
    //     // - If we have a group in PENDING_CREATE,
    //     //   then we clear it, and request to join using external join
    //     // - If we have a group in PENDING_JOIN, and
    //     //   - we sent the message,
    //     //     then we can switch that group into a confirmed state; or
    //     //   - we did not send the message,
    //     //     then we clear it, and request to join using external join
    //     // - If we have a group in ACTIVE,
    //     //   then we process the commit,
    //     const group = await this.groupStore.getGroup(streamId)
    //     if (!group) {
    //         return undefined
    //     }
    //     switch (group.state.status) {
    //         case 'GROUP_PENDING_CREATE':
    //             await this.groupStore.clearGroup(streamId)
    //             return undefined
    //         case 'GROUP_PENDING_JOIN': {
    //             const groupEpoch = group.state.group.currentEpoch
    //             if (epoch < groupEpoch) {
    //                 this.log('skipping old join message', {
    //                     epoch,
    //                     groupEpoch,
    //                     groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
    //                     commit: shortenHexString(bin_toHexString(commit)),
    //                 })
    //                 return group
    //             }
    //             if (epoch > groupEpoch) {
    //                 this.log('group info was stale for join message, clearing group', {
    //                     epoch,
    //                     groupEpoch,
    //                     groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
    //                     commit: shortenHexString(bin_toHexString(commit)),
    //                 })
    //                 await this.groupStore.clearGroup(streamId)
    //                 return undefined
    //             }
    //
    //             const ownPendingJoin: boolean =
    //                 uint8ArrayEqual(userAddress, this.userAddress) &&
    //                 uint8ArrayEqual(deviceKey, this.deviceKey) &&
    //                 uint8ArrayEqual(commit, group.state.commit) &&
    //                 uint8ArrayEqual(groupInfoWithExternalKey, group.state.groupInfoWithExternalKey)
    //             if (!ownPendingJoin) {
    //                 this.log('someone else joined, clearing group', {
    //                     epoch,
    //                     groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
    //                     commit: shortenHexString(bin_toHexString(commit)),
    //                 })
    //                 await this.groupStore.clearGroup(streamId)
    //                 return undefined
    //             }
    //
    //             group.markActive()
    //             await this.groupStore.updateGroup(group)
    //             const joinedEpoch = group.state.group.currentEpoch
    //             this.log('joining group', {
    //                 epoch: joinedEpoch,
    //                 groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
    //                 commit: shortenHexString(bin_toHexString(commit)),
    //             })
    //             this.log('resolve')
    //             this.awaitingGroupActive.get(streamId)?.resolve()
    //             return group
    //         }
    //         case 'GROUP_ACTIVE':
    //             await this.handleCommit(streamId, commit)
    //             return group
    //     }
    // }

    // public async epochFor(streamId: string): Promise<bigint> {
    //     const group = await this.groupStore.getGroup(streamId)
    //     if (!group) {
    //         throw new Error('Group not found')
    //     }
    //     if (group.status !== 'GROUP_ACTIVE') {
    //         throw new Error('Group not in active state')
    //     }
    //     return group.group.currentEpoch
    // }
}
