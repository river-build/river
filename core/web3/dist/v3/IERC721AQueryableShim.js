import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
import LocalhostAbi from '@river-build/generated/dev/abis/IERC721AQueryable.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/IERC721AQueryable.abi.json' assert { type: 'json' };
export class IERC721AQueryableShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
}
//# sourceMappingURL=IERC721AQueryableShim.js.map