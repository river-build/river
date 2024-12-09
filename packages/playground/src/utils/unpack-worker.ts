import type { Envelope, Miniblock, StreamAndCookie } from '@river-build/proto'
import {
    type ParsedEvent,
    type ParsedMiniblock,
    type ParsedStreamAndCookie,
    type ParsedStreamResponse,
    type UnpackEnvelopeOpts,
    Unpacker,
} from '@river-build/sdk'
import workerpool from 'workerpool'

const unpacker = new Unpacker()

// instance that we can pass to the sync agent
export class UnpackerWorker {
    private pool: workerpool.Pool

    constructor(pool: workerpool.Pool) {
        this.pool = pool
    }

    unpackStream = async (
        stream: StreamAndCookie | undefined,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedStreamResponse> => {
        const res = await this.pool.exec('unpackStream', [stream, opts])
        return res as ParsedStreamResponse
    }

    unpackStreamEnvelopes = async (
        stream: StreamAndCookie,
        opts: UnpackEnvelopeOpts | undefined,
    ) => {
        const res = await this.pool.exec('unpackStreamEnvelopes', [stream, opts])
        return res as ParsedEvent[]
    }
    unpackStreamEx = async (miniblocks: Miniblock[], opts: UnpackEnvelopeOpts | undefined) => {
        const res = await this.pool.exec('unpackStreamEx', [miniblocks, opts])
        return res as ParsedStreamResponse
    }

    unpackEnvelope = async (envelope: Envelope, opts: UnpackEnvelopeOpts | undefined) => {
        const res = await this.pool.exec('unpackEnvelope', [envelope, opts])
        return res as ParsedEvent
    }

    unpackEnvelopes = async (envelopes: Envelope[], opts: UnpackEnvelopeOpts | undefined) => {
        const res = await this.pool.exec('unpackEnvelopes', [envelopes, opts])
        return res as ParsedEvent[]
    }

    unpackMiniblock = async (miniblock: Miniblock, opts: UnpackEnvelopeOpts | undefined) => {
        const res = await this.pool.exec('unpackMiniblock', [miniblock, opts])
        return res as ParsedMiniblock
    }

    unpackStreamAndCookie = async (
        stream: StreamAndCookie,
        opts: UnpackEnvelopeOpts | undefined,
    ) => {
        const res = await this.pool.exec('unpackStreamAndCookie', [stream, opts])
        return res as ParsedStreamAndCookie
    }
}

workerpool.worker({
    unpackStream: unpacker.unpackStream,
    unpackStreamEnvelopes: unpacker.unpackStreamEnvelopes,
    unpackEnvelope: unpacker.unpackEnvelope,
    unpackEnvelopes: unpacker.unpackEnvelopes,
    unpackStreamAndCookie: unpacker.unpackStreamAndCookie,
    unpackMiniblock: unpacker.unpackMiniblock,
})
