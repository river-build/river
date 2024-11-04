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
    secretKey: Uint8Array
    publicKey: Uint8Array
}

export class EpochKeyStore {
    private sealedEpochSecrets: Map<EpochIdentifier, Uint8Array> = new Map()
    private openEpochSecrets: Map<EpochIdentifier, Uint8Array> = new Map()
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

    public addSealedEpochSecret(streamId: string, epoch: bigint, sealedEpochSecret: Uint8Array) {
        const epochId = epochIdentifier(streamId, epoch)
        this.sealedEpochSecrets.set(epochId, sealedEpochSecret)
    }

    public getSealedEpochSecret(streamId: string, epoch: bigint): Uint8Array | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.sealedEpochSecrets.get(epochId)
    }

    public addOpenEpochSecret(streamId: string, epoch: bigint, openEpochSecret: Uint8Array) {
        const epochId = epochIdentifier(streamId, epoch)
        this.openEpochSecrets.set(epochId, openEpochSecret)
    }

    public getOpenEpochSecret(streamId: string, epoch: bigint): Uint8Array | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        return this.openEpochSecrets.get(epochId)
    }

    public addDerivedKeys(
        streamId: string,
        epoch: bigint,
        secretKey: Uint8Array,
        publicKey: Uint8Array,
    ) {
        const epochId = epochIdentifier(streamId, epoch)
        this.derivedKeys.set(epochId, { secretKey, publicKey })
    }

    public getDerivedKeys(
        streamId: string,
        epoch: bigint,
    ): { publicKey: Uint8Array; secretKey: Uint8Array } | undefined {
        const epochId = epochIdentifier(streamId, epoch)
        const keys = this.derivedKeys.get(epochId)
        if (keys) {
            return { ...keys }
        }
        return undefined
    }

    private async openEpochSecret(streamId: string, epoch: bigint) {
        const sealedEpochSecret = this.getSealedEpochSecret(streamId, epoch)!
        const nextEpochKeys = this.getDerivedKeys(streamId, epoch + 1n)!
        const hpkeCiphertext = HpkeCiphertext.fromBytes(sealedEpochSecret)
        const hpkePublicKey = HpkePublicKey.fromBytes(nextEpochKeys.publicKey)
        const hpkeSecretKey = HpkeSecretKey.fromBytes(nextEpochKeys.secretKey)
        const openEpochSecret = await this.cipherSuite.open(
            hpkeCiphertext,
            hpkeSecretKey,
            hpkePublicKey,
        )
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
        const mlsSecret = MlsSecret.fromBytes(openEpochSecret)
        const derivedKeys = await this.cipherSuite.kemDerive(mlsSecret)
        const publicKey = derivedKeys.publicKey.toBytes()
        const secretKey = derivedKeys.secretKey.toBytes()
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

export class MlsCrypto {
    private client!: MlsClient
    private userAddress: string
    private groups: Map<string, MlsGroup> = new Map()
    // temp, same for all groups for now // not encrypted for now
    public keys: { epoch: bigint; key: Uint8Array }[] = []
    public deviceKey: Uint8Array

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
        this.keys.push({ epoch: group.currentEpoch, key: epochSecret.toBytes() })
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
        return new EncryptedData({ algorithm: 'mls', mlsPayload: ciphertext.toBytes() })
    }

    public async decrypt(streamId: string, encryptedData: EncryptedData): Promise<Uint8Array> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('MLS group not found')
        }

        if (!encryptedData.mlsPayload) {
            throw new Error('Not an MLS payload')
        }

        for (const key of this.keys) {
            try {
                const cipherSuite = new CipherSuite()
                const keys = await cipherSuite.kemDerive(Secret.fromBytes(key.key))
                const ciphertext = HpkeCiphertext.fromBytes(encryptedData.mlsPayload)
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
        if (this.groups.has(streamId)) {
            throw new Error('Group already exists')
        }

        const { group, commit } = await this.client.commitExternal(MlsMessage.fromBytes(groupInfo))
        this.groups.set(streamId, group)
        const epochSecret = await group.currentEpochSecret()
        this.keys.push({ epoch: group.currentEpoch, key: epochSecret.toBytes() })
        const updatedGroupInfo = await group.groupInfoMessageAllowingExtCommit(true)
        return {
            groupInfo: updatedGroupInfo.toBytes(),
            commit: commit.toBytes(),
            epoch: group.currentEpoch,
        }
    }

    public async externalJoinFailed(streamId: string) {
        this.groups.delete(streamId)
    }

    public async handleCommit(
        streamId: string,
        commit: Uint8Array,
    ): Promise<{ key: Uint8Array; epoch: bigint } | undefined> {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        await group.processIncomingMessage(MlsMessage.fromBytes(commit))
        const secret = await group.currentEpochSecret()
        const epoch = group.currentEpoch
        this.keys.push({ epoch, key: secret.toBytes() }) // should be encrypted
        return { key: secret.toBytes(), epoch: epoch }
    }

    public hasGroup(streamId: string): boolean {
        return this.groups.has(streamId)
    }

    public async handleKeyAnnouncement(
        _streamId: string,
        key: { epoch: bigint; key: Uint8Array },
    ): Promise<void> {
        this.keys.push(key)
    }

    public epochFor(streamId: string): bigint {
        const group = this.groups.get(streamId)
        if (!group) {
            throw new Error('Group not found')
        }
        return group.currentEpoch
    }

    public async handleGroupInfo(
        streamId: string,
        groupInfo: Uint8Array,
    ): Promise<{ groupInfo: Uint8Array; commit: Uint8Array } | undefined> {
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
        deviceKey: string,
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
}
