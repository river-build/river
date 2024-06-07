import { BytesLike, ethers } from 'ethers';
import { ContractVersion } from '../IStaticContractsInfo';
export type PromiseOrValue<T> = T | Promise<T>;
export declare const UNKNOWN_ERROR = "UNKNOWN_ERROR";
export declare class BaseContractShim<T_DEV_CONTRACT extends ethers.Contract, T_DEV_INTERFACE extends ethers.utils.Interface, T_VERSIONED_CONTRACT extends ethers.Contract, T_VERSIONED_INTERFACE extends ethers.utils.Interface> {
    readonly address: string;
    readonly version: ContractVersion;
    readonly contractInterface: ethers.utils.Interface;
    readonly provider: ethers.providers.Provider | undefined;
    readonly signer: ethers.Signer | undefined;
    private readonly abi;
    private readContract?;
    private writeContract?;
    constructor(address: string, version: ContractVersion, provider: ethers.providers.Provider | undefined, abis: Record<ContractVersion, ethers.ContractInterface>);
    get interface(): T_DEV_INTERFACE | T_VERSIONED_INTERFACE;
    get read(): T_DEV_CONTRACT | T_VERSIONED_CONTRACT;
    write(signer: ethers.Signer): T_DEV_CONTRACT | T_VERSIONED_CONTRACT;
    decodeFunctionResult<FnName extends keyof T_DEV_CONTRACT['functions'] | keyof T_VERSIONED_CONTRACT['functions']>(functionName: FnName, data: BytesLike): ethers.utils.Result;
    decodeFunctionData<FnName extends keyof T_DEV_CONTRACT['functions'] | keyof T_VERSIONED_CONTRACT['functions']>(functionName: FnName, data: BytesLike): ethers.utils.Result;
    encodeFunctionData<FnName extends keyof T_DEV_CONTRACT['functions'] | keyof T_VERSIONED_CONTRACT['functions'], FnParams extends Parameters<T_DEV_CONTRACT['functions'][FnName]> | Parameters<T_VERSIONED_CONTRACT['functions'][FnName]>>(functionName: FnName, args: FnParams): string;
    parseError(error: unknown): Error & {
        code?: string;
        data?: unknown;
    };
    private getErrorData;
    parseLog(log: ethers.providers.Log): ethers.utils.LogDescription;
    private createReadContractInstance;
    private createWriteContractInstance;
}
//# sourceMappingURL=BaseContractShim.d.ts.map