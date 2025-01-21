import { EncryptedData } from '@river-build/proto'
import { LocalEpochSecret } from './localView'
import { Message } from '@bufbuild/protobuf'
import { ExternalInfo } from './onChainView'
import {
    ExportedTree as MlsExportedTree,
    MlsMessage,
    Client as MlsClient,
} from '@river-build/mls-rs-wasm'
import {
    createGroupInfoAndExternalSnapshot,
    makeExternalJoin,
    makeInitializeGroup,
} from '../tests/multi_ne/mls/utils'
import { MLS_ALGORITHM } from './constants'
import { DerivedKeys, EpochEncryption } from './epochEncryption'
import { DecryptedContent, EncryptedContent, toDecryptedContent } from '../encryptedContentTypes'

const encoder = new TextEncoder()
const encode = (s: string) => encoder.encode(s)
const decoder = new TextDecoder()
const decode = (bytes: Uint8Array) => decoder.decode(bytes)
const crypto = new EpochEncryption()

export class MlsMessages {
    public static async encryptEpochSecretMessage(
        epochSecret: LocalEpochSecret,
        event: Message,
    ): Promise<EncryptedData> {
        const plaintext_ = event.toJsonString()
        const plaintext = encode(plaintext_)

        const ciphertext = await crypto.seal(epochSecret.derivedKeys, plaintext)

        return new EncryptedData({
            algorithm: MLS_ALGORITHM,
            mls: {
                epoch: epochSecret.epoch,
                ciphertext,
            },
        })
    }

    public static async decryptEpochSecretMessage(
        derivedKeys: DerivedKeys,
        kind: EncryptedContent['kind'],
        ciphertext: Uint8Array,
    ): Promise<DecryptedContent> {
        const cleartext_ = await crypto.open(derivedKeys, ciphertext)
        const cleartext = decode(cleartext_)
        return toDecryptedContent(kind, cleartext)
    }

    public static async prepareExternalJoinMessage(
        mlsClient: MlsClient,
        externalInfo: ExternalInfo,
    ) {
        const groupInfoMessage = MlsMessage.fromBytes(externalInfo.latestGroupInfo)
        const exportedTree = MlsExportedTree.fromBytes(externalInfo.exportedTree)
        const { group, commit } = await mlsClient.commitExternal(groupInfoMessage, exportedTree)
        const updatedGroupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
        const updatedGroupInfoMessageBytes = updatedGroupInfoMessage.toBytes()
        const commitBytes = commit.toBytes()
        const event = makeExternalJoin(
            mlsClient.signaturePublicKey(),
            commitBytes,
            updatedGroupInfoMessageBytes,
        )
        const message = { content: event }
        return {
            group,
            message,
        }
    }

    public static async prepareInitializeGroup(mlsClient: MlsClient) {
        const group = await mlsClient.createGroup()
        const { groupInfoMessage, externalGroupSnapshot } =
            await createGroupInfoAndExternalSnapshot(group)
        const event = makeInitializeGroup(
            mlsClient.signaturePublicKey(),
            externalGroupSnapshot,
            groupInfoMessage,
        )
        const message = { content: event }
        return {
            group,
            message,
        }
    }
}
