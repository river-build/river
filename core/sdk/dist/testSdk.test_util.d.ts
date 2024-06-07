import { Client } from './client';
import { ISpaceDapp } from '@river-build/web3';
import { ethers } from 'ethers';
export declare class RiverSDK {
    private readonly spaceDapp;
    client: Client;
    private walletWithProvider;
    constructor(spaceDapp: ISpaceDapp, client: Client, walletWithProvider: ethers.Wallet);
    createChannel(spaceId: string, channelName: string, channelTopic: string): Promise<string>;
    createSpaceWithDefaultChannel(spaceName: string, spaceMetadata: string, defaultChannelName?: string): Promise<{
        spaceStreamId: string;
        defaultChannelStreamId: string;
    }>;
    createSpaceAndChannel(spaceName: string, spaceMetadata: string, channelName: string): Promise<{
        spaceStreamId: string;
        defaultChannelStreamId: string;
    }>;
    joinSpace(spaceId: string): Promise<void>;
    joinChannel(channelId: string): Promise<void>;
    leaveChannel(channelId: string): Promise<void>;
    getAvailableChannels(spaceId: string): Promise<Map<string, string>>;
    sendTextMessage(channelId: string, message: string): Promise<void>;
}
export declare class SpacesWithChannels {
    private records;
    addRecord(key: string, values: string[]): void;
    getRecords(): [string, string[]][];
    getValuesForKey(key: string): string[] | undefined;
    addChannelToSpace(key: string, elementToAdd: string): void;
}
export declare class ChannelSpacePairs {
    private records;
    addRecord(key: string, values: string): void;
    getRecords(): [string, string][];
    getValuesForKey(key: string): string | undefined;
    recoverFromJSON(json: string): void;
}
export declare class ChannelTrackingInfo {
    private channelId;
    private tracked;
    private numUsersJoined;
    constructor(channelId: string);
    getChannelId(): string;
    getTracked(): boolean;
    getNumUsersJoined(): number;
    setChannelId(channelId: string): void;
    setTracked(tracked: boolean): void;
    setNumUsersJoined(numUsersJoined: number): void;
}
export declare function startsWithSubstring(strA: string, strB: string): boolean;
export declare function getRandomInt(n: number): number;
export declare function pauseForXMiliseconds(x: number): Promise<void>;
//# sourceMappingURL=testSdk.test_util.d.ts.map