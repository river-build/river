import {
    Client as MlsClient,
    Group as MlsGroup,
    MlsMessage,
    CipherSuite as MlsCipherSuite,
    Secret as MlsSecret,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
} from '@river-build/mls-rs-wasm'
import { EncryptedData } from '@river-build/proto'
import { hexToBytes } from 'ethereum-cryptography/utils'

type EpochKeyStatus =
    | 'EPOCH_KEY_MISSING'
    | 'EPOCH_KEY_SEALED'
    | 'EPOCH_KEY_OPEN'
    | 'EPOCH_KEY_DERIVED'

type EpochIdentifier = string & { __brand: 'EPOCH_IDENTIFIER' }

function epochIdentifier(streamId: string, epoch: bigint): EpochIdentifier {
    return `${streamId}:${epoch}` as EpochIdentifier
}

type DerivedKeys = {
    secretKey: HpkeSecretKey
    publicKey: HpkePublicKey
}

export class EpochKeyStore {
    private sealedEpochSecrets: Map<EpochIdentifier, HpkeCiphertext> = new Map()
    private openEpochSecrets: Map<EpochIdentifier, MlsSecret> = new Map()
    private derivedKeys: Map<EpochIdentifier, DerivedKeys> = new Map()
    private cipherSuite: MlsCipherSuite

    public constructor(cipherSuite: MlsCipherSuite) {
        this.cipherSuite = cipherSuite
    }

    public getEpochKeyStatus(streamId: string, epoch: bigint): EpochKeyStatus {
        const epochId = epochIdentifier(streamId, epoch)
        if (this.derivedKeys.has(epochId)) {
            return 'EPOCH_KEY_DERIVED'
        }
        if (this.openEpochSecrets.has(epochId)) {
            return 'EPOCH_KEY_OPEN'
        }
        if (this.sealedEpochSecrets.has(epochId)) {
            return 'EPOCH_KEY_SEALED'
        }
        return 'EPOCH_KEY_MISSING'
    }

    public addSealedEpochSecret(
        streamId: string,
        epoch: bigint,
        sealedEpochSecretBytes: Uint8Array,
    ) {
        const epochId = epochIdentifier(streamId, epoch)
        const sealedEpochSecret = HpkeCiphertext.fromBytes(sealedEpochSecretBytes)
        this.sealedEpochSecrets.set(epochId, sealedEpochSecret)
    }

    public getSealedEpochSecret(streamId: string, epoch: bigint): HpkeCiphertext | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.sealedEpochSecrets.get(epochId)
    }

    public addOpenEpochSecret(streamId: string, epoch: bigint, openEpochSecret: MlsSecret) {
        const epochId = epochIdentifier(streamId, epoch)
        this.openEpochSecrets.set(epochId, openEpochSecret)
    }

    public getOpenEpochSecret(streamId: string, epoch: bigint): MlsSecret | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.openEpochSecrets.get(epochId)
    }

    public addDerivedKeys(
        streamId: string,
        epoch: bigint,
        secretKey: HpkeSecretKey,
        publicKey: HpkePublicKey,
    ) {
        const epochId = epochIdentifier(streamId, epoch)
        this.derivedKeys.set(epochId, { secretKey, publicKey })
    }

    public getDerivedKeys(
        streamId: string,
        epoch: bigint,
    ): { publicKey: HpkePublicKey; secretKey: HpkeSecretKey } | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        const keys = this.derivedKeys.get(epochId)
        if (keys) {
            return { ...keys }
        }
        return undefined
    }

    private async openEpochSecret(streamId: string, epoch: bigint) {
        const sealedEpochSecret = this.getSealedEpochSecret(streamId, epoch)!
        const { publicKey, secretKey } = this.getDerivedKeys(streamId, epoch + 1n)!
        const openEpochSecretBytes = await this.cipherSuite.open(
            sealedEpochSecret,
            secretKey,
            publicKey,
        )
        const openEpochSecret = MlsSecret.fromBytes(openEpochSecretBytes)

        this.addOpenEpochSecret(streamId, epoch, openEpochSecret)
    }

    public async tryOpenEpochSecret(streamId: string, epoch: bigint): Promise<EpochKeyStatus> {
        let status = this.getEpochKeyStatus(streamId, epoch)
        if (status === 'EPOCH_KEY_SEALED') {
            const nextEpochStatus = this.getEpochKeyStatus(streamId, epoch + 1n)
            if (nextEpochStatus === 'EPOCH_KEY_DERIVED') {
                await this.openEpochSecret(streamId, epoch)

                // Update the status
                status = this.getEpochKeyStatus(streamId, epoch)
            }
        }
        return Promise.resolve(status)
    }

    private async deriveKeys(streamId: string, epoch: bigint) {
        const openEpochSecret = this.getOpenEpochSecret(streamId, epoch)!
        const { publicKey, secretKey } = await this.cipherSuite.kemDerive(openEpochSecret)
        this.addDerivedKeys(streamId, epoch, secretKey, publicKey)
    }

    public async tryDeriveKeys(streamId: string, epoch: bigint): Promise<EpochKeyStatus> {
        let status = this.getEpochKeyStatus(streamId, epoch)

        if (status === 'EPOCH_KEY_OPEN') {
            await this.deriveKeys(streamId, epoch)

            // Update the status
            status = this.getEpochKeyStatus(streamId, epoch)
        }

        return Promise.resolve(status)
    }
}

type GroupStatus = 'GROUP_MISSING' | 'GROUP_PENDING_CREATE' | 'GROUP_PENDING_JOIN' | 'GROUP_ACTIVE'

type GroupState =
    | {
          state: 'GROUP_PENDING_CREATE'
          group: MlsGroup
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          state: 'GROUP_PENDING_JOIN'
          group: MlsGroup
          commit: Uint8Array
          groupInfoWithExternalKey: Uint8Array
      }
    | {
          state: 'GROUP_ACTIVE'
          group: MlsGroup
      }

export class GroupStore {
    private groups: Map<string, GroupState> = new Map()

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public getGroupStatus(streamId: string): GroupStatus {
        const group = this.groups.get(streamId)
        if (!group) {
            return 'GROUP_MISSING'
        }
        return group.state
    }

    public addGroupViaCreate(
        streamId: string,
        group: MlsGroup,
        groupInfoWithExternalKey: Uint8Array,
    ): void {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const groupState: GroupState = {
            state: 'GROUP_PENDING_CREATE',
            group,
            groupInfoWithExternalKey,
        }

        this.groups.set(streamId, groupState)
    }

    public addGroupViaExternalJoin(
        streamId: string,
        group: MlsGroup,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): void {
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const groupState: GroupState = {
            state: 'GROUP_PENDING_JOIN',
            group,
            commit,
            groupInfoWithExternalKey,
        }
        this.groups.set(streamId, groupState)
    }

    public getGroup(streamId: string): GroupState | undefined {
        return this.groups.get(streamId)
    }

    public setGroupState(streamId: string, state: GroupState): void {
        this.groups.set(streamId, state)
    }

    public clear(streamId: string): void {
        this.groups.delete(streamId)
    }
}

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()
    public deviceKey: Uint8Array
    cipherSuite: MlsCipherSuite = new MlsCipherSuite()
    epochKeyStore = new EpochKeyStore(this.cipherSuite)
    groupStore: GroupStore = new GroupStore()

    constructor(userAddress: string, deviceKey: Uint8Array) {
        this.userAddress = userAddress
        this.deviceKey = deviceKey
    }

    async initialize() {
        this.client = await MlsClient.create(this.userAddress)
    }

    public async createGroup(streamId: string): Promise<Uint8Array> {
        const group = await this.client.createGroup()
        this.groups.set(streamId, group)
        const epochSecret = await group.currentEpochSecret()
        this.epochKeyStore.addOpenEpochSecret(streamId, group.currentEpoch, epochSecret)
        return (await group.groupInfoMessageAllowingExtCommit(true)).toBytes()
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        const groupState = this.groupStore.getGroup(streamId)
        if (!groupState) {
            throw new Error('MLS group not found')
        }

        if (groupState.state !== 'GROUP_ACTIVE') {
            throw new Error('MLS group not in active state')
        }

        const group = groupState.group
        const epoch = group.currentEpoch

        // Check if we have derived keys, if not try deriving them
        const epochKeyStatus = await this.epochKeyStore.tryDeriveKeys(streamId, epoch)
        if (epochKeyStatus !== 'EPOCH_KEY_DERIVED') {
            throw new Error('Epoch keys not derived')
        }

        const keys = this.epochKeyStore.getDerivedKeys(streamId, epoch)!

        const ciphertext = await this.cipherSuite.seal(keys.publicKey, message)
        return new EncryptedData({ algorithm: 'mls', mlsCiphertext: ciphertext.toBytes() })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const groupState = this.groupStore.getGroup(streamId)
        if (!groupState) {
            throw new Error('MLS group not found')
        }

        if (groupState.state !== 'GROUP_ACTIVE') {
            throw new Error('MLS group not in active state')
        }

        if (!encryptedData.mlsCiphertext) {
            throw new Error('Not an MLS payload')
        }

        const group = groupState.group
        const epoch = group.currentEpoch
        const epochKeyStatus = await this.epochKeyStore.tryDeriveKeys(streamId, epoch)

        if (epochKeyStatus !== 'EPOCH_KEY_DERIVED') {
            throw new Error('Epoch keys not derived')
        }

        const keys = this.epochKeyStore.getDerivedKeys(streamId, epoch)!
        const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsCiphertext)
        return await this.cipherSuite.open(ciphertext, keys.secretKey, keys.publicKey)
    }

    public async externalJoin(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array; epoch: bigint }> {
        if (this.groupStore.hasGroup(streamId)) {
            throw new Error('Group already exists')
        }

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        const groupInfoWithExternalKey = (
            await group.groupInfoMessageAllowingExtCommit(true)
        ).toBytes()
        this.groupStore.addGroupViaExternalJoin(
            streamId,
            group,
            commit.toBytes(),
            groupInfoWithExternalKey,
        )
        return {
            groupInfo: groupInfoWithExternalKey,
            commit: commit.toBytes(),
            epoch: group.currentEpoch,
        }
    }

    public async handleCommit(streamId: string, commit: Uint8Array): Promise<void> {
        const groupState = this.groupStore.getGroup(streamId)
        if (!groupState) {
            throw new Error('Group not found')
        }
        if (groupState.state !== 'GROUP_ACTIVE') {
            throw new Error('Group not in active state')
        }
        const group = groupState.group
        await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        const secret = await group.currentEpochSecret()
        const epoch = group.currentEpoch
        this.epochKeyStore.addOpenEpochSecret(streamId, epoch, secret)
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public async handleInitializeGroup(
        streamId: string,
        userAddress: string,
        deviceKey: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<GroupStatus> {
        // - If we have a group in PENDING_CREATE, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - and we did not sent the message,
        //     then we clear it, and request to join using external join
        // - Any other state should be impossible

        const groupState = this.groupStore.getGroup(streamId)

        // TODO: Are other cases even possible?
        if (!groupState) {
            return 'GROUP_MISSING'
        }
        if (groupState.state !== 'GROUP_PENDING_JOIN') {
            return groupState.state
        }

        const ourGroupInfoWithExternalKey = groupState.groupInfoWithExternalKey

        const ourOwnInitializeGroup: boolean =
            userAddress === this.userAddress &&
            deviceKey === this.deviceKey &&
            groupInfoWithExternalKey === ourGroupInfoWithExternalKey

        if (ourOwnInitializeGroup) {
            this.groupStore.setGroupState(streamId, {
                state: 'GROUP_ACTIVE',
                group: groupState.group,
            })

            return 'GROUP_ACTIVE'
        } else {
            // Someone else created a group
            this.groupStore.clear(streamId)

            // let's initialise a new group
            return 'GROUP_MISSING'
        }
    }

    public async handleExternalJoin(
        streamId: string,
        userAddress: string,
        deviceKey: Uint8Array,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<GroupStatus> {
        // - If we have a group in PENDING_CREATE,
        //   then we clear it, and request to join using external join
        // - If we have a group in PENDING_JOIN, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - we did not send the message,
        //     then we clear it, and request to join using external join
        // - If we have a group in ACTIVE,
        //   then we process the commit,
        const groupState = this.groupStore.getGroup(streamId)
        if (!groupState) {
            return 'GROUP_MISSING'
        }
        switch (groupState.state) {
            case 'GROUP_PENDING_CREATE':
                this.groupStore.clear(streamId)
                return 'GROUP_MISSING'
            case 'GROUP_PENDING_JOIN': {
                const ownPendingJoin: boolean =
                    userAddress === this.userAddress &&
                    deviceKey === this.deviceKey &&
                    commit === groupState.commit &&
                    groupInfoWithExternalKey === groupState.groupInfoWithExternalKey
                if (!ownPendingJoin) {
                    this.groupStore.clear(streamId)
                    return 'GROUP_MISSING'
                }
                this.groupStore.setGroupState(streamId, {
                    state: 'GROUP_ACTIVE',
                    group: groupState.group,
                })
                return 'GROUP_ACTIVE'
            }
            case 'GROUP_ACTIVE':
                return 'GROUP_ACTIVE'
        }
    }

    public async handleKeyAnnouncement(
        streamId: string,
        key: { epoch: bigint; key: Uint8Array },
    ): Promise<void> {
        this.epochKeyStore.addSealedEpochSecret(streamId, key.epoch, key.key)
    }

    public epochFor(streamId: string): bigint {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        return group.currentEpoch
    }
}
