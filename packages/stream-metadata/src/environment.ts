import * as dotenv from 'dotenv'

import { getWeb3Deployment } from '@river-build/web3'

const isDev = process.env.NODE_ENV === 'development'
const envFile = isDev ? '.env.localhost' : '.env'

console.log('NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev, 'envFile:', envFile)

dotenv.config({
	path: envFile,
})

export const SERVER_PORT = parseInt(process.env.PORT ?? '443', 10)
export const config = getWeb3Deployment(process.env.RIVER_ENV ?? 'omega')

console.log('config:', config)
