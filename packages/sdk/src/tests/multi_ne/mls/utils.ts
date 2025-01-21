import { StreamTimelineEvent } from '../../../types'
import { getChannelMessagePayload } from '../../testUtils'
import { MlsAdapter } from '../../../mls'
import { Client } from '../../../client'
import { MlsInspector } from '../../../mls/utils/inspector'

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
