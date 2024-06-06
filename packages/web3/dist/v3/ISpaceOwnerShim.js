import LocalhostAbi from '@river-build/generated/dev/abis/SpaceOwner.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/SpaceOwner.abi.json' assert { type: 'json' };
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
export class ISpaceOwnerShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
}
//# sourceMappingURL=ISpaceOwnerShim.js.map