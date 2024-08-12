import * as dotenv from 'dotenv'

import { getWeb3Deployment } from '@river-build/web3'

const isDev = process.env.NODE_ENV === 'development'
const envFile = isDev ? '.env.localhost' : '.env'

dotenv.config({
	path: envFile,
})

export const SERVER_PORT = parseInt(process.env.PORT ?? '443', 10)
const riverEnv = process.env.RIVER_ENV ?? 'omega'
export const config = getWeb3Deployment(riverEnv)

console.log('config', {
	riverEnv,
	chainId: config.river.chainId,
	riverRegistry: config.river.addresses.riverRegistry,
})
