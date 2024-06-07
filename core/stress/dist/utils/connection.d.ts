import { LocalhostWeb3Provider } from '@river-build/web3';
import { RiverConfig } from '@river/sdk';
import { ethers } from 'ethers';
export declare function makeConnection(config: RiverConfig, wallet?: ethers.Wallet): Promise<{
    userId: string;
    wallet: ethers.Wallet;
    delegateWallet: ethers.Wallet;
    signerContext: import("@river/sdk").SignerContext;
    config: {
        environmentId: string;
        base: {
            rpcUrl: string;
            chainConfig: import("@river-build/web3").BaseChainConfig;
        };
        river: {
            rpcUrl: string;
            chainConfig: import("@river-build/web3").RiverChainConfig;
        };
    };
    baseProvider: LocalhostWeb3Provider;
    riverProvider: LocalhostWeb3Provider;
    rpcClient: import("@river/sdk").StreamRpcClient;
}>;
export type Connection = Awaited<ReturnType<typeof makeConnection>>;
//# sourceMappingURL=connection.d.ts.map