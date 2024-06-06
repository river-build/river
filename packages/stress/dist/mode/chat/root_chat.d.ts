import { ChatConfig } from './types';
import { RiverConfig } from '@river/sdk';
import { Wallet } from 'ethers';
export declare function startStressChat(opts: {
    config: RiverConfig;
    processIndex: number;
    rootWallet: Wallet;
}): Promise<{
    summary: {
        containerIndex: number;
        processIndex: number;
        freeMemory: string;
        checkinCounts: Record<string, Record<string, number>>;
    };
    chatConfig: ChatConfig;
    opts: {
        config: RiverConfig;
        processIndex: number;
        rootWallet: Wallet;
    };
}>;
export declare function setupChat(opts: {
    config: RiverConfig;
    rootWallet: Wallet;
    makeAnnounceChannel?: boolean;
    numChannels?: number;
}): Promise<{
    spaceId: string;
    announceChannelId: string;
    channelIds: string[];
}>;
//# sourceMappingURL=root_chat.d.ts.map