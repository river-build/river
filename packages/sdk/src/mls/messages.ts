import {
    EncryptedData,
    MemberPayload_Mls,
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'
import { LocalEpochSecret } from './view/local'
import { Message, PlainMessage } from '@bufbuild/protobuf'
import { RemoteGroupInfo } from './view/remote'
import {
    Client as MlsClient,
    ExternalClient as MlsExternalClient,
    Group as MlsGroup,
    ExportedTree as MlsExportedTree,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import { MLS_ALGORITHM, MLS_ENCRYPTED_DATA_VERSION } from './constants'
import { EpochEncryption } from './epochEncryption'
import { ExternalJoin, InitializeGroup } from './types'

const crypto = new EpochEncryption()

export async function encryptEpochSecretMessage(
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

export function epochSecretsMessage(
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

export async function prepareExternalJoinMessage(
    mlsClient: MlsClient,
    externalInfo: RemoteGroupInfo,
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

export async function prepareInitializeGroup(mlsClient: MlsClient) {
    const group = await mlsClient.createGroup()
    const { groupInfoMessage, externalGroupSnapshot } = await createGroupInfoAndExternalSnapshot(
        group,
    )
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

export function makeInitializeGroup(
    signaturePublicKey: Uint8Array,
    externalGroupSnapshot: Uint8Array,
    groupInfoMessage: Uint8Array,
): InitializeGroup {
    const value = new MemberPayload_Mls_InitializeGroup({
        signaturePublicKey: signaturePublicKey,
        externalGroupSnapshot: externalGroupSnapshot,
        groupInfoMessage: groupInfoMessage,
    })
    return {
        case: 'initializeGroup',
        value,
    }
}

export function makeExternalJoin(
    signaturePublicKey: Uint8Array,
    commit: Uint8Array,
    groupInfoMessage: Uint8Array,
): ExternalJoin {
    const value = new MemberPayload_Mls_ExternalJoin({
        signaturePublicKey: signaturePublicKey,
        commit: commit,
        groupInfoMessage: groupInfoMessage,
    })
    return {
        case: 'externalJoin',
        value,
    }
}

// helper function to create a group + external snapshot
export async function createGroupInfoAndExternalSnapshot(group: MlsGroup): Promise<{
    groupInfoMessage: Uint8Array
    externalGroupSnapshot: Uint8Array
}> {
    const groupInfoMessage = await group.groupInfoMessageAllowingExtCommit(false)
    const tree = group.exportTree()
    const externalClient = new MlsExternalClient()
    const externalGroup = externalClient.observeGroup(groupInfoMessage.toBytes(), tree.toBytes())

    const externalGroupSnapshot = (await externalGroup).snapshot()
    return {
        groupInfoMessage: groupInfoMessage.toBytes(),
        externalGroupSnapshot: externalGroupSnapshot.toBytes(),
    }
}
