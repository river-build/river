import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
import LocalhostAbi from '@river-build/generated/dev/abis/PrepayFacet.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/PrepayFacet.abi.json' assert { type: 'json' };
export class IPrepayShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
}
//# sourceMappingURL=IPrepayShim.js.map