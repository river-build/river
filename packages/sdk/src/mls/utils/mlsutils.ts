import { check } from '@river-build/dlog'
import { IStreamStateView } from '../../streamStateView'

import { StreamTimelineEvent } from '../../types'

export type ExtractMlsExternalGroupResult = {
    externalGroupSnapshot: Uint8Array
    groupInfoMessage: Uint8Array
    commits: { commit: Uint8Array; groupInfoMessage: Uint8Array }[]
}

function commitFromEvent(
    event: StreamTimelineEvent,
): { commit: Uint8Array; groupInfoMessage: Uint8Array } | undefined {
    const payload = event.remoteEvent?.event.payload
    if (payload?.case !== 'memberPayload') {
        return undefined
    }
    if (payload?.value?.content.case !== 'mls') {
        return undefined
    }

    const mlsPayload = payload.value.content.value
    switch (mlsPayload.content.case) {
        case 'externalJoin':
        case 'welcomeMessage':
            return {
                commit: mlsPayload.content.value.commit,
                groupInfoMessage: mlsPayload.content.value.groupInfoMessage,
            }
        case undefined:
            return undefined
        default:
            return undefined
    }
}

export function extractMlsExternalGroup(
    streamView: IStreamStateView,
): ExtractMlsExternalGroupResult | undefined {
    // check if there is group info at all
    if (streamView.snapshot?.members?.mls?.groupInfoMessage === undefined) {
        return undefined
    }

    const indexOfLastSnapshot = streamView.timeline.findLastIndex((event) => {
        const payload = event.remoteEvent?.event.payload
        if (payload?.case !== 'miniblockHeader') {
            return false
        }
        return payload.value.snapshot !== undefined
    })

    const payload = streamView.timeline[indexOfLastSnapshot].remoteEvent?.event.payload
    check(payload?.case === 'miniblockHeader', 'no snapshot found')
    const snapshot = payload.value.snapshot
    check(snapshot !== undefined, 'no snapshot found')
    const externalGroupSnapshot = snapshot.members?.mls?.externalGroupSnapshot
    check(externalGroupSnapshot !== undefined, 'no externalGroupSnapshot found')
    const groupInfoMessage = snapshot.members?.mls?.groupInfoMessage
    check(groupInfoMessage !== undefined, 'no groupInfoMessage found')
    const commits: { commit: Uint8Array; groupInfoMessage: Uint8Array }[] = []
    for (let i = indexOfLastSnapshot; i < streamView.timeline.length; i++) {
        const commit = commitFromEvent(streamView.timeline[i])
        if (commit) {
            commits.push(commit)
        }
    }
    return { externalGroupSnapshot, groupInfoMessage, commits: commits }
}

export function mlsCommitsFromStreamView(streamView: IStreamStateView): Uint8Array[] {
    const commits: Uint8Array[] = []
    const firstMiniblockNum = streamView.miniblockInfo?.min ?? 0n
    for (let i = 0; i < streamView.timeline.length; i++) {
        if (streamView.timeline[i].miniblockNum == firstMiniblockNum) {
            continue
        }
        const commit = commitFromEvent(streamView.timeline[i])
        if (commit) {
            commits.push(commit.commit)
        }
    }
    return commits
}

// export function mlsCommitsFromMiniblockHeader(miniblockHeader: MiniblockHeader) {}
