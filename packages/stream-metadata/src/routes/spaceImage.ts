import { FastifyReply, FastifyRequest } from 'fastify'
import { ChunkedMedia } from '@river-build/proto'
import { StreamPrefix, StreamStateView, makeStreamId } from '@river-build/sdk'

import { StreamIdHex } from '../types'
import { getMediaStreamContent, getStream } from '../riverStreamRpcClient'
import { isBytes32String, isValidEthereumAddress } from '../validators'
import { getLogger } from '../logger'

const logger = getLogger('handleImageRequest')

export async function fetchSpaceImage(request: FastifyRequest, reply: FastifyReply) {
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
		stream = await getStream(streamId)
	} catch (error) {
		logger.error(
			{
				error,
				spaceAddress,
			},
			'Failed to get stream',
		)
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
		return reply.code(422).send('Invalid stream ID')
	}

	let key: Uint8Array | undefined
	let iv: Uint8Array | undefined
	try {
		const { key: _key, iv: _iv } = getEncryption(mediaStreamInfo)
		key = _key
		iv = _iv
		if (!key || !iv) {
			throw new Error('Invalid key or iv')
		}
	} catch (error) {
		logger.error(
			{
				error,
				spaceAddress,
				mediaStreamId: mediaStreamInfo.streamId,
			},
			'Failed to get encryption keys',
		)
		return reply.code(422).send('Failed to get encryption keys')
	}

	let data: ArrayBuffer | null
	let mimeType: string | null
	try {
		const { data: _data, mimeType: _mimType } = await getMediaStreamContent(
			fullStreamId,
			key,
			iv,
		)
		data = _data
		mimeType = _mimType
		if (!data || !mimeType) {
			throw new Error('Invalid data or mimeType')
		}
	} catch (error) {
		logger.error(
			{
				error,
				spaceAddress,
				mediaStreamId: mediaStreamInfo.streamId,
			},
			'Failed to get image content',
		)
		return reply.code(422).send('Failed to get image content')
	}

	if (data && mimeType) {
		return reply.header('Content-Type', mimeType).send(Buffer.from(data))
	} else {
		logger.info(
			{
				spaceAddress,
				mediaStreamId: mediaStreamInfo.streamId,
				mimeType,
				data: data ? 'has image' : 'no image',
			},
			'No image',
		)
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
			logger.error(
				{
					case: chunkedMedia.encryption.case,
					value: chunkedMedia.encryption.value,
				},
				'Unsupported encryption',
			)
			throw new Error('Unsupported encryption')
	}
}
