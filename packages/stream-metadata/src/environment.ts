import * as dotenv from 'dotenv'

import { Config } from './types'
import { getWeb3Deployment } from '@river-build/web3'

import { z } from 'zod'

const isDev = process.env.NODE_ENV === 'development'
const envFile = '.env.localhost'

dotenv.config({
	path: envFile,
})

const IntStringSchema = z.string().regex(/^[0-9]+$/)
const NumberFromIntStringSchema = IntStringSchema.transform((str) => parseInt(str, 10))

const envSchema = z.object({
	RIVER_ENV: z.string(),
	PORT: NumberFromIntStringSchema.optional().default('443'),
})

// eslint-disable-next-line no-process-env -- this is the only line where we're allowed to use process.env
const env = envSchema.parse(process.env)

export const SERVER_PORT = env.PORT
export const config = makeConfig(process.env.RIVER_ENV, process.env.RIVER_CHAIN_RPC_URL)

function makeConfig(
	riverEnv = 'omega',
	riverChainRpcUrl = 'https://mainnet.rpc.river.build/http',
): Config {
	const web3Config = getWeb3Deployment(riverEnv)
	return {
		...web3Config,
		riverEnv,
		riverChainRpcUrl,
	}
}

console.log('config', {
	riverEnv: config.riverEnv,
	chainId: config.river.chainId,
	riverRegistry: config.river.addresses.riverRegistry,
	riverChainRpcUrl: config.riverChainRpcUrl,
})
