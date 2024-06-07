import { EncryptedData, Envelope, StreamEvent, ChannelMessage, SyncStreamsResponse } from '@river-build/proto';
import { PlainMessage } from '@bufbuild/protobuf';
import { Client } from './client';
import { ParsedEvent } from './types';
import { EntitlementsDelegate } from '@river-build/encryption';
import { ethers } from 'ethers';
import { StreamRpcClientType } from './makeStreamRpcClient';
import { SignerContext } from './signerContext';
import { PricingModuleStruct } from '@river-build/web3';
export declare const makeTestRpcClient: () => Promise<import("./makeStreamRpcClient").StreamRpcClient>;
export declare const makeEvent_test: (context: SignerContext, payload: PlainMessage<StreamEvent>['payload'], prevMiniblockHash?: Uint8Array) => Promise<Envelope>;
export declare const TEST_ENCRYPTED_MESSAGE_PROPS: PlainMessage<EncryptedData>;
/**
 * makeUniqueSpaceStreamId - space stream ids are derived from the contract
 * in tests without entitlements there are no contracts, so we use a random id
 */
export declare const makeUniqueSpaceStreamId: () => string;
/**
 *
 * @returns a random user context
 * Done using a worker thread to avoid blocking the main thread
 */
export declare const makeRandomUserContext: () => Promise<SignerContext>;
export declare const makeRandomUserAddress: () => Uint8Array;
export declare const makeUserContextFromWallet: (wallet: ethers.Wallet) => Promise<SignerContext>;
export interface TestClientOpts {
    context?: SignerContext;
    entitlementsDelegate?: EntitlementsDelegate;
    deviceId?: string;
}
export declare const makeTestClient: (opts?: TestClientOpts) => Promise<Client>;
declare class DonePromise {
    promise: Promise<string>;
    resolve: (value: string) => void;
    reject: (reason: any) => void;
    constructor();
    done(): void;
    wait(): Promise<string>;
    expectToSucceed(): Promise<void>;
    expectToFail(): Promise<void>;
    run(fn: () => void): void;
    runAndDone(fn: () => void): void;
}
export declare const makeDonePromise: () => DonePromise;
export declare const sendFlush: (client: StreamRpcClientType) => Promise<void>;
export declare function iterableWrapper<T>(iterable: AsyncIterable<T>): AsyncGenerator<T, void, unknown>;
export declare const lastEventFiltered: <T extends (a: ParsedEvent) => any>(events: ParsedEvent[], f: T) => ReturnType<T> | undefined;
export declare function waitFor<T>(callback: (() => T) | (() => Promise<T>), options?: {
    timeoutMS: number;
}): Promise<T | undefined>;
export declare function waitForSyncStreams(syncStreams: AsyncIterable<SyncStreamsResponse>, matcher: (res: SyncStreamsResponse) => Promise<boolean>): Promise<SyncStreamsResponse>;
export declare function waitForSyncStreamsMessage(syncStreams: AsyncIterable<SyncStreamsResponse>, message: string): Promise<SyncStreamsResponse>;
export declare function getChannelMessagePayload(event?: ChannelMessage): string | undefined;
export declare function createEventDecryptedPromise(client: Client, expectedMessageText: string): Promise<string>;
export declare function isValidEthAddress(address: string): boolean;
export declare const TIERED_PRICING_ORACLE = "TieredLogPricingOracle";
export declare const FIXED_PRICING = "FixedPricing";
export declare const getDynamicPricingModule: (pricingModules: PricingModuleStruct[]) => import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct | undefined;
export declare const getFixedPricingModule: (pricingModules: PricingModuleStruct[]) => import("@river-build/generated/dev/typings/IPricingModules").IPricingModulesBase.PricingModuleStruct | undefined;
export {};
//# sourceMappingURL=util.test.d.ts.map