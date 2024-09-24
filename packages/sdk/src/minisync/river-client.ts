import type { TODO } from './utils'

type TxRiver = TODO<`Transactional River Client
    - should have a queue of operations so we can retry if
        - the client changes
        - connection offline
    `>

type OneOf_SpecificInstruction = TODO<'OneOf_SpecificInstruction'>

type I = {
    listen: (streamId: string) => E.Effect<void, never, never>
    send: (streamId: string, data: OneOf_SpecificInstruction) => E.Effect<void, never, never>
}

class RiverClient extends Context.Tag('RiverClient')<TODO, TxRiver> {}

const mkTxRiver = E.gen(function* () {
    const riverClient = yield* RiverClient
})
