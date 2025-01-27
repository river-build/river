import { EncryptedData, MemberPayload_Mls } from '@river-build/proto'
import { LocalEpochSecret } from './localView'
import { Message, PlainMessage } from '@bufbuild/protobuf'
import { ExternalInfo } from './onChainView'
import {
    Client as MlsClient,
    ExportedTree as MlsExportedTree,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import {
    createGroupInfoAndExternalSnapshot,
    makeExternalJoin,
    makeInitializeGroup,
} from '../tests/multi_ne/mls/utils'
import { MLS_ALGORITHM, MLS_ENCRYPTED_DATA_VERSION } from './constants'
import { EpochEncryption } from './epochEncryption'

const crypto = new EpochEncryption()

export class MlsMessages {
    public static async encryptEpochSecretMessage(
        epochSecret: LocalEpochSecret,
        event: Message,
    ): Promise<EncryptedData> {
        const plaintext = event.toBinary()
        const ciphertext = await crypto.seal(epochSecret.derivedKeys, plaintext)

        return new EncryptedData({
            algorithm: MLS_ALGORITHM,
            mls: {
                epoch: epochSecret.epoch,
                ciphertext,
            },
            version: MLS_ENCRYPTED_DATA_VERSION,
        })
    }

    public static epochSecretsMessage(
        epochSecrets: { epoch: bigint; secret: Uint8Array }[],
    ): PlainMessage<MemberPayload_Mls> {
        return {
            content: {
                case: 'epochSecrets',
                value: {
                    secrets: epochSecrets,
                },
            },
        }
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
