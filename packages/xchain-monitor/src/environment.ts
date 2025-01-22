import * as dotenv from 'dotenv'
import { z } from 'zod'
import { getWeb3Deployment } from '@river-build/web3'
import { v4 } from 'uuid'

dotenv.config({
    path: ['.env', '.env.local'],
})

const IntStringSchema = z.string().regex(/^[0-9]+$/)
const BoolStringSchema = z.string().regex(/^(true|false)$/)

const NumberFromIntStringSchema = IntStringSchema.transform((str) => parseInt(str, 10))
const BoolFromStringSchema = BoolStringSchema.transform((str) => str === 'true')

const envMainSchema = z.object({
   RIVER_ENV: z.string(),
   INITIAL_BLOCK_NUM: z.string().transform((str) => BigInt(str)),
   TRANSACTION_VALID_BLOCKS: NumberFromIntStringSchema.optional().default("20"),
   BASE_PROVIDER_URL: z.string(),
   LOG_LEVEL: z.string().optional().default('info'),
   LOG_PRETTY: BoolFromStringSchema.optional().default('true'),
})

function makeConfig() {
    const envMain = envMainSchema.parse(process.env)
    const web3Config = getWeb3Deployment(envMain.RIVER_ENV)
    const initialBlockNum = envMain.INITIAL_BLOCK_NUM
    const transactionValidBlocks = envMain.TRANSACTION_VALID_BLOCKS
    const baseProviderUrl = envMain.BASE_PROVIDER_URL

    return {
        web3Config,
        initialBlockNum,
        transactionValidBlocks,
        baseProviderUrl,
        log: {
            pretty: envMain.LOG_PRETTY,
            level: envMain.LOG_LEVEL,
        },
		instance: {
			id: v4(),
			deployedAt: new Date().toISOString(),
		},
    }
}

export const config = makeConfig()