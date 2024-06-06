import { PromiseClient, Transport } from '@connectrpc/connect';
import { Err, StreamService } from '@river-build/proto';
export type RetryParams = {
    maxAttempts: number;
    initialRetryDelay: number;
    maxRetryDelay: number;
    refreshNodeUrl?: () => Promise<string>;
};
export declare function errorContains(err: unknown, error: Err): boolean;
export declare function getRpcErrorProperty(err: unknown, prop: string): string | undefined;
export type StreamRpcClient = PromiseClient<typeof StreamService> & {
    url?: string;
};
export declare function makeStreamRpcClient(dest: Transport | string, retryParams?: RetryParams, refreshNodeUrl?: () => Promise<string>): StreamRpcClient;
export type StreamRpcClientType = StreamRpcClient;
//# sourceMappingURL=makeStreamRpcClient.d.ts.map