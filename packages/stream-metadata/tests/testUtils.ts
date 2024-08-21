import 'fake-indexeddb/auto' // used to mock indexdb in dexie, don't remove
import { ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-node'
import { StreamService } from '@river-build/proto'
import { createPromiseClient } from '@connectrpc/connect'
import { foundry } from 'viem/chains'
import {
	Client,
	genId,
	makeSignerContext,
	makeSpaceStreamId,
	RiverDbManager,
	SignerContext,
	userIdFromAddress,
} from '@river-build/sdk'
import { ethers } from 'ethers'
import { createSpaceDapp, LocalhostWeb3Provider } from '@river-build/web3'

import { StreamRpcClient } from '../src/riverStreamRpcClient'
import { testConfig } from './testEnvironment'
import { getRiverRegistry } from '../src/evmRpcClient'
import { TestEntitlements } from './testEntitlements'

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

	// arg: user context and wallet
	const { context, wallet } = await makeRandomUserContext()
	const provider = new LocalhostWeb3Provider(testConfig.baseChainRpcUrl, wallet)
	// need funds to create space and execute tranasctions
	await provider.fundWallet()

	// arg: stream rpc client
	const nodeUrl = await getAnyNodeUrlFromRiverRegistry()
	if (!nodeUrl) {
		throw new Error('No nodes available')
	}
	const rpcClient = makeStreamRpcClient(nodeUrl)

	// arg: crypto store
	const deviceId = `${genId(5)}`
	const userId = userIdFromAddress(context.creatorAddress)
	const dbName = `database-${userId}-${deviceId}`
	const cryptoStore = RiverDbManager.getCryptoDb(userId, dbName)

	// arg: entitlements delegate
	const spaceDapp = createSpaceDapp(provider, testConfig.web3Config.base)
	const xchainRpcUrls = [foundry.rpcUrls.public.http[0]]
	const entitlementsDelegate = new TestEntitlements(spaceDapp, xchainRpcUrls)

	// arg: persistence db name
	const persistenceDbName = `persistence-${userId}-${deviceId}`

	// create the client with all the args
	return new Client(context, rpcClient, cryptoStore, entitlementsDelegate, persistenceDbName)
}

export async function makeRandomUserContext(): Promise<{
	wallet: ethers.Wallet
	context: SignerContext
}> {
	const wallet = ethers.Wallet.createRandom()
	return {
		wallet,
		context: await makeUserContextFromWallet(wallet),
	}
}

export async function makeUserContextFromWallet(wallet: ethers.Wallet): Promise<SignerContext> {
	const userPrimaryWallet = wallet
	const delegateWallet = ethers.Wallet.createRandom()
	return makeSignerContext(userPrimaryWallet, delegateWallet, { days: 1 })
}

export function makeMediaChunks(numberOfChunks: number, chunkSize: number): Uint8Array[] {
	const chunks: Uint8Array[] = []

	for (let i = 0; i < numberOfChunks; i++) {
		const chunk = new Uint8Array(chunkSize)
		chunk.fill(i)
		chunks.push(chunk)
	}

	return chunks
}

export async function sendMediaChunks(
	client: Client,
	mediaStreamId: string,
	chunks: Uint8Array[],
	prevMiniblockHash: Uint8Array,
): Promise<void> {
	for (const [index, chunk] of chunks.entries()) {
		const { prevMiniblockHash: hash } = await client.sendMediaPayload(
			mediaStreamId,
			chunk,
			index,
			prevMiniblockHash,
		)
		prevMiniblockHash = hash
	}
}

export async function createMediaStream(
	client: Client,
	numberOfChunks: number,
): Promise<void> {
	const chunks = makeMediaChunks(numberOfChunks, 10)
	const { prevMiniblockHash } = await client.createMediaStream(mediaStreamId)
	await sendMediaChunks(client, mediaStreamId, chunks, prevMiniblockHash)
}
)
