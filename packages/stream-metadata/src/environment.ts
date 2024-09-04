import * as dotenv from 'dotenv'
import { getWeb3Deployment } from '@river-build/web3'
import { z } from 'zod'

dotenv.config({
	path: ['.env', '.env.local'],
})

const IntStringSchema = z.string().regex(/^[0-9]+$/)
const BoolStringSchema = z.string().regex(/^(true|false)$/)

const NumberFromIntStringSchema = IntStringSchema.transform((str) => parseInt(str, 10))
const BoolFromStringSchema = BoolStringSchema.transform((str) => str === 'true')

const envSchema = z.object({
	RIVER_ENV: z.string(),
	RIVER_CHAIN_RPC_URL: z.string().url(),
	BASE_CHAIN_RPC_URL: z.string().url(),
	RIVER_STREAM_METADATA_BASE_URL: z.string().url(),
	PORT: NumberFromIntStringSchema,
	HOST: z.string().optional().default('127.0.0.1'),
	LOG_LEVEL: z.string().optional().default('info'),
	LOG_PRETTY: BoolFromStringSchema.optional().default('true'),
	AWS_REGION: z.string().optional().default('us-east-1'),
	AWS_ACCESS_KEY_ID: z.string().optional(),
	AWS_SECRET_ACCESS_KEY: z.string().optional(),
	CLOUDFRONT_DISTRIBUTION_ID: z.string(),
})

function makeConfig() {
	// eslint-disable-next-line no-process-env -- this is the only line where we're allowed to use process.env
	const env = envSchema.parse(process.env)
	const web3Config = getWeb3Deployment(env.RIVER_ENV)
	const baseUrl = new URL(env.RIVER_STREAM_METADATA_BASE_URL)

	return {
		web3Config,
		riverEnv: env.RIVER_ENV,
		baseChainRpcUrl: env.BASE_CHAIN_RPC_URL,
		riverChainRpcUrl: env.RIVER_CHAIN_RPC_URL,
		streamMetadataBaseUrl: baseUrl.origin,
		host: env.HOST,
		port: env.PORT,
		log: {
			level: env.LOG_LEVEL,
			pretty: env.LOG_PRETTY,
		},
		aws: {
			region: env.AWS_REGION,
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			cloudfrontDistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
		},
	}
}

export const config = makeConfig()
