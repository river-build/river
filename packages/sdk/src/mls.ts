import {
    Client as MlsClient,
    Group as MlsGroup,
    MlsMessage,
    CipherSuite as MlsCipherSuite,
    Secret as MlsSecret,
    HpkeCiphertext,
    HpkePublicKey,
    HpkeSecretKey,
    CipherSuite,
    Secret,
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

    public addOpenEpochSecret(streamId: string, epoch: bigint, openEpochSecretBytes: Uint8Array) {
        const epochId = epochIdentifier(streamId, epoch)
        const openEpochSecret = Secret.fromBytes(openEpochSecretBytes)
        this.openEpochSecrets.set(epochId, openEpochSecret)
    }

    public getOpenEpochSecret(streamId: string, epoch: bigint): Secret | undefined {
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
        const openEpochSecret = await this.cipherSuite.open(sealedEpochSecret, secretKey, publicKey)
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
}

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()
    public deviceKey: Uint8Array
    epochKeyStore = new EpochKeyStore(new CipherSuite())
    groupStore: GroupStore = new GroupStore()

    constructor(userAddress: string) {
        this.userAddress = userAddress
        this.deviceKey = hexToBytes(userAddress)
    }

    async initialize() {
        this.client = await MlsClient.create(this.userAddress)
    }

    public async createGroup(streamId: string): Promise<Uint8Array> {
        const group = await this.client.createGroup()
        this.groups.set(streamId, group)
        const epochSecret = await group.currentEpochSecret()
        this.epochKeyStore.addOpenEpochSecret(streamId, group.currentEpoch, epochSecret.toBytes())
        return (await group.groupInfoMessageAllowingExtCommit(true)).toBytes()
    }

    public async encrypt(streamId: string, message: Uint8Array): Promise<EncryptedData> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('MLS group not found')
        }

        const cipherSuite = new CipherSuite()
        const epochSecret = await group.currentEpochSecret()
        const keys = await cipherSuite.kemDerive(epochSecret)
        const ciphertext = await cipherSuite.seal(keys.publicKey, message)
        return new EncryptedData({ algorithm: 'mls', mlsCiphertext: ciphertext.toBytes() })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('MLS group not found')
        }

        if (!encryptedData.mlsCiphertext) {
            throw new Error('Not an MLS payload')
        }

        for (const key of this.keys) {
            try {
                const cipherSuite = new CipherSuite()
                const keys = await cipherSuite.kemDerive(Secret.fromBytes(key.key))
                const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsCiphertext)
                return await cipherSuite.open(ciphertext, keys.secretKey, keys.publicKey)
            } catch (e) {
                console.error(`error decrypting using epoch ${key.epoch}`)
            }
        }
        throw new Error('Failed to decrypt')
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

    public async externalJoinFailed(streamId: string) {
        this.groups.delete(streamId)
    }

    public async handleCommit(streamId: string, commit: Uint8Array): Promise<void> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        const secret = await group.currentEpochSecret()
        const epoch = group.currentEpoch
        this.epochKeyStore.addOpenEpochSecret(streamId, epoch, secret.toBytes())
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public async handleGroupInfo(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array } | undefined> {
        // - If we have a group in PENDING_CREATE, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - and we did not sent the message,
        //     then we clear it, and request to join using external join
        // - Any other state should be impossible

        if (this.groups.has(streamId)) {
            return undefined
        }
        console.log('CREATING GROUP FROM BYTES', groupInfo.length)
        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        this.groups.set(streamId, group)
        const updatedGroupInfo = await group.groupInfoMessageAllowingExtCommit(true)
        return {
            groupInfo: updatedGroupInfo.toBytes(),
            commit: commit.toBytes(),
        }
    }

    public async handleExternalJoin(
        streamId: string,
        userAddress: string,
        deviceKey: Uint8Array,
        commit: Uint8Array,
        groupInfoWithExternalKey: Uint8Array,
    ): Promise<void> {
        // - If we have a group in PENDING_CREATE,
        //   then we clear it, and request to join using external join
        // - If we have a group in PENDING_JOIN, and
        //   - we sent the message,
        //     then we can switch that group into a confirmed state; or
        //   - we did not send the message,
        //     then we clear it, and request to join using external join
        // - If we have a group in ACTIVE,
        //   then we process the commit,
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
