/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TODO } from './utils'
import { Effect as E, pipe, Queue as Q } from 'effect'

type Tx = TODO<'Model interactions'>

// class TxQueue extends Context.Tag('TxQueue')<TODO, Q.Queue<TODO>> {}

// Each Stream represent a syncable fiber, that will be enqueued to the sync runtime.
// The runtime will get the highest priority streams from the queue and execute the interactions.
// If sometihng i
const mkSyncRuntime = E.gen(function* () {
    const txQueue = yield* Q.unbounded<Tx>()

    return txQueue
})
