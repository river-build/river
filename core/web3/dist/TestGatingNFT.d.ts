export declare function toEIP55Address(address: `0x${string}`): `0x${string}`;
export declare function isEIP55Address(address: `0x${string}`): boolean;
export declare function isHexString(value: unknown): value is `0x${string}`;
export declare class TestGatingNFT {
    publicMint(toAddress: string): Promise<void>;
}
export declare function getContractAddress(nftName: string): Promise<`0x${string}`>;
export declare function getTestGatingNFTContractAddress(): Promise<`0x${string}`>;
export declare function publicMint(nftName: string, toAddress: `0x${string}`): Promise<void>;
//# sourceMappingURL=TestGatingNFT.d.ts.map