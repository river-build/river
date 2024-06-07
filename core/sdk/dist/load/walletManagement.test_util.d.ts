export declare const createAccount: (numberOfAccounts?: number) => {
    address: `0x${string}`;
    privateKey: `0x${string}`;
}[];
export declare function getBalance(address: string): Promise<bigint>;
export declare function deposit(fromAccount: {
    address: string;
    privateKey: string;
}, toAddress: string, ethAmount?: number): Promise<void>;
//# sourceMappingURL=walletManagement.test_util.d.ts.map