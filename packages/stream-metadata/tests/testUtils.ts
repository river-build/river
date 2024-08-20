import { ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-node'
import { StreamService } from '@river-build/proto'
import { createPromiseClient } from '@connectrpc/connect'
import {
	Client,
	genId,
	makeSignerContext,
	makeSpaceStreamId,
	MockEntitlementsDelegate,
	RiverDbManager,
	SignerContext,
	userIdFromAddress,
} from '@river-build/sdk'
import { ethers } from 'ethers'
import { LocalhostWeb3Provider } from '@river-build/web3'

import { StreamRpcClient } from '../src/riverStreamRpcClient'
import { testConfig } from './testEnvironment'
import { getRiverRegistry } from '../src/evmRpcClient'

export function isTest(): boolean {
	return (
		process.env.NODE_ENV === 'test' ||
		process.env.TS_JEST === '1' ||
		process.env.JEST_WORKER_ID !== undefined
	)
}

export function makeUniqueSpaceStreamId(): string {
	return makeSpaceStreamId(genId(40))
}

export function getTestServerUrl() {
	// use the .env.test config to derive the baseURL of the server under test
	const { host, port, riverEnv } = testConfig
	const protocol = riverEnv.startsWith('local') ? 'http' : 'https'
	const baseURL = `${protocol}://${host}:${port}`
	return baseURL
}

export async function getAnyNodeUrlFromRiverRegistry() {
	const riverRegistry = getRiverRegistry()
	const nodes = await riverRegistry.getAllNodeUrls()

	if (!nodes || nodes.length === 0) {
		return undefined
	}

	const randomIndex = Math.floor(Math.random() * nodes.length)
	const anyNode = nodes[randomIndex]

	return anyNode.url
}

export function makeStreamRpcClient(url: string): StreamRpcClient {
	const options: ConnectTransportOptions = {
		httpVersion: '2',
		baseUrl: url,
	}

	const transport = createConnectTransport(options)
	const client: StreamRpcClient = createPromiseClient(StreamService, transport)
	client.url = url

	return client
}

export async function makeTestClient() {
	// create all the constructor arguments for the SDK client

	// create a new wallet for the user
	const context = await makeRandomUserContext()
	const provider = new LocalhostWeb3Provider(testConfig.baseChainRpcUrl, bobsWallet)
	const entitlementsDelegate = new MockEntitlementsDelegate()
	const deviceId = `${genId(5)}`
	const userId = userIdFromAddress(context.creatorAddress)
	const dbName = `database-${userId}-${deviceId}`
	const persistenceDbName = `persistence-${userId}${deviceId}`
	// create a new client with store(s)
	const cryptoStore = RiverDbManager.getCryptoDb(userId, dbName)

	//
	const nodeUrl = await getAnyNodeUrlFromRiverRegistry()
	if (!nodeUrl) {
		throw new Error('No nodes available')
	}
	const rpcClient = makeStreamRpcClient(nodeUrl)

	return new Client(context, rpcClient, cryptoStore, entitlementsDelegate, persistenceDbName)
}

export async function makeRandomUserContext(): Promise<SignerContext> {
	const wallet = ethers.Wallet.createRandom()
	return makeUserContextFromWallet(wallet)
}

export async function makeUserContextFromWallet(wallet: ethers.Wallet): Promise<SignerContext> {
	const userPrimaryWallet = wallet
	const delegateWallet = ethers.Wallet.createRandom()
	return makeSignerContext(userPrimaryWallet, delegateWallet, { days: 1 })
}
