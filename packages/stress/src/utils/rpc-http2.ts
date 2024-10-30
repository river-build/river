import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-node'
import { StreamService } from '@river-build/proto'
import {
    loggingInterceptor,
    randomUrlSelector,
    retryInterceptor,
    StreamRpcClientOptions,
    type RetryParams,
} from '@river-build/sdk'

export type StreamHttp2RpcClient = PromiseClient<typeof StreamService> & {
    url: string
    opts: StreamRpcClientOptions
}

let nextRpcClientNum = 0

export function makeHttp2StreamRpcClient(
    urls: string,
    retryParams: RetryParams = { maxAttempts: 3, initialRetryDelay: 2000, maxRetryDelay: 6000 },
    refreshNodeUrl?: () => Promise<string>,
): StreamHttp2RpcClient {
    const transportId = nextRpcClientNum++
    const url = randomUrlSelector(urls)
    const options: ConnectTransportOptions = {
        httpVersion: '2',
        baseUrl: url,
        interceptors: [
            loggingInterceptor(transportId),
            retryInterceptor({ ...retryParams, refreshNodeUrl }),
        ],
        defaultTimeoutMs: 20000,
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

    const client: StreamHttp2RpcClient = createPromiseClient(
        StreamService,
        transport,
    ) as StreamHttp2RpcClient
    client.url = url
    client.opts = { retryParams, defaultTimeoutMs: options.defaultTimeoutMs }
    return client
}
