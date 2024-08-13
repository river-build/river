import * as dotenv from 'dotenv'
import { getWeb3Deployment } from '@river-build/web3'
import { z } from 'zod'

import { Config } from './types'

const IntStringSchema = z.string().regex(/^[0-9]+$/)
const NumberFromIntStringSchema = IntStringSchema.transform((str) => parseInt(str, 10))

const envSchema = z.object({
	RIVER_ENV: z.string(),
	RIVER_CHAIN_RPC_URL: z.string().url(),
	PORT: NumberFromIntStringSchema.optional().default('443'),
	LOG_LEVEL: z.string().optional().default('info'),
	LOG_PRETTY: z.boolean().optional().default(true),
})

function makeConfig(): Config {
	// eslint-disable-next-line no-process-env -- this is the only line where we're allowed to use process.env
	const env = envSchema.parse(process.env)
	const web3Config = getWeb3Deployment(env.RIVER_ENV)

	return {
		...web3Config,
		log: {
			logLevel: env.LOG_LEVEL,
			logPretty: env.LOG_PRETTY,
		},
		port: env.PORT,
		riverEnv: env.RIVER_ENV,
		riverChainRpcUrl: env.RIVER_CHAIN_RPC_URL,
	}
}

dotenv.config({
	path: ['.env', '.env.local'],
})

export const config = makeConfig()

console.log('config', {
	riverEnv: config.riverEnv,
	chainId: config.river.chainId,
	port: config.port,
	riverRegistry: config.river.addresses.riverRegistry,
	riverChainRpcUrl: config.riverChainRpcUrl,
})
