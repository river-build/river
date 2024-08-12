import * as dotenv from 'dotenv'
import deploymentData from '@river-build/generated/config/deployments.json'
import { z } from 'zod'

import { ChainConfig } from './types'

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

const riverDeploymentConfig = makeConfig(deploymentData, env.RIVER_ENV)

export const config = {
	port: env.PORT,
	riverDeploymentConfig,
} as const

console.log('config:', config)

interface DeploymentsJson {
	[riverEnv: string]: {
		river: {
			chainId: number
			addresses: {
				riverRegistry: string
			}
		}
	}
}

interface AllChainConfig {
	[riverEnv: string]: {
		chainId: number
		riverRegistry: string
	}
}

// TODO: use @river-build/web3 getDeployment function instead
function makeConfig(deploymentsJson: DeploymentsJson, riverEnv: string): ChainConfig {
	const allChainConfig: AllChainConfig = {}

	for (const key in deploymentsJson) {
		const envConfig = deploymentsJson[key]
		if (envConfig.river) {
			allChainConfig[key] = {
				chainId: envConfig.river.chainId,
				riverRegistry: envConfig.river.addresses.riverRegistry,
			}
		}
	}

	if (!allChainConfig[riverEnv].chainId || !allChainConfig[riverEnv].riverRegistry) {
		throw new Error('chainId or riverRegistry undefined')
	}

	return {
		chainId: allChainConfig[riverEnv].chainId,
		riverRegistry: allChainConfig[riverEnv].riverRegistry,
	}
}
