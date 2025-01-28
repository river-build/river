/**
 * @group main
 */

import { beforeAll, beforeEach, describe } from 'vitest'
import { RemoteGroupInfo, RemoteView } from '../../../../mls/view/remote'
import { MlsConfirmedEvent, MlsEvent } from '../../../../mls/types'
import {
    Client as MlsClient,
    ClientOptions as MlsClientOptions,
    MlsMessage,
} from '@river-build/mls-rs-wasm'
import * as MlsMessages from '../../../../mls/messages'
import { randomBytes } from 'crypto'

let eventNo: bigint = 42n

function confirmMlsEvent(event: MlsEvent): MlsConfirmedEvent {
    const confirmedEventNum = eventNo++
    return {
        ...event,
        confirmedEventNum,
        miniblockNum: 0n,
        eventId: `event-${confirmedEventNum}`,
    }
}

const mlsClientOptions: MlsClientOptions = {
    withAllowExternalCommit: true,
    withRatchetTreeExtension: false,
}

let mlsClient: MlsClient

beforeAll(async () => {})

describe('onChainViewTests', () => {
    let view: RemoteView

    beforeEach(() => {
        view = new RemoteView()
    })

    const processInitializeGroup = async () => {
        const mlsClientName = randomBytes(32)
        mlsClient = await MlsClient.create(mlsClientName, mlsClientOptions)
        const prepareInitializeGroup = await MlsMessages.prepareInitializeGroup(mlsClient)
        const confirmedEvent = confirmMlsEvent(prepareInitializeGroup.message.content)
        await view.processConfirmedMlsEvent(confirmedEvent)
        return { event: confirmedEvent, group: prepareInitializeGroup.group }
    }

    const processExternalJoin = async (externalInfo: RemoteGroupInfo) => {
        const mlsClientName = randomBytes(32)
        mlsClient = await MlsClient.create(mlsClientName, mlsClientOptions)
        const prepareExternalJoin = await MlsMessages.prepareExternalJoinMessage(
            mlsClient,
            externalInfo,
        )
        const confirmedEvent = confirmMlsEvent(prepareExternalJoin.message.content)
        await view.processConfirmedMlsEvent(confirmedEvent)
        return { event: confirmedEvent, group: prepareExternalJoin.group }
    }

    it('starts with no external info', () => {
        expect(view.externalInfo).toBeUndefined()
    })

    describe('InitializeGroup', () => {
        it('accepts initialize group', async () => {
            const { event: confirmedEvent } = await processInitializeGroup()
            expect(view.externalInfo).toBeDefined()
            expect(view.accepted.size).toBe(1)
            expect(view.processedCount).toBe(1)
            expect(view.accepted.get(confirmedEvent.eventId)).toStrictEqual(confirmedEvent)
        })

        it('rejects second initialize group', async () => {
            await processInitializeGroup()
            const { event: confirmedEvent2 } = await processInitializeGroup()
            expect(view.rejected.size).toBe(1)
            expect(view.rejected.get(confirmedEvent2.eventId)).toStrictEqual(confirmedEvent2)
        })
    })

    describe('ExternalJoin', () => {
        it('accepts external after the group is initialized join', async () => {
            await processInitializeGroup()
            const externalInfo = view.externalInfo!
            expect(externalInfo).toBeDefined()
            const { event: confirmedEvent } = await processExternalJoin(externalInfo)
            expect(view.accepted.size).toBe(2)
            expect(view.accepted.get(confirmedEvent.eventId)).toStrictEqual(confirmedEvent)
        })

        it('commits appears in commits', async () => {
            const { group } = await processInitializeGroup()
            const externalInfo = view.externalInfo!
            await processExternalJoin(externalInfo)
            expect(view.commits.size).toBe(1)
            const commit = view.commits.get(group.currentEpoch)!
            expect(commit).toBeDefined()
            await group.processIncomingMessage(MlsMessage.fromBytes(commit))
            expect(group.currentEpoch).toBe(1n)
        })

        it('rejects second external join for the same epoch', async () => {
            await processInitializeGroup()
            const externalInfo = view.externalInfo!
            await processExternalJoin(externalInfo)
            const { event: confirmedEvent } = await processExternalJoin(externalInfo)
            expect(view.rejected.size).toBe(1)
            expect(view.rejected.get(confirmedEvent.eventId)).toStrictEqual(confirmedEvent)
        })

        it('rejects external join before group established', async () => {
            await processInitializeGroup()
            const externalInfo = view.externalInfo!
            view = new RemoteView()
            const { event: confirmedEvent } = await processExternalJoin(externalInfo)
            expect(view.rejected.size).toBe(1)
            expect(view.rejected.get(confirmedEvent.eventId)).toStrictEqual(confirmedEvent)
        })
    })

    describe('AnnounceEpochSecrets', () => {
        it('accepts announced epoch secrets', async () => {
            const secret = randomBytes(32)
            const confirmedEpochSecret = confirmMlsEvent({
                case: 'epochSecrets',
                value: {
                    secrets: [{ secret, epoch: 0n }],
                },
            })
            await view.processConfirmedMlsEvent(confirmedEpochSecret)
            expect(view.accepted.size).toBe(1)
            expect(view.sealedEpochSecrets.size).toBe(1)
            expect(view.sealedEpochSecrets.get(0n)).toStrictEqual(secret)
        })
    })

    describe('Snapshot', () => {
        it('can be loaded from snapshot', () => {})
    })
})
