import type { ChunkedMedia } from '@river-build/proto'
import type { FastifyBaseLogger } from 'fastify'

import { getFunctionLogger } from './logger'

export function getMediaEncryption(
	log: FastifyBaseLogger,
	chunkedMedia: ChunkedMedia,
): { key: Uint8Array; iv: Uint8Array } {
	const logger = getFunctionLogger(log, 'getEncryption')
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
