import { Client as StreamsClient, RiverConfig } from '@river/sdk';
import { Connection } from './connection';
import { SpaceDapp } from '@river-build/web3';
import { Wallet } from 'ethers';
import { PlainMessage } from '@bufbuild/protobuf';
import { ChannelMessage_Post_Attachment, ChannelMessage_Post_Mention } from '@river-build/proto';
export declare function makeStressClient(config: RiverConfig, clientIndex: number, wallet?: Wallet): Promise<StressClient>;
export declare class StressClient {
    config: RiverConfig;
    clientIndex: number;
    connection: Connection;
    spaceDapp: SpaceDapp;
    streamsClient: StreamsClient;
    constructor(config: RiverConfig, clientIndex: number, connection: Connection, spaceDapp: SpaceDapp, streamsClient: StreamsClient);
    get logId(): string;
    fundWallet(): Promise<void>;
    waitFor<T>(condition: () => T | Promise<T>, opts?: {
        interval?: number;
        timeoutMs?: number;
        logId?: string;
    }): Promise<NonNullable<T>>;
    userExists(inUserId?: string): Promise<boolean>;
    isMemberOf(streamId: string, inUserId?: string): Promise<boolean>;
    createSpace(spaceName: string): Promise<{
        spaceId: string;
        defaultChannelId: string;
    }>;
    createChannel(spaceId: string, channelName: string): Promise<string>;
    startStreamsClient(): Promise<void>;
    sendMessage(channelId: string, message: string, options?: {
        threadId?: string;
        replyId?: string;
        mentions?: PlainMessage<ChannelMessage_Post_Mention>[];
        attachments?: PlainMessage<ChannelMessage_Post_Attachment>[];
    }): Promise<string>;
    sendReaction(channelId: string, refEventId: string, reaction: string): Promise<string>;
    joinSpace(spaceId: string, opts?: {
        skipMintMembership?: boolean;
    }): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=stressClient.d.ts.map