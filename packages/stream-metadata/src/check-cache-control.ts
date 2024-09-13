import type { Server } from './node'

const isEmptyHeader = (header: string | number | string[] | undefined) => {
	if (!header) return true
	if (Array.isArray(header)) return header.length === 0
	if (typeof header === 'string') return header === ''
	if (typeof header === 'number') return header === 0

	return false
}

// Adds a hook to check if the Cache-Control header is missing
export function addCacheControlCheck(
	srv: Server,
	options: {
		skippedRoutes: string[]
	},
) {
	const { skippedRoutes } = options
	srv.addHook('onSend', (request, reply, payload, done) => {
		const shouldCheck = !skippedRoutes.some((route) => request.url.includes(route))

		if (shouldCheck) {
			const cacheControlHeader = reply.getHeader('Cache-Control')
			if (isEmptyHeader(cacheControlHeader)) {
				const headers = reply.getHeaders()
				request.log.warn({ headers, payload }, 'Missing Cache-Control header')
			}
		}

		done()
	})
}
