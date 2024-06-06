import { createRiverRegistry } from '@river-build/web3';
import { makeStreamRpcClient } from './makeStreamRpcClient';
export async function makeRiverRpcClient(provider, config, retryParams) {
    const riverRegistry = createRiverRegistry(provider, config);
    const urls = await riverRegistry.getOperationalNodeUrls();
    const rpcClient = makeStreamRpcClient(urls, retryParams, () => riverRegistry.getOperationalNodeUrls());
    return rpcClient;
}
//# sourceMappingURL=makeRiverRpcClient.js.map