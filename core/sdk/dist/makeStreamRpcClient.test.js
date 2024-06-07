/**
 * @group main
 */
import { Err, InfoRequest } from '@river-build/proto';
import { makeTestRpcClient } from './util.test';
import { errorContains } from './makeStreamRpcClient';
import { makeRiverRpcClient } from './makeRiverRpcClient';
import { LocalhostWeb3Provider } from '@river-build/web3';
import { makeRiverChainConfig } from './riverConfig';
describe('protocol 1', () => {
    test('info using makeStreamRpcClient', async () => {
        const client = await makeTestRpcClient();
        expect(client).toBeDefined();
        const response = await client.info(new InfoRequest({}), {
            timeoutMs: 10000,
        });
        expect(response).toBeDefined();
        expect(response.graffiti).toEqual('River Node welcomes you!');
    });
    test('info-error using makeStreamRpcClient', async () => {
        const client = await makeTestRpcClient();
        expect(client).toBeDefined();
        try {
            await client.info(new InfoRequest({ debug: ['error'] }));
            expect(true).toBe(false);
        }
        catch (err) {
            expect(errorContains(err, Err.DEBUG_ERROR)).toBe(true);
        }
    });
    describe('protocol 2', () => {
        let provider;
        let riverConfig;
        beforeAll(async () => {
            riverConfig = makeRiverChainConfig();
            provider = new LocalhostWeb3Provider(riverConfig.rpcUrl);
        });
        test('info using makeRiverRpcClient', async () => {
            const client = await makeRiverRpcClient(provider, riverConfig.chainConfig);
            expect(client).toBeDefined();
            const response = await client.info(new InfoRequest({}), {
                timeoutMs: 10000,
            });
            expect(response).toBeDefined();
            expect(response.graffiti).toEqual('River Node welcomes you!');
        });
        test('info-error using makeRiverRpcClient', async () => {
            const client = await makeRiverRpcClient(provider, riverConfig.chainConfig);
            expect(client).toBeDefined();
            try {
                await client.info(new InfoRequest({ debug: ['error'] }));
                expect(true).toBe(false);
            }
            catch (err) {
                expect(errorContains(err, Err.DEBUG_ERROR)).toBe(true);
            }
        });
    });
});
//# sourceMappingURL=makeStreamRpcClient.test.js.map