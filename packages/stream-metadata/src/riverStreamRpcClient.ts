import { Worker } from 'worker_threads'
import path from 'path'
import { log } from 'console'

import {
	ParsedStreamResponse,
	StreamStateView,
	assert,
	decryptAESGCM,
	retryInterceptor,
	streamIdAsBytes,
	streamIdAsString,
} from '@river-build/sdk'
import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-node'
import { StreamAndCookie, StreamService } from '@river-build/proto'
import { filetypemime } from 'magic-bytes.js'
import { FastifyBaseLogger } from 'fastify'

import { MediaContent, StreamIdHex } from './types'
import { getNodeForStream } from './streamRegistry'
import { WorkerResponse } from './unpackStreamWorker'
import { config } from './environment'

const clients = new Map<string, StreamRpcClient>()

export type StreamRpcClient = PromiseClient<typeof StreamService> & { url?: string }

function makeStreamRpcClient(logger: FastifyBaseLogger, url: string): StreamRpcClient {
	logger.info({ url }, 'Connecting')

	const options: ConnectTransportOptions = {
		httpVersion: '2',
		baseUrl: url,
		interceptors: [
			retryInterceptor({ maxAttempts: 3, initialRetryDelay: 2000, maxRetryDelay: 6000 }),
		],
	}

	const transport = createConnectTransport(options)
	const client: StreamRpcClient = createPromiseClient(StreamService, transport)
	client.url = url
	return client
}

async function getStreamClient(logger: FastifyBaseLogger, streamId: `0x${string}`) {
	const node = await getNodeForStream(logger, streamId)
	const client = clients.get(node.url) || makeStreamRpcClient(logger, node.url)
	clients.set(node.url, client)

	logger.info({ url: node.url }, 'client connected to node')

	return { client, lastMiniblockNum: node.lastMiniblockNum }
}

function removeClient(logger: FastifyBaseLogger, clientToRemove: StreamRpcClient) {
	logger.info({ url: clientToRemove.url }, 'removeClient')
	if (clientToRemove.url) {
		clients.delete(clientToRemove.url)
	}
}

function streamViewFromUnpackedResponse(
	streamId: string | Uint8Array,
	unpackedResponse: ParsedStreamResponse,
): StreamStateView {
	const streamView = new StreamStateView('userId', streamIdAsString(streamId))
	streamView.initialize(
		unpackedResponse.streamAndCookie.nextSyncCookie,
		unpackedResponse.streamAndCookie.events,
		unpackedResponse.snapshot,
		unpackedResponse.streamAndCookie.miniblocks,
		[],
		unpackedResponse.prevSnapshotMiniblockNum,
		undefined,
		[],
		undefined,
	)
	return streamView
}

async function mediaContentFromStreamView(
	logger: FastifyBaseLogger,
	streamView: StreamStateView,
	secret: Uint8Array,
	iv: Uint8Array,
): Promise<MediaContent> {
	const mediaInfo = streamView.mediaContent.info
	if (!mediaInfo) {
		logger.error(
			{
				spaceId: streamView.streamId,
				mediaStreamId: streamView.mediaContent.streamId,
			},
			'No media information found',
		)
		throw new Error('No media information found')
	}

	logger.info(
		{
			spaceId: mediaInfo.spaceId,
			mediaStreamId: streamView.mediaContent.streamId,
		},
		'decrypting media content in stream',
	)

	// Aggregate data chunks into a single Uint8Array
	const data = new Uint8Array(
		mediaInfo.chunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0),
	)
	let offset = 0
	mediaInfo.chunks.forEach((chunk) => {
		data.set(chunk, offset)
		offset += chunk.length
	})

	// Decrypt the data
	const decrypted = await decryptAESGCM(data, secret, iv)

	// Determine the MIME type
	const mimeType = filetypemime(decrypted)

	if (mimeType?.length === 0) {
		logger.error(
			{
				spaceId: mediaInfo.spaceId,
				mimeType: mimeType?.length > 0 ? mimeType : 'no mimeType',
			},
			'No media information found',
		)
		throw new Error('No media information found')
	}

	logger.info(
		{
			spaceId: mediaInfo.spaceId,
			mediaStreamId: streamView.mediaContent.streamId,
			mimeType,
		},
		'decrypted media content in stream',
	)

	// Return decrypted data and MIME type
	return {
		data: decrypted,
		mimeType: mimeType[0] ?? 'application/octet-stream',
	}
}

function stripHexPrefix(hexString: string): string {
	if (hexString.startsWith('0x')) {
		return hexString.slice(2)
	}
	return hexString
}

const workerPath = path.join(__dirname, 'unpackStreamWorker.cjs')

async function runUnpackStreamInWorker(
	logger: FastifyBaseLogger,
	stream: StreamAndCookie,
): Promise<ParsedStreamResponse> {
	return new Promise((resolve, reject) => {
		logger.info({ workerPath }, 'got workerPath')
		const worker = new Worker(workerPath)

		worker.on('message', async (result: WorkerResponse) => {
			if ('error' in result) {
				reject(new Error(result.error.message))
			} else {
				resolve(result.unpackedResponse)
			}
			await worker.terminate()
		})

		worker.on('error', reject)
		worker.on('exit', (code) => {
			logger.info({ code }, 'on exit')
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`))
			}
		})

		worker.postMessage({ stream })
		logger.info({}, 'posted message')
	})
}

export async function getStream(
	logger: FastifyBaseLogger,
	streamId: string,
): Promise<StreamStateView> {
	const { client, lastMiniblockNum } = await getStreamClient(logger, `0x${streamId}`)
	logger.info(
		{
			nodeUrl: client.url,
			streamId,
			lastMiniblockNum: lastMiniblockNum.toString(),
		},
		'getStream',
	)

	try {
		const start = Date.now()

		const response = await client.getStream({
			streamId: streamIdAsBytes(streamId),
		})

		const duration_ms = Date.now() - start
		logger.info(
			{
				duration_ms,
			},
			'getStream finished',
		)

		const { stream } = response

		assert(stream !== undefined, 'bad stream')

		const unpackedResponse = await runUnpackStreamInWorker(logger, stream)
		return streamViewFromUnpackedResponse(streamId, unpackedResponse)
	} catch (e) {
		logger.error(
			{ url: client.url, streamId, error: e },
			'getStream failed, removing client from cache',
		)
		removeClient(logger, client)
		throw e
	}
}

export async function getMediaStreamContent(
	logger: FastifyBaseLogger,
	fullStreamId: StreamIdHex,
	secret: Uint8Array,
	iv: Uint8Array,
): Promise<MediaContent> {
	const streamId = stripHexPrefix(fullStreamId)
	const sv = await getStream(logger, streamId)
	const result = await mediaContentFromStreamView(logger, sv, secret, iv)
	return result
}
