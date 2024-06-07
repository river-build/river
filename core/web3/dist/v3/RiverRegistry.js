import { IRiverRegistryShim } from './IRiverRegistryShim';
export class RiverRegistry {
    config;
    provider;
    riverRegistry;
    registry = {};
    constructor(config, provider) {
        this.config = config;
        this.provider = provider;
        this.riverRegistry = new IRiverRegistryShim(this.config.addresses.riverRegistry, this.config.contractVersion, provider);
    }
    async getAllNodes(nodeStatus) {
        const allNodes = await this.riverRegistry.read.getAllNodes();
        if (allNodes.length == 0) {
            return undefined;
        }
        const registry = {};
        for (const node of allNodes) {
            if (nodeStatus && node.status != nodeStatus) {
                continue;
            }
            if (nodeStatus !== undefined) {
                registry[node.nodeAddress] = node;
            }
            // update in-memory registry
            this.registry[node.nodeAddress] = node;
        }
        if (nodeStatus !== undefined) {
            return registry;
        }
        // if we've updated the entire registry return that
        return this.registry;
    }
    async getAllNodeUrls(nodeStatus) {
        const allNodes = await this.riverRegistry.read.getAllNodes();
        if (allNodes.length == 0) {
            return undefined;
        }
        const nodeUrls = [];
        for (const node of allNodes) {
            // get all nodes with optional status
            if (nodeStatus && node.status != nodeStatus) {
                continue;
            }
            nodeUrls.push({ url: node.url });
            // update registry
            this.registry[node.nodeAddress] = node;
        }
        return nodeUrls;
    }
    async getOperationalNodeUrls() {
        const NODE_OPERATIONAL = 2;
        const nodeUrls = await this.getAllNodeUrls(NODE_OPERATIONAL);
        if (!nodeUrls || nodeUrls.length === 0) {
            throw new Error('No operational nodes found in registry');
        }
        return nodeUrls.map((x) => x.url).join(',');
    }
}
//# sourceMappingURL=RiverRegistry.js.map