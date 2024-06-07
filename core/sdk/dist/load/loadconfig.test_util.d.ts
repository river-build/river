export declare const loadTestQueueName = "loadtestqueue";
export declare const loadTestShutdownQueueName = "shutdownqueue";
export declare const chainSpaceAndChannelJobName = "chainSpaceAndChannelData";
export declare const numMessagesConfig = 10000;
export declare const numClientsConfig = 10;
export declare const loadTestTimeout = 1180000;
export declare const loadTestReceiverTimeout = 1050000;
export declare const loadTestSignalCheckInterval = 100;
export declare const defaultWaitForTimeout = 10000;
export declare const jsonRpcProviderUrl = "https://sepolia.base.org";
export declare const nodeRpcURL = "https://river1.nodes.gamma.towns.com";
export declare const minimalBalance = 0.1;
export declare const connectionOptions: {
    host: string;
    port: number;
};
type Account = {
    address: string;
    privateKey: string;
};
export declare const bobsAccount: Account;
export declare const alicesAccount: Account;
export declare const accounts: Account[];
export declare const senderAccount: Account;
export declare const allAccounts: Account[];
export {};
//# sourceMappingURL=loadconfig.test_util.d.ts.map