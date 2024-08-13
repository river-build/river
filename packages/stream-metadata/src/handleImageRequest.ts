import { FastifyReply, FastifyRequest } from 'fastify'
import { ChunkedMedia } from '@river-build/proto'
import { StreamPrefix, StreamStateView, makeStreamId } from '@river-build/sdk'

import { getMediaStreamContent, getStream } from './riverStreamRpcClient'
import { isBytes32String, isValidEthereumAddress } from './validators'
import { getLogger } from './logger'
import { StreamIdHex } from './types'
import { config } from './environment'

const logger = getLogger('handleImageRequest')

export async function handleImageRequest(request: FastifyRequest, reply: FastifyReply) {
	const { spaceAddress } = request.params as { spaceAddress?: string }

	if (!spaceAddress) {
		return reply
			.code(400)
			.send({ error: 'Bad Request', message: 'spaceAddress parameter is required' })
	}

	if (!isValidEthereumAddress(spaceAddress)) {
		return reply
			.code(400)
			.send({ error: 'Bad Request', message: 'Invalid spaceAddress format' })
	}

	let stream: StreamStateView | undefined
	try {
		const streamId = makeStreamId(StreamPrefix.Space, spaceAddress)
		stream = await getStream(config, streamId)
	} catch (e) {
		logger.error(`Failed to get stream`, {
			error: e,
			spaceAddress,
		})
		return reply.code(404).send('Stream not found')
	}

	if (!stream) {
		return reply.code(404).send('Stream not found')
	}

	// get the image metatdata from the stream
	const mediaStreamInfo = await getSpaceImage(stream)

	if (!mediaStreamInfo) {
		return reply.code(404).send('Image not found')
	}

	const fullStreamId: StreamIdHex = `0x${mediaStreamInfo.streamId}`
	if (!isBytes32String(fullStreamId)) {
		return reply.code(400).send('Invalid stream ID')
	}

	const { key, iv } = getEncryption(mediaStreamInfo)

	const { data, mimeType } = await getMediaStreamContent(config, fullStreamId, key, iv)

	if (data && mimeType) {
		return reply.header('Content-Type', mimeType).send(Buffer.from(data))
	} else {
		return reply.code(404).send('No image')
	}
}

async function getSpaceImage(streamView: StreamStateView): Promise<ChunkedMedia | undefined> {
	if (streamView.contentKind !== 'spaceContent') {
		return undefined
	}

	const spaceImage = await streamView.spaceContent.getSpaceImage()
	return spaceImage
}

function getEncryption(chunkedMedia: ChunkedMedia): { key: Uint8Array; iv: Uint8Array } {
	switch (chunkedMedia.encryption.case) {
		case 'aesgcm': {
			const key = new Uint8Array(chunkedMedia.encryption.value.secretKey)
			const iv = new Uint8Array(chunkedMedia.encryption.value.iv)
			return { key, iv }
		}
		default:
			logger.error('Unsupported encryption', {
				case: chunkedMedia.encryption.case,
				value: chunkedMedia.encryption.value,
			})
			throw new Error('Unsupported encryption')
	}
}
