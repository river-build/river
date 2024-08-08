import * as dotenv from 'dotenv';

import { ChainConfig } from './types';
import deploymentData from '@river-build/generated/config/deployments.json';

dotenv.config();

export const DEFAULT_CHAIN_ID = parseInt(process.env.DEFAULT_CHAIN_ID ?? '550', 10);
export const SERVER_PORT = parseInt(process.env.PORT ?? '443', 10);
export const NODE_ENV = process.env.NODE_ENV;
export const config = makeConfig(deploymentData);

console.log('config', config, 'defaultChainId', DEFAULT_CHAIN_ID, `"${process.env.DEFAULT_CHAIN_ID}"`);

interface DeploymentsJson {
  [key: string]: {
    river: {
      chainId: number;
      addresses: {
        riverRegistry: string;
      };
    };
  };
}

function makeConfig(deploymentsJson: DeploymentsJson): ChainConfig {
  const chainConfig: ChainConfig = {};

  for (const key in deploymentsJson) {
    if (deploymentsJson.hasOwnProperty(key)) {
      const riverData = deploymentsJson[key].river;
      const chainId = riverData.chainId;
			const riverRegistry = riverData.addresses.riverRegistry;

			chainConfig[chainId] = {
				riverRegistry,
			};
    }
  }

  return chainConfig;
};


export function getChainInfo(chainId: number = DEFAULT_CHAIN_ID) {
	if (chainId in config) {
		return config[chainId];
	}
	return undefined;
}
