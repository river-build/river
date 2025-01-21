import { check } from '@river-build/dlog'
import { IStreamStateView } from '../../streamStateView'
import { logNever } from '../../check'

export type ExtractMlsExternalGroupResult = {
    externalGroupSnapshot: Uint8Array
    groupInfoMessage: Uint8Array
    commits: { commit: Uint8Array; groupInfoMessage: Uint8Array }[]
}

export function extractMlsExternalGroup(
    streamView: IStreamStateView,
): ExtractMlsExternalGroupResult | undefined {
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

    const relevantMlsEvents = streamView.timeline
        .slice(indexOfLastSnapshot + 1)
        .flatMap((event) => {
            if (event?.remoteEvent?.event.payload?.value?.content.case === 'mls') {
                return [event.remoteEvent.event.payload.value.content.value]
            }
            return []
        })

    let externalGroupSnapshot: Uint8Array | undefined = snapshot.members?.mls?.externalGroupSnapshot
    let groupInfoMessage = snapshot.members?.mls?.groupInfoMessage
    const commits: { commit: Uint8Array; groupInfoMessage: Uint8Array }[] = []

    function checkMlsGroupIntialised() {
        return (
            externalGroupSnapshot !== undefined &&
            externalGroupSnapshot.length > 0 &&
            groupInfoMessage !== undefined &&
            groupInfoMessage.length > 0
        )
    }

    // select the first group info message from relevantMlsEvents
    for (const event of relevantMlsEvents) {
        switch (event.content.case) {
            case 'initializeGroup':
                if (!checkMlsGroupIntialised()) {
                    externalGroupSnapshot = event.content.value.externalGroupSnapshot
                    groupInfoMessage = event.content.value.groupInfoMessage
                }
                break
            case 'externalJoin':
            case 'welcomeMessage':
                if (checkMlsGroupIntialised()) {
                    commits.push({
                        commit: event.content.value.commit,
                        groupInfoMessage: event.content.value.groupInfoMessage,
                    })
                }
                break
            case 'epochSecrets':
            case 'keyPackage':
            case undefined:
                break
            default:
                logNever(event.content)
        }
    }

    if (!checkMlsGroupIntialised()) {
        return undefined
    }

    return {
        externalGroupSnapshot: externalGroupSnapshot!,
        groupInfoMessage: groupInfoMessage!,
        commits,
    }
}
