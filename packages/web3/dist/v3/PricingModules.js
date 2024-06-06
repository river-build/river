import { IPricingShim } from './IPricingShim';
export class PricingModules {
    pricingShim;
    constructor(config, provider) {
        this.pricingShim = new IPricingShim(config.addresses.spaceFactory, config.contractVersion, provider);
    }
    parseError(error) {
        return this.pricingShim.parseError(error);
    }
    async listPricingModules() {
        return this.pricingShim.read.listPricingModules();
    }
    async addPricingModule(moduleAddress, signer) {
        await this.pricingShim.write(signer).addPricingModule(moduleAddress);
    }
    async removePricingModule(moduleAddress, signer) {
        await this.pricingShim.write(signer).removePricingModule(moduleAddress);
    }
    async isPricingModule(moduleAddress) {
        return this.pricingShim.read.isPricingModule(moduleAddress);
    }
}
//# sourceMappingURL=PricingModules.js.map