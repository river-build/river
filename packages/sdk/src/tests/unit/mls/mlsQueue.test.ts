/**
 * @group main
 */

import { MlsQueue } from '../../../mls/mlsQueue'
import { MlsConfirmedEvent, MlsConfirmedSnapshot } from '../../../mls/types'

describe('MlsQueueTests', () => {
    let queue: MlsQueue
    const streamId = 'stream-id'

    beforeEach(() => {
        queue = new MlsQueue()
    })

    it('empty should dequeue nothing', () => {
        expect(queue.dequeueStreamUpdate()).toBeUndefined()
    })

    it('should enqueue an empty stream update', () => {
        queue.enqueueStreamUpdate(streamId)
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId,
        })
        expect(queue.dequeueStreamUpdate()).toBeUndefined()
    })

    it('should enqueue a confirmed event', () => {
        const event = Symbol('event')

        queue.enqueueConfirmedEvent(streamId, event as unknown as MlsConfirmedEvent)

        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId,
            confirmedEvents: [event],
        })
        expect(queue.dequeueStreamUpdate()).toBeUndefined()
    })

    it('should enqueue the same stream once', () => {
        const one = Symbol('one')
        const two = Symbol('two')
        queue.enqueueConfirmedEvent(streamId, one as unknown as MlsConfirmedEvent)
        queue.enqueueConfirmedEvent(streamId, two as unknown as MlsConfirmedEvent)
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId,
            confirmedEvents: [one, two],
        })
        expect(queue.dequeueStreamUpdate()).toBeUndefined()
    })

    it('should enqueue a confirmed snapshot', () => {
        const snapshot = Symbol('snapshot')
        queue.enqueueConfirmedSnapshot(streamId, snapshot as unknown as MlsConfirmedSnapshot)
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId,
            snapshots: [snapshot],
        })
    })

    // TODO: Property-based testing
    it('should enqueue streams in order they are enqueued first', () => {
        queue.enqueueConfirmedEvent('stream-1', {} as MlsConfirmedEvent)
        queue.enqueueConfirmedSnapshot('stream-2', {} as MlsConfirmedSnapshot)
        queue.enqueueConfirmedEvent('stream-3', {} as MlsConfirmedEvent)
        queue.enqueueConfirmedSnapshot('stream-1', {} as MlsConfirmedSnapshot)
        queue.enqueueConfirmedEvent('stream-4', {} as MlsConfirmedEvent)

        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId: 'stream-1',
        })
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId: 'stream-2',
        })
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId: 'stream-3',
        })
        expect(queue.dequeueStreamUpdate()).toMatchObject({
            streamId: 'stream-4',
        })
        expect(queue.dequeueStreamUpdate()).toBeUndefined()
    })

    it('should tick after staring', () => {
        // TODO
    })
})
