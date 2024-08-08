import * as dotenv from 'dotenv';

import { ChainConfig } from './types';
import configData from './config.json';
import deploymentData from '@river-build/generated/config/deployments.json';

dotenv.config();

export const DEFAULT_CHAIN_ID = parseInt(process.env.DEFAULT_CHAIN_ID ?? '550', 10);
export const config = makeConfig(configData, deploymentData);

console.log('config', config, 'defaultChainId', DEFAULT_CHAIN_ID);

interface ConfigJson {
  chainConfig: {
    [chainId: number]: {
      riverChainUrl: string;
    };
  };
}

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

function makeConfig(configJson: ConfigJson, deploymentsJson: DeploymentsJson): ChainConfig {
  const chainConfig: ChainConfig = {};

  for (const key in deploymentsJson) {
    if (deploymentsJson.hasOwnProperty(key)) {
      const riverData = deploymentsJson[key].river;
      const chainId = riverData.chainId;

      if (configJson.chainConfig.hasOwnProperty(chainId.toString())) {
        const riverChainUrl = configJson.chainConfig[chainId].riverChainUrl;
        const riverRegistry = riverData.addresses.riverRegistry;

        chainConfig[chainId] = {
          riverRegistry,
          riverChainUrl,
        };
      }
    }
  }

  return chainConfig;
};


export function getChainInfo(chainId: number = DEFAULT_CHAIN_ID) {
	if (chainId in config.chainConfig) {
		return config.chainConfig[chainId];
	}
	return undefined;
}
