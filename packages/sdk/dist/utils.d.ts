import { Permission } from '@river-build/web3';
export declare function unsafeProp<K extends keyof any | undefined>(prop: K): boolean;
export declare function safeSet<O extends Record<any, any>, K extends keyof O>(obj: O, prop: K, value: O[K]): void;
export declare function promiseTry<T>(fn: () => T | Promise<T>): Promise<T>;
export declare function hashString(string: string): string;
export declare function usernameChecksum(username: string, streamId: string): string;
/**
 * IConnectError contains a subset of the properties in ConnectError
 */
export type IConnectError = {
    code: number;
};
export declare function isIConnectError(obj: unknown): obj is {
    code: number;
};
export declare function isTestEnv(): boolean;
export declare class MockEntitlementsDelegate {
    isEntitled(_spaceId: string | undefined, _channelId: string | undefined, _user: string, _permission: Permission): Promise<boolean>;
}
export declare function removeCommon(x: string[], y: string[]): string[];
export declare function getEnvVar(key: string, defaultValue?: string): string;
export declare function isMobileSafari(): boolean;
export declare function isBaseUrlIncluded(baseUrls: string[], fullUrl: string): boolean;
//# sourceMappingURL=utils.d.ts.map