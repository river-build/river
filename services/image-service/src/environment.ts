import * as dotenv from 'dotenv';

import { Address, ChainConfig, Config } from './types';

import configData from './config.json';

dotenv.config();

export const DEFAULT_CHAIN_ID = parseInt(process.env.DEFAULT_CHAIN_ID ?? '8543', 10);
const LOCAL_RIVER_CHAIN_URL = process.env.LOCAL_RIVER_CHAIN_URL as string | undefined;
const LOCAL_CHAIN_ID = 31338;
const LOCAL_RIVER_REGISTRY = process.env.LOCAL_RIVER_REGISTRY as Address | undefined;

export const config = makeConfig();

console.log('config', config, 'defaultChainId', DEFAULT_CHAIN_ID);

function makeConfig(): Config {
	let updatedChainInfo = { ...configData.chainConfig } as ChainConfig;

	// inject local chain info if env var is set
  if (
		LOCAL_RIVER_CHAIN_URL) {
     if (!(LOCAL_CHAIN_ID in updatedChainInfo)) {
      updatedChainInfo = {
        ...updatedChainInfo,
        [LOCAL_CHAIN_ID]: {
					riverChainUrl: LOCAL_RIVER_CHAIN_URL,
        },
      };
    }
  }
	return {
    ...configData,
    chainConfig: updatedChainInfo,
  } as Config;
}

export function getChainInfo(chainId: number = DEFAULT_CHAIN_ID) {
	console.log('getChainInfo', chainId);
	if (chainId in config.chainConfig) {
		return config.chainConfig[chainId];
	}
	return undefined;
}
