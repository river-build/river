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
})

dotenv.config({
	path: ['.env', '.env.local'],
})

// eslint-disable-next-line no-process-env -- this is the only line where we're allowed to use process.env
const env = envSchema.parse(process.env)

export const config = makeConfig(env.RIVER_ENV, env.RIVER_CHAIN_RPC_URL, env.PORT)

function makeConfig(riverEnv: string, riverChainRpcUrl: string, port: number): Config {
	const web3Config = getWeb3Deployment(riverEnv)
	return {
		...web3Config,
		port,
		riverEnv,
		riverChainRpcUrl,
	}
}

console.log('config', {
	riverEnv: config.riverEnv,
	chainId: config.river.chainId,
	port: config.port,
	riverRegistry: config.river.addresses.riverRegistry,
	riverChainRpcUrl: config.riverChainRpcUrl,
})
