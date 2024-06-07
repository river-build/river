// eslint-disable-next-line import/no-extraneous-dependencies
import { createPublicClient, createWalletClient, http } from 'viem';
// eslint-disable-next-line import/no-extraneous-dependencies
import { baseSepolia } from 'wagmi/chains';
// eslint-disable-next-line import/no-extraneous-dependencies
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { jsonRpcProviderUrl, minimalBalance } from './loadconfig.test_util';
import { dlog } from '@river-build/dlog';
import { isValidEthAddress } from '../util.test';
const transport = http(jsonRpcProviderUrl);
const log = dlog('csb:test:walletManagement');
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: transport,
});
export const createAccount = (numberOfAccounts = 1) => {
    const accounts = [];
    for (let i = 0; i < numberOfAccounts; i++) {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const walletClient = createWalletClient({
            account,
            chain: baseSepolia,
            transport: transport,
        });
        log('walletClient.account.address:', walletClient.account.address);
        const newAccount = { address: account.address, privateKey: privateKey };
        log('newAccount:', newAccount);
        accounts.push(newAccount);
    }
    return accounts;
};
export async function getBalance(address) {
    if (!isValidEthAddress(address)) {
        throw new Error('Invalid Ethereum address format');
    }
    const balance = await publicClient.getBalance({ address: address });
    return balance;
}
export async function deposit(fromAccount, toAddress, ethAmount = minimalBalance) {
    if (!isValidEthAddress(toAddress)) {
        throw new Error('Invalid Ethereum address format');
    }
    let privateKey = fromAccount.privateKey;
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
        account: account,
        chain: baseSepolia,
        transport: transport,
    });
    const weiValue = BigInt(ethAmount * 1e18);
    const receipt = await walletClient.sendTransaction({
        account: account,
        to: toAddress,
        value: weiValue,
    });
    log(`Deposit to <${toAddress}>, receipt`, receipt);
}
//# sourceMappingURL=walletManagement.test_util.js.map