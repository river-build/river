import { ethers } from 'ethers';
import { Client } from '../client';
import { ISpaceDapp } from '@river-build/web3';
type ClientWalletInfo = {
    client: Client;
    etherWallet: ethers.Wallet;
    provider: ethers.providers.JsonRpcProvider;
    walletWithProvider: ethers.Wallet;
};
export type ClientWalletRecord = Record<string, ClientWalletInfo>;
export declare function createAndStartClient(account: {
    address: string;
    privateKey: string;
}, jsonRpcProviderUrl: string, nodeRpcURL: string): Promise<ClientWalletInfo>;
export declare function createAndStartClients(accounts: Array<{
    address: string;
    privateKey: string;
}>, jsonRpcProviderUrl: string, nodeRpcURL: string): Promise<ClientWalletRecord>;
export declare function multipleClientsJoinSpaceAndChannel(clientWalletInfos: ClientWalletRecord, spaceId: string, channelId: string | undefined): Promise<void>;
export type ClientSpaceChannelInfo = {
    client: Client;
    spaceDapp: ISpaceDapp;
    spaceId: string;
    channelId: string;
};
export declare function createClientSpaceAndChannel(account: {
    address: string;
    privateKey: string;
}, jsonRpcProviderUrl: string, nodeRpcURL: string, createExtraChannel?: boolean): Promise<ClientSpaceChannelInfo>;
export declare const startMessageSendingWindow: (contentKind: string, windowIndex: number, clients: Client[], channelId: string, messagesSentPerUserMap: Map<string, Set<string>>, windownDuration: number) => void;
export declare const sendMessageAfterRandomDelay: (contentKind: string, senderClient: Client, recipients: string[], channelId: string, windowIndex: string, messagesSentPerUserMap: Map<string, Set<string>>, windownDuration: number) => void;
export declare function getCurrentTime(): string;
export declare function wait(durationMS: number): Promise<void>;
export declare function getUserStreamKey(userId: string, streamId: string): string;
export declare function extractComponents(inputString: string): {
    streamId: string;
    startTimestamp: number;
    messageBody: string;
};
export declare function getRandomElement<T>(arr: T[]): T | undefined;
export declare function getRandomSubset<T>(arr: T[], subsetSize: number): T[];
export {};
//# sourceMappingURL=load.test_util.d.ts.map