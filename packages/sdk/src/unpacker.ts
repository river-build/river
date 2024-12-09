import { check, bin_equal } from '@river-build/dlog'
import {
    type Envelope,
    Err,
    StreamEvent,
    StreamAndCookie,
    type Miniblock,
    SyncCookie,
} from '@river-build/proto'
import { hasElements, isDefined, assert } from './check'
import { type UnpackEnvelopeOpts, riverHash, checkEventSignature, makeParsedEvent } from './sign'
import type {
    ParsedEvent,
    ParsedMiniblock,
    ParsedStreamAndCookie,
    ParsedStreamResponse,
} from './types'
import { streamIdAsString } from './id'

export class Unpacker {
    unpackStreamAndCookie = async (
        streamAndCookie: StreamAndCookie,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedStreamAndCookie> => {
        assert(streamAndCookie.nextSyncCookie !== undefined, 'bad stream: no cookie')
        const miniblocks = await Promise.all(
            streamAndCookie.miniblocks.map(async (mb) => await this.unpackMiniblock(mb, opts)),
        )
        return {
            events: await this.unpackEnvelopes(streamAndCookie.events, opts),
            nextSyncCookie: streamAndCookie.nextSyncCookie,
            miniblocks: miniblocks,
        }
    }

    unpackStream = async (
        stream: StreamAndCookie | undefined,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedStreamResponse> => {
        assert(stream !== undefined, 'bad stream')
        const streamAndCookie = await this.unpackStreamAndCookie(stream, opts)
        assert(
            stream.miniblocks.length > 0,
            `bad stream: no blocks ${streamIdAsString(streamAndCookie.nextSyncCookie.streamId)}`,
        )

        const snapshot = streamAndCookie.miniblocks[0].header.snapshot
        const prevSnapshotMiniblockNum =
            streamAndCookie.miniblocks[0].header.prevSnapshotMiniblockNum
        assert(
            snapshot !== undefined,
            `bad block: snapshot is undefined ${streamIdAsString(
                streamAndCookie.nextSyncCookie.streamId,
            )}`,
        )
        const eventIds = [
            ...streamAndCookie.miniblocks.flatMap(
                (mb) => mb.events.map((e) => e.hashStr),
                streamAndCookie.events.map((e) => e.hashStr),
            ),
        ]

        return {
            streamAndCookie,
            snapshot,
            prevSnapshotMiniblockNum,
            eventIds,
        }
    }

    // First unpacks miniblocks, including header events, then unpacks events from the minipool
    unpackStreamEnvelopes = async (
        stream: StreamAndCookie,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedEvent[]> => {
        const ret: ParsedEvent[] = []

        for (const mb of stream.miniblocks) {
            ret.push(...(await this.unpackEnvelopes(mb.events, opts)))
            ret.push(await this.unpackEnvelope(mb.header!, opts))
        }

        ret.push(...(await this.unpackEnvelopes(stream.events, opts)))
        return ret
    }

    unpackStreamEx = async (
        miniblocks: Miniblock[],
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedStreamResponse> => {
        const streamAndCookie: StreamAndCookie = new StreamAndCookie()
        streamAndCookie.events = []
        streamAndCookie.miniblocks = miniblocks
        // We don't need to set a valid nextSyncCookie here, as we are currently using getStreamEx only
        // for fetching media streams, and the result does not return a nextSyncCookie. However, it does
        // need to be non-null to avoid runtime errors when unpacking the stream into a StreamStateView,
        // which parses content by type.
        streamAndCookie.nextSyncCookie = new SyncCookie()
        return this.unpackStream(streamAndCookie, opts)
    }

    // returns all events + the header event and pointer to header content
    unpackMiniblock = async (
        miniblock: Miniblock,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedMiniblock> => {
        check(isDefined(miniblock.header), 'Miniblock header is not set')
        const header = await this.unpackEnvelope(miniblock.header, opts)
        check(
            header.event.payload.case === 'miniblockHeader',
            `bad miniblock header: wrong case received: ${header.event.payload.case}`,
        )
        const events = await this.unpackEnvelopes(miniblock.events, opts)
        return {
            hash: miniblock.header.hash,
            header: header.event.payload.value,
            events: [...events, header],
        }
    }

    unpackEnvelopes = async (
        event: Envelope[],
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedEvent[]> => {
        const ret: ParsedEvent[] = []
        //let prevEventHash: Uint8Array | undefined = undefined
        for (const e of event) {
            // TODO: this handling of prevEventHash is not correct,
            // hashes should be checked against all preceding events in the stream.
            ret.push(await this.unpackEnvelope(e, opts))
            //prevEventHash = e.hash!
        }
        return ret
    }

    unpackEnvelope = async (
        envelope: Envelope,
        opts: UnpackEnvelopeOpts | undefined,
    ): Promise<ParsedEvent> => {
        check(hasElements(envelope.event), 'Event base is not set', Err.BAD_EVENT)
        check(hasElements(envelope.hash), 'Event hash is not set', Err.BAD_EVENT)
        check(hasElements(envelope.signature), 'Event signature is not set', Err.BAD_EVENT)

        const event = StreamEvent.fromBinary(envelope.event)
        let hash = envelope.hash

        const doCheckEventHash = opts?.disableHashValidation !== true
        if (doCheckEventHash) {
            hash = riverHash(envelope.event)
            check(bin_equal(hash, envelope.hash), 'Event id is not valid', Err.BAD_EVENT_ID)
        }

        const doCheckEventSignature = opts?.disableSignatureValidation !== true
        if (doCheckEventSignature) {
            checkEventSignature(event, hash, envelope.signature)
        }

        return makeParsedEvent(event, envelope.hash, envelope.signature)
    }
}
