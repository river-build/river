import DevAbi from '@river-build/generated/dev/abis/NodeRegistry.abi.json' assert { type: 'json' };
import V3Abi from '@river-build/generated/v3/abis/NodeRegistry.abi.json' assert { type: 'json' };
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export class IRiverRegistryShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: DevAbi,
            [ContractVersion.v3]: V3Abi,
        });
    }
}
//# sourceMappingURL=IRiverRegistryShim.js.map