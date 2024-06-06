import LocalhostAbi from '@river-build/generated/dev/abis/Roles.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/Roles.abi.json' assert { type: 'json' };
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export class IRolesShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
}
//# sourceMappingURL=IRolesShim.js.map