import { z } from 'zod'

import { config } from '../src/environment'

const envSchema = z.object({
	BASE_CHAIN_RPC_URL: z.string().url(),
})

export function makeTestConfig() {
	// eslint-disable-next-line no-process-env -- this is the only line where we're allowed to use process.env
	const env = envSchema.parse(process.env)

	return {
		...config,
		baseChainRpcUrl: env.BASE_CHAIN_RPC_URL,
	}
}

export const testConfig = makeTestConfig()
