// unpackStreamWorker.js
import './tracer' // must come before importing any instrumented module.

import { parentPort } from 'worker_threads'

import { ParsedStreamResponse, unpackStream } from '@river-build/sdk'
import { StreamAndCookie } from '@river-build/proto'

export type WorkerMessage = {
	stream: StreamAndCookie
}

export type WorkerResponse =
	| {
			unpackedResponse: ParsedStreamResponse
	  }
	| {
			error: {
				message: string
				name?: string
				stack?: string
			}
	  }

if (parentPort) {
	parentPort.on('message', async (message: { stream: StreamAndCookie }) => {
		try {
			const unpackedResponse = await unpackStream(message.stream)
			parentPort?.postMessage({ unpackedResponse })
		} catch (error: unknown) {
			const errorResponse: WorkerResponse = {
				error: {
					message: error instanceof Error ? error.message : String(error),
					name: error instanceof Error ? error.name : undefined,
					stack: error instanceof Error ? error.stack : undefined,
				},
			}
			parentPort?.postMessage(errorResponse)
		}
	})
}
