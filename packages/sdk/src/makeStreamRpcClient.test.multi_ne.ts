/**
 * @group main
 */

import { Err, InfoRequest, InfoResponse } from '@river-build/proto'
import { makeTestRpcClient } from './test-utils'
import { errorContains } from './rpcInterceptors'
import { makeRiverRpcClient } from './makeRiverRpcClient'
import { LocalhostWeb3Provider } from '@river-build/web3'
import { makeRiverChainConfig } from './riverConfig'

describe('protocol 1', () => {
    it('info using makeStreamRpcClient', async () => {
        const client = await makeTestRpcClient()
        expect(client).toBeDefined()

        const response: InfoResponse = await client.info(new InfoRequest({}), {
            timeoutMs: 10000,
        })
        expect(response).toBeDefined()
        expect(response.graffiti).toEqual('River Node welcomes you!')
    })

    it('info-error using makeStreamRpcClient', async () => {
        const client = await makeTestRpcClient()
        expect(client).toBeDefined()

        try {
            await client.info(new InfoRequest({ debug: ['error'] }))
            expect(true).toBe(false)
        } catch (err) {
            expect(errorContains(err, Err.DEBUG_ERROR)).toBe(true)
        }
    })

    describe('protocol 2', () => {
        let provider: LocalhostWeb3Provider
        let riverConfig: ReturnType<typeof makeRiverChainConfig>

        beforeAll(async () => {
            riverConfig = makeRiverChainConfig()
            provider = new LocalhostWeb3Provider(riverConfig.rpcUrl)
        })

        it('info using makeRiverRpcClient', async () => {
            const client = await makeRiverRpcClient(provider, riverConfig.chainConfig)
            expect(client).toBeDefined()

            const response: InfoResponse = await client.info(new InfoRequest({}), {
                timeoutMs: 10000,
            })
            expect(response).toBeDefined()
            expect(response.graffiti).toEqual('River Node welcomes you!')
        })

        it('info-error using makeRiverRpcClient', async () => {
            const client = await makeRiverRpcClient(provider, riverConfig.chainConfig)
            expect(client).toBeDefined()

            try {
                await client.info(new InfoRequest({ debug: ['error'] }))
                expect(true).toBe(false)
            } catch (err) {
                expect(errorContains(err, Err.DEBUG_ERROR)).toBe(true)
            }
        })
    })
})
