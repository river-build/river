import 'fake-indexeddb/auto'; // used to mock indexdb in dexie, don't remove
import { check, dlogger } from '@river-build/dlog';
import { makeRiverConfig } from '@river/sdk';
import { exit } from 'process';
import { Wallet } from 'ethers';
import { isSet } from './utils/expect';
import { setupChat, startStressChat } from './mode/chat/root_chat';
check(isSet(process.env.PROCESS_INDEX), 'process.env.PROCESS_INDEX');
const processIndex = parseInt(process.env.PROCESS_INDEX);
const config = makeRiverConfig();
const logger = dlogger(`stress:run:${processIndex}`);
logger.log('======================= run =======================');
if (processIndex === 0) {
    logger.log('env', process.env);
    logger.log('config', {
        environmentId: config.environmentId,
        base: { rpcUrl: config.base.rpcUrl },
        river: { rpcUrl: config.river.rpcUrl },
    });
}
function getRootWallet() {
    check(isSet(process.env.MNEMONIC), 'process.env.MNEMONIC');
    const mnemonic = process.env.MNEMONIC;
    const wallet = Wallet.fromMnemonic(mnemonic);
    return { wallet, mnemonic };
}
function getStressMode() {
    check(isSet(process.env.STRESS_MODE), 'process.env.STRESS_MODE');
    return process.env.STRESS_MODE;
}
switch (getStressMode()) {
    case 'chat':
        await startStressChat({
            config,
            processIndex,
            rootWallet: getRootWallet().wallet,
        });
        break;
    case 'setup_chat':
        await setupChat({
            config,
            rootWallet: getRootWallet().wallet,
        });
        break;
    default:
        throw new Error('unknown stress mode');
}
exit(0);
//# sourceMappingURL=start.js.map