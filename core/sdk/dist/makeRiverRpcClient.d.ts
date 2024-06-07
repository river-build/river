import { RiverChainConfig } from '@river-build/web3';
import { RetryParams, StreamRpcClient } from './makeStreamRpcClient';
import { ethers } from 'ethers';
export declare function makeRiverRpcClient(provider: ethers.providers.Provider, config: RiverChainConfig, retryParams?: RetryParams): Promise<StreamRpcClient>;
//# sourceMappingURL=makeRiverRpcClient.d.ts.map