import {
    Client as MlsClient,
    MlsMessage,
    CipherSuite as MlsCipherSuite,
    HpkeCiphertext,
} from '@river-build/mls-rs-wasm'
import { EncryptedData } from '@river-build/proto'
import { EpochKeyService } from './epochKeyStore'
import { GroupStore } from './groupStore'
import { MlsStore } from './mlsStore'
import { dlog, DLogger, bin_toHexString, shortenHexString } from '@river-build/dlog'
import { Group } from './group'

function uint8ArrayEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a === b) {
        return true
    }
    if (a.length !== b.length) {
        return false
    }
    for (const [i, byte] of a.entries()) {
        if (byte !== b[i]) {
            return false
        }
    }
    return true
}

const log = dlog('csb:mls')

export class Awaiter {
    // top level promise
    public promise: Promise<void>
    // resolve handler to the inner promise
    public resolve!: () => void
    public constructor(timeoutMS: number) {
        let timeout: NodeJS.Timeout
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error('timed out'))
            }, timeoutMS)
        })
        const internalPromise: Promise<void> = new Promise(
            (resolve: (value: void) => void, _reject) => {
                this.resolve = resolve
            },
        ).finally(() => {
            clearTimeout(timeout)
        })
        this.promise = Promise.race([internalPromise, timeoutPromise])
    }
}

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: Uint8Array
    public deviceKey: Uint8Array
    private mlsStore: MlsStore
    private nickname: string
    readonly log: DLogger
    public awaitTimeoutMS: number = 5_000

    awaitingGroupActive: Map<string, Awaiter> = new Map()
    cipherSuite: MlsCipherSuite = new MlsCipherSuite()
    epochKeyService: EpochKeyService
    groupStore: GroupStore

    constructor(userAddress: Uint8Array, deviceKey: Uint8Array, nickname?: string) {
        this.userAddress = userAddress
        this.deviceKey = deviceKey
        if (nickname) {
            this.nickname = nickname
        } else {
            this.nickname = bin_toHexString(this.userAddress)
        }
        this.log = log.extend(this.nickname)
        this.mlsStore = new MlsStore(deviceKey, this.log)
        this.groupStore = new GroupStore(this.mlsStore, this.log)
        this.epochKeyService = new EpochKeyService(this.cipherSuite, this.mlsStore, this.log)
    }

    public async initialize() {
        log(`initialize ${this.nickname}`)
        this.log('initialize')
        this.client = await MlsClient.create(this.userAddress)
    }

    public async createGroup(streamId: string): Promise<Uint8Array> {
        this.log(`createGroup ${streamId}`)
        const group = await this.client.createGroup()
        const groupInfoWithExternalKey = (
            await group.groupInfoMessageAllowingExtCommit(true)
        ).toBytes()
        await this.groupStore.addGroup(Group.createGroup(streamId, group, groupInfoWithExternalKey))
        return groupInfoWithExternalKey
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        log(`encrypt ${this.nickname} ${streamId}`)
        this.log('encrypt', { message: shortenHexString(bin_toHexString(message)) })
        const groupState = await this.groupStore.getGroup(streamId)
        if (!groupState) {
            throw new Error('MLS group not found')
        }

        if (groupState.state.status !== 'GROUP_ACTIVE') {
            throw new Error('MLS group not in active state')
        }

        const group = groupState.state.group
        const epoch = group.currentEpoch

        // Check if we have derived keys, if not try deriving them
        const epochKey = this.epochKeyService.getEpochKey(streamId, epoch)
        if (epochKey.state.status !== 'EPOCH_KEY_DERIVED') {
            throw new Error('Epoch keys not derived')
        }

        const ciphertext = await this.cipherSuite.seal(epochKey.state.publicKey, message)
        return new EncryptedData({
            algorithm: 'mls',
            mlsCiphertext: ciphertext.toBytes(),
            mlsEpoch: epoch,
        })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        log(`decrypt ${this.nickname} ${streamId}`)
        const groupState = await this.groupStore.getGroup(streamId)
        if (!groupState) {
            throw new Error('MLS group not found')
        }

        if (groupState.state.status !== 'GROUP_ACTIVE') {
            throw new Error('MLS group not in active state')
        }

        if (!encryptedData.mlsCiphertext) {
            throw new Error('Not an MLS payload')
        }

        const epoch = encryptedData.mlsEpoch
        if (epoch === undefined) {
            throw new Error('No epoch specified')
        }
        const epochKey = this.epochKeyService.getEpochKey(streamId, epoch)

        if (epochKey.state.status !== 'EPOCH_KEY_DERIVED') {
            throw new Error('Epoch keys not derived')
        }

        const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsCiphertext)
        return await this.cipherSuite.open(
            ciphertext,
            epochKey.state.secretKey,
            epochKey.state.publicKey,
        )
    }

    public async externalJoin(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array; epoch: bigint }> {
        this.log(`externalJoin ${this.nickname} {streamId}`)
        if (await this.groupStore.hasGroup(streamId)) {
            throw new Error('Group already exists')
        }

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        const groupInfoWithExternalKey = (
            await group.groupInfoMessageAllowingExtCommit(true)
        ).toBytes()
        const commitBytes = commit.toBytes()
        await this.groupStore.addGroup(
            Group.externalJoin(streamId, group, commitBytes, groupInfoWithExternalKey),
        )
        return {
            groupInfo: groupInfoWithExternalKey,
            commit: commitBytes,
            epoch: group.currentEpoch,
        }
    }

    private async handleCommit(streamId: string, commit: Uint8Array): Promise<void> {
        const group = await this.groupStore.getGroup(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        if (group.state.status !== 'GROUP_ACTIVE') {
            throw new Error('Group not in active state')
        }
        const mlsGroup = group.state.group
        await mlsGroup.processIncomingMessage(MlsMessage.fromBytes(commit))
        const secret = await mlsGroup.currentEpochSecret()
        const epoch = mlsGroup.currentEpoch
        this.log('handleCommit', { epoch, commit: shortenHexString(bin_toHexString(commit)) })
        await this.epochKeyService.addOpenEpochSecret(streamId, epoch, secret.toBytes())
    }

    public async hasGroup(streamId: string): Promise<boolean> {
        return await this.groupStore.hasGroup(streamId)
    }

    public async awaitGroupActive(streamId: string): Promise<void> {
        this.log(`awaitGroupActive ${streamId}`)
        const awaiting = this.awaitingGroupActive.get(streamId)
        if (awaiting) {
            return await awaiting.promise
        }
        if ((await this.groupStore.getGroup(streamId))?.state.status === 'GROUP_ACTIVE') {
            return
        }
        const awaiter = new Awaiter(this.awaitTimeoutMS)
        this.awaitingGroupActive.set(streamId, awaiter)
        await awaiter.promise
        this.awaitingGroupActive.delete(streamId)

        return awaiter.promise
    }

    public async handleInitializeGroup(
        streamId: string,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<Group | undefined> {
        // - If we have a group in PENDING_CREATE, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - and we did not sent the message,
        //     then we clear it, and request to join using external join
        // - Any other state should be impossible

        const group = await this.groupStore.getGroup(streamId)

        // TODO: Are other cases even possible?
        if (!group) {
            return undefined
        }
        if (group.state.status !== 'GROUP_PENDING_CREATE') {
            return group
        }

        const ourGroupInfoWithExternalKey = group.state.groupInfoWithExternalKey

        const ourOwnInitializeGroup: boolean =
            uint8ArrayEqual(userAddress, this.userAddress) &&
            uint8ArrayEqual(deviceKey, this.deviceKey) &&
            uint8ArrayEqual(groupInfoWithExternalKey, ourGroupInfoWithExternalKey)

        if (ourOwnInitializeGroup) {
            group.markActive()
            await this.groupStore.updateGroup(group)
            // add a key to the epoch store
            const epoch = group.state.group.currentEpoch
            const epochSecret = await group.state.group.currentEpochSecret()
            await this.epochKeyService.addOpenEpochSecret(streamId, epoch, epochSecret.toBytes())
            // check if anyone is waiting for it
            this.awaitingGroupActive.get(streamId)?.resolve()
            return group
        } else {
            // Someone else created a group
            await this.groupStore.clearGroup(streamId)

            // let's initialise a new group
            return undefined
        }
    }

    public async handleExternalJoin(
        streamId: string,
        userAddress: Uint8Array,
        deviceKey: Uint8Array,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
        epoch: bigint,
    ): Promise<Group | undefined> {
        // - If we have a group in PENDING_CREATE,
        //   then we clear it, and request to join using external join
        // - If we have a group in PENDING_JOIN, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - we did not send the message,
        //     then we clear it, and request to join using external join
        // - If we have a group in ACTIVE,
        //   then we process the commit,
        const group = await this.groupStore.getGroup(streamId)
        if (!group) {
            return undefined
        }
        switch (group.state.status) {
            case 'GROUP_PENDING_CREATE':
                await this.groupStore.clearGroup(streamId)
                return undefined
            case 'GROUP_PENDING_JOIN': {
                const groupEpoch = group.state.group.currentEpoch
                if (epoch < groupEpoch) {
                    this.log('skipping old join message', {
                        epoch,
                        groupEpoch,
                        groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
                        commit: shortenHexString(bin_toHexString(commit)),
                    })
                    return group
                }
                if (epoch > groupEpoch) {
                    this.log('group info was stale for join message, clearing group', {
                        epoch,
                        groupEpoch,
                        groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
                        commit: shortenHexString(bin_toHexString(commit)),
                    })
                    await this.groupStore.clearGroup(streamId)
                    return undefined
                }

                const ownPendingJoin: boolean =
                    uint8ArrayEqual(userAddress, this.userAddress) &&
                    uint8ArrayEqual(deviceKey, this.deviceKey) &&
                    uint8ArrayEqual(commit, group.state.commit) &&
                    uint8ArrayEqual(groupInfoWithExternalKey, group.state.groupInfoWithExternalKey)
                if (!ownPendingJoin) {
                    this.log('someone else joined, clearing group', {
                        epoch,
                        groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
                        commit: shortenHexString(bin_toHexString(commit)),
                    })
                    await this.groupStore.clearGroup(streamId)
                    return undefined
                }

                group.markActive()
                await this.groupStore.updateGroup(group)
                const joinedEpoch = group.state.group.currentEpoch
                this.log('joining group', {
                    epoch: joinedEpoch,
                    groupInfo: shortenHexString(bin_toHexString(groupInfoWithExternalKey)),
                    commit: shortenHexString(bin_toHexString(commit)),
                })
                // add a key to the epoch store
                const epochSecret = await group.state.group.currentEpochSecret()
                await this.epochKeyService.addOpenEpochSecret(
                    streamId,
                    joinedEpoch,
                    epochSecret.toBytes(),
                )
                this.awaitingGroupActive.get(streamId)?.resolve()
                return group
            }
            case 'GROUP_ACTIVE':
                await this.handleCommit(streamId, commit)
                return group
        }
    }

    public async handleKeyAnnouncement(
        streamId: string,
        key: { epoch: bigint; key: Uint8Array },
    ): Promise<void> {
        await this.epochKeyService.addSealedEpochSecret(streamId, key.epoch, key.key)
    }

    public async epochFor(streamId: string): Promise<bigint> {
        const group = await this.groupStore.getGroup(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        if (group.state.status !== 'GROUP_ACTIVE') {
            throw new Error('Group not in active state')
        }
        return group.state.group.currentEpoch
    }
}
