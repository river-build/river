// workerPoolManager.ts
import { Worker } from 'worker_threads'
import os from 'os'
import path from 'path'

import { StreamAndCookie } from '@river-build/proto'
import { ParsedStreamResponse } from '@river-build/sdk'
import { FastifyBaseLogger } from 'fastify'

type Task = {
	stream: StreamAndCookie
	resolve: (value: ParsedStreamResponse) => void
	reject: (reason: unknown) => void
}

type WorkerPool = {
	worker: Worker
	workerAvailable: boolean
	resolve?: (value: ParsedStreamResponse) => void
	reject?: (reason: unknown) => void
}

type WorkerResponse =
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

export type WorkerPoolManager = {
	runTask: (stream: StreamAndCookie) => Promise<ParsedStreamResponse>
	terminate: () => void
}

function createWorkerPoolManager(
	logger: FastifyBaseLogger,
	workerScript: string,
): WorkerPoolManager {
	const numCPUs = os.cpus().length
	const workers: WorkerPool[] = []
	const taskQueue: Task[] = []

	function initWorker(index: number) {
		try {
			const worker = new Worker(path.resolve(workerScript))
			const workerPool: WorkerPool = {
				worker,
				workerAvailable: true,
			}

			worker.on('message', (result: WorkerResponse) => {
				if ('error' in result) {
					const error = new Error(result.error.message)
					error.name = result.error.name || 'UnknownError'
					error.stack = result.error.stack
					workerPool.reject?.(error)
				} else {
					workerPool.resolve?.(result.unpackedResponse)
				}
				workerPool.workerAvailable = true
				workerPool.reject = undefined
				workerPool.resolve = undefined
				processQueue()
			})

			worker.on('error', (error) => {
				logger.error({ error, workerIndex: index }, 'Worker error occurred')
				workerPool.workerAvailable = false
				setTimeout(() => initWorker(index), 1000) // Attempt to reinitialize after 1 second
			})

			workers[index] = workerPool
			logger.info({ workerIndex: index }, 'Worker initialized')
		} catch (error) {
			logger.error({ error, workerIndex: index }, 'Failed to initialize worker')
			setTimeout(() => initWorker(index), 1000) // Attempt to reinitialize after 1 second
		}
	}

	function processQueue() {
		const availableWorkerIndex = workers.findIndex((wp) => wp && wp.workerAvailable)
		if (availableWorkerIndex === -1) return

		const task = taskQueue.shift()
		if (task) {
			const workerPool = workers[availableWorkerIndex]
			workerPool.workerAvailable = false
			workerPool.resolve = task.resolve
			workerPool.reject = task.reject
			workerPool.worker.postMessage({ stream: task.stream })
		}
	}

	function runTask(stream: StreamAndCookie): Promise<ParsedStreamResponse> {
		return new Promise((resolve, reject) => {
			taskQueue.push({ stream, resolve, reject })
			processQueue()
		})
	}

	function terminate() {
		workers.forEach((wp) => wp?.worker.terminate())
		logger.info({}, 'Worker pool terminated')
	}

	// Initialize workers
	for (let i = 0; i < numCPUs; i++) {
		initWorker(i)
	}

	logger.info({ workerCount: numCPUs }, 'Worker pool initialization started')

	return { runTask, terminate }
}

let workerPool: WorkerPoolManager | undefined = undefined

export const getUnpackWorkerPool = (logger: FastifyBaseLogger) => {
	if (!workerPool) {
		const pool = createWorkerPoolManager(logger, path.join(__dirname, 'unpackStreamWorker.cjs'))
		process.on('SIGINT', function getUnpackWorkerPoolCleanup() {
			logger.info({}, 'getUnpackWorkerPool: Cleaning up resources...')

			// Remove this handler to prevent infinite loop
			process.removeListener('SIGINT', getUnpackWorkerPoolCleanup)
			pool.terminate()

			// Re-emit the signal to trigger the next handler
			process.kill(process.pid, 'SIGINT')
		})
		workerPool = pool
	}
	return workerPool
}
