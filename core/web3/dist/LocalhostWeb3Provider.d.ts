import { ethers } from 'ethers';
import { BaseChainConfig } from './IStaticContractsInfo';
export declare class LocalhostWeb3Provider extends ethers.providers.JsonRpcProvider {
    wallet: ethers.Wallet;
    get isMetaMask(): boolean;
    constructor(rpcUrl: string, wallet?: ethers.Wallet);
    fundWallet(walletToFund?: ethers.Wallet | string): Promise<boolean>;
    mintMockNFT(config: BaseChainConfig): Promise<ethers.ContractTransaction>;
    request({ method, params, }: {
        method: string;
        params?: unknown[];
    }): Promise<any>;
}
//# sourceMappingURL=LocalhostWeb3Provider.d.ts.map