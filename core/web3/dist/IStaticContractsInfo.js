import DeploymentsJson from '@river-build/generated/config/deployments.json' assert { type: 'json' };
export var ContractVersion;
(function (ContractVersion) {
    ContractVersion["v3"] = "v3";
    ContractVersion["dev"] = "dev";
})(ContractVersion || (ContractVersion = {}));
export function getWeb3Deployment(riverEnv) {
    const deployments = DeploymentsJson;
    if (!deployments[riverEnv]) {
        throw new Error(`Deployment ${riverEnv} not found, available environments: ${Object.keys(DeploymentsJson).join(', ')}`);
    }
    return deployments[riverEnv];
}
export function getWeb3Deployments() {
    return Object.keys(DeploymentsJson);
}
//# sourceMappingURL=IStaticContractsInfo.js.map