import { StreamRpcClientType } from './makeStreamRpcClient';
import { StreamStateView } from './streamStateView';
export declare class UnauthenticatedClient {
    readonly rpcClient: StreamRpcClientType;
    private readonly logCall;
    private readonly logEmitFromClient;
    private readonly logError;
    private readonly userId;
    private getScrollbackRequests;
    constructor(rpcClient: StreamRpcClientType, logNamespaceFilter?: string);
    userExists(userId: string): Promise<boolean>;
    userWithAddressExists(address: Uint8Array): Promise<boolean>;
    getStream(streamId: string | Uint8Array): Promise<StreamStateView>;
    scrollbackToDate(streamView: StreamStateView, toDate: number): Promise<void>;
    private scrollback;
    private getMiniblocks;
    private isWithin;
}
//# sourceMappingURL=unauthenticatedClient.d.ts.map