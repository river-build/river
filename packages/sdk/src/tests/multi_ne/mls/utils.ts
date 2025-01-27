import { StreamTimelineEvent } from '../../../types'
import { getChannelMessagePayload } from '../../testUtils'
import { ExternalInfo } from '../../../mls/onChainView'
import { Client } from '../../../client'

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

export async function getMlsExternalGroupInfo(
    _client: Client,
    _streamId: string,
): Promise<ExternalInfo> {
    throw new Error('Not implemented')
}
