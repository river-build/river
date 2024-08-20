import { config } from '../src/environment'

export function isTest(): boolean {
	return (
		process.env.NODE_ENV === 'test' ||
		process.env.TS_JEST === '1' ||
		process.env.JEST_WORKER_ID !== undefined
	)
}

export function getTestServerInfo() {
	// use the .env.test config to derive the baseURL of the server under test
	const { host, port } = config
	const protocol =
		host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' ? 'http' : 'https'
	const baseURL = `${protocol}://${host}:${port}`
	return baseURL
}
