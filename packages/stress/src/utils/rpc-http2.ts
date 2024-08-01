import {
    Code,
    Interceptor,
    PromiseClient,
    StreamRequest,
    StreamResponse,
    UnaryRequest,
    UnaryResponse,
    createPromiseClient,
} from '@connectrpc/connect'
import { ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-node'
import { Err, StreamService } from '@river-build/proto'
import { AnyMessage } from '@bufbuild/protobuf'
import { genShortId, isIConnectError, streamIdAsString } from '@river-build/sdk'
import { dlogger } from '@river-build/dlog'

const histogramIntervalMs = 5000

const logger = dlogger('csb:rpc:info')
const histogramLogger = dlogger('csb:rpc:histogram')
const callsLogger = dlogger('csb:rpc:calls')
const protoLogger = dlogger('csb:rpc:protos')

const sortObjectKey = (obj: Record<string, unknown>) => {
    const sorted: Record<string, unknown> = {}
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sorted[key] = obj[key]
        })
    return sorted
}

export type StreamRpcClient = PromiseClient<typeof StreamService> & { url?: string }

export function makeStreamRpcClient(url: string): StreamRpcClient {
    logger.info(`makeStreamRpcClient: Connecting to url=${url}`)
    const options: ConnectTransportOptions = {
        httpVersion: '2',
        baseUrl: url,
        interceptors: [loggingInterceptor()],
    }
    if (!process.env.RIVER_DEBUG_TRANSPORT) {
        options.useBinaryFormat = true
    } else {
        options.useBinaryFormat = false
        options.jsonOptions = {
            emitDefaultValues: true,
            useProtoFieldName: true,
        }
    }
    const transport = createConnectTransport(options)

    const client: StreamRpcClient = createPromiseClient(StreamService, transport) as StreamRpcClient
    client.url = url
    return client
}

const loggingInterceptor: () => Interceptor = () => {
    // Histogram data structure
    const callHistogram: Record<string, { interval: number; total: number; error?: number }> = {}

    // Function to update histogram
    const updateHistogram = (methodName: string, suffix?: string, error?: boolean) => {
        const name = suffix ? `${methodName} ${suffix}` : methodName
        let e = callHistogram[name]
        if (!e) {
            e = { interval: 0, total: 0 }
            callHistogram[name] = e
        }
        e.interval++
        e.total++
        if (error) {
            e.error = (e.error ?? 0) + 1
        }
    }

    // Periodic logging
    setInterval(() => {
        if (Object.keys(callHistogram).length !== 0) {
            let interval = 0
            let total = 0
            let error = 0
            for (const key in callHistogram) {
                const e = callHistogram[key]
                interval += e.interval
                total += e.total
                error += e.error ?? 0
            }
            if (interval > 0) {
                histogramLogger.info('RPC stats', {
                    interval,
                    total,
                    error,
                    histogramIntervalMs,
                    histogram: sortObjectKey(callHistogram),
                })
                for (const key in callHistogram) {
                    callHistogram[key].interval = 0
                }
            }
        }
    }, histogramIntervalMs)

    return (next) =>
        async (
            req: UnaryRequest<AnyMessage, AnyMessage> | StreamRequest<AnyMessage, AnyMessage>,
        ) => {
            let localReq = req
            const id = genShortId()
            localReq.header.set('x-river-request-id', id)

            let streamId: string | undefined
            if (req.stream) {
                // to intercept streaming request messages, we wrap
                // the AsynchronousIterable with a generator function
                localReq = {
                    ...req,
                    message: logEachRequest(req.method.name, id, req.message),
                }
            } else {
                const streamIdBytes = req.message['streamId'] as Uint8Array
                streamId = streamIdBytes ? streamIdAsString(streamIdBytes) : undefined
                if (streamId !== undefined) {
                    callsLogger.info('StreamId found', { name: req.method.name, streamId, id })
                } else {
                    callsLogger.info('StreamId undefined', { name: req.method.name, id })
                }
                protoLogger.info('Proto log', {
                    name: req.method.name,
                    type: 'REQUEST',
                    id,
                    message: req.message,
                })
            }
            updateHistogram(req.method.name, streamId)

            try {
                const res:
                    | UnaryResponse<AnyMessage, AnyMessage>
                    | StreamResponse<AnyMessage, AnyMessage> = await next(localReq)

                if (res.stream) {
                    // to intercept streaming response messages, we wrap
                    // the AsynchronousIterable with a generator function
                    return {
                        ...res,
                        message: logEachResponse(res.method.name, id, res.message),
                    }
                } else {
                    protoLogger.info('logEachResponse', {
                        name: res.method.name,
                        type: 'RESPONSE',
                        id,
                        message: res.message,
                    })
                }
                return res
            } catch (e) {
                // ignore NotFound errors for GetStream
                if (
                    !(
                        req.method.name === 'GetStream' &&
                        isIConnectError(e) &&
                        e.code === (Code.NotFound as number)
                    )
                ) {
                    logger.error('RPC Error', {
                        name: req.method.name,
                        type: 'ERROR',
                        id,
                        error: e,
                    })
                    updateHistogram(req.method.name, streamId, true)
                }
                throw e
            }
        }
    async function* logEachRequest(name: string, id: string, stream: AsyncIterable<AnyMessage>) {
        try {
            for await (const m of stream) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const syncPos = m['syncPos']
                    if (syncPos !== undefined) {
                        const args = []
                        for (const p of syncPos) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            const s = p['streamId']
                            if (s !== undefined) {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                                args.push(streamIdAsString(s))
                            }
                        }
                        callsLogger.info('logEachRequest', { name, length: args.length, id, args })
                    } else {
                        callsLogger.info('logEachRequest', { name, id })
                    }
                    updateHistogram(name)

                    protoLogger.info('logEachRequest', { name, type: 'STREAMING REQUEST', id, m })
                    yield m
                } catch (err) {
                    logger.error('Request Error', {
                        name,
                        type: 'ERROR YIELDING REQUEST',
                        id,
                        error: err,
                    })
                    updateHistogram(name, undefined, true)
                    throw err
                }
            }
        } catch (err) {
            logger.error('Streaming Request Error', {
                name,
                type: 'ERROR STREAMING REQUEST',
                id,
                error: err,
            })
            updateHistogram(name, undefined, true)
            throw err
        }
        protoLogger.info('Streaming response done', { name, type: 'STREAMING REQUEST DONE', id })
    }

    async function* logEachResponse(name: string, id: string, stream: AsyncIterable<AnyMessage>) {
        try {
            for await (const m of stream) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    const streamId: Uint8Array | undefined = m.stream?.nextSyncCookie?.streamId
                    if (streamId !== undefined) {
                        callsLogger.info('logEachResponse', {
                            name,
                            type: 'RECV',
                            streamId: streamIdAsString(streamId),
                            id,
                        })
                    } else {
                        callsLogger.info('logEachResponse', { name, type: 'RECV', id })
                    }
                    updateHistogram(
                        `${name} RECV`,
                        streamId ? streamIdAsString(streamId) : 'undefined',
                    )
                    protoLogger.info('logEachResponse', { name, type: 'STREAMING RESPONSE', id, m })
                    yield m
                } catch (err) {
                    logger.error('Streaming Response Error', {
                        name,
                        type: 'ERROR YIELDING RESPONSE',
                        id,
                        error: err,
                    })
                    updateHistogram(`${name} RECV`, undefined, true)
                }
            }
        } catch (err) {
            if (err == 'BLIP') {
                callsLogger.info('blip', { name, type: 'BLIP', id })
                updateHistogram(`${name} BLIP`)
            } else if (err == 'SHUTDOWN') {
                callsLogger.info('Shutdown', { name, type: 'SHUTDOWN', id })
                updateHistogram(`${name} SHUTDOWN`)
            } else {
                const stack = err instanceof Error && 'stack' in err ? err.stack ?? '' : ''
                logger.error('Streaming Response Error', {
                    name,
                    type: 'ERROR STREAMING RESPONSE',
                    id,
                    error: err,
                    stack,
                })
                updateHistogram(`${name} RECV`, undefined, true)
            }
            throw err
        }
        protoLogger.info('logEachResponse', { name, type: 'STREAMING RESPONSE DONE', id })
    }
}

/// check to see of the error message contains an Rrc Err defineded in the protocol.proto
export function errorContains(err: unknown, error: Err): boolean {
    if (err !== null && typeof err === 'object' && 'message' in err) {
        const expected = `${error.valueOf()}:${Err[error]}`
        if ((err.message as string).includes(expected)) {
            return true
        }
    }
    return false
}
