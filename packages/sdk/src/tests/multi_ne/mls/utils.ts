import { StreamTimelineEvent } from '../../../types'
import { getChannelMessagePayload } from '../../testUtils'
import { MlsAdapter } from '../../../mls'
import { Client } from '../../../client'
import { MlsInspector } from '../../../mls/utils/inspector'
import { ExternalClient as MlsExternalClient, Group as MlsGroup } from '@river-build/mls-rs-wasm'
import { ExternalJoin, InitializeGroup } from '../../../mls/view/types'
import {
    MemberPayload_Mls_ExternalJoin,
    MemberPayload_Mls_InitializeGroup,
} from '@river-build/proto'

function getPayloadRemoteEvent(event: StreamTimelineEvent): string | undefined {
    if (event.decryptedContent?.kind === 'channelMessage') {
        return getChannelMessagePayload(event.decryptedContent.content)
    }
    return undefined
}

function getPayloadLocalEvent(event: StreamTimelineEvent): string | undefined {
    if (event.localEvent?.channelMessage) {
        return getChannelMessagePayload(event.localEvent.channelMessage)
    }
    return undefined
}

function getPayload(event: StreamTimelineEvent): string | undefined {
    const payload = getPayloadRemoteEvent(event)
    if (payload) {
        return payload
    }
    return getPayloadLocalEvent(event)
}

export function checkTimelineContainsAll(
    messages: string[],
    timeline: StreamTimelineEvent[],
): boolean {
    const checks = new Set(messages)
    for (const event of timeline) {
        const payload = getPayload(event)
        if (payload) {
            checks.delete(payload)
        }
    }
    return checks.size === 0
}

export function getInspector(client: Client): MlsInspector {
    const adapter: MlsAdapter = client['mlsAdapter'] as MlsAdapter
    expect(adapter).toBeDefined()
    expect(adapter).toBeInstanceOf(MlsAdapter)
    return adapter.getInspector()
}

export function getCurrentEpoch(client: Client, streamId: string): bigint {
    const inspector = getInspector(client)
    const group = inspector.groupService.getGroup(streamId)!
    expect(group).toBeDefined()
    return inspector.groupService.currentEpoch(group)
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
