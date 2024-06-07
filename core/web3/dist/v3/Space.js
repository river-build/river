import { EntitlementModuleType, isRuleEntitlement, isStringArray, isUserEntitlement, } from '../ContractTypes';
import { IChannelShim } from './IChannelShim';
import { IRolesShim } from './IRolesShim';
import { ISpaceOwnerShim } from './ISpaceOwnerShim';
import { IEntitlementsShim } from './IEntitlementsShim';
import { IMulticallShim } from './IMulticallShim';
import { OwnableFacetShim } from './OwnableFacetShim';
import { TokenPausableFacetShim } from './TokenPausableFacetShim';
import { UNKNOWN_ERROR } from './BaseContractShim';
import { UserEntitlementShim } from './UserEntitlementShim';
import { isRoleIdInArray } from '../ContractHelpers';
import { toPermissions } from '../ConvertersRoles';
import { IMembershipShim } from './IMembershipShim';
import { NoopRuleData } from '../entitlement';
import { RuleEntitlementShim } from './RuleEntitlementShim';
import { IBanningShim } from './IBanningShim';
import { IERC721AQueryableShim } from './IERC721AQueryableShim';
import { IEntitlementDataQueryableShim } from './IEntitlementDataQueryableShim';
export class Space {
    address;
    addressToEntitlement = {};
    spaceId;
    version;
    provider;
    channel;
    entitlements;
    multicall;
    ownable;
    pausable;
    roles;
    spaceOwner;
    membership;
    banning;
    erc721AQueryable;
    entitlementDataQueryable;
    constructor({ address, version, spaceId, provider, spaceOwnerAddress }) {
        this.address = address;
        this.spaceId = spaceId;
        this.version = version;
        this.provider = provider;
        this.channel = new IChannelShim(address, version, provider);
        this.entitlements = new IEntitlementsShim(address, version, provider);
        this.multicall = new IMulticallShim(address, version, provider);
        this.ownable = new OwnableFacetShim(address, version, provider);
        this.pausable = new TokenPausableFacetShim(address, version, provider);
        this.roles = new IRolesShim(address, version, provider);
        this.spaceOwner = new ISpaceOwnerShim(spaceOwnerAddress, version, provider);
        this.membership = new IMembershipShim(address, version, provider);
        this.banning = new IBanningShim(address, version, provider);
        this.erc721AQueryable = new IERC721AQueryableShim(address, version, provider);
        this.entitlementDataQueryable = new IEntitlementDataQueryableShim(address, version, provider);
    }
    get Address() {
        return this.address;
    }
    get SpaceId() {
        return this.spaceId;
    }
    get Channels() {
        return this.channel;
    }
    get Multicall() {
        return this.multicall;
    }
    get Ownable() {
        return this.ownable;
    }
    get Pausable() {
        return this.pausable;
    }
    get Roles() {
        return this.roles;
    }
    get Entitlements() {
        return this.entitlements;
    }
    get SpaceOwner() {
        return this.spaceOwner;
    }
    get Membership() {
        return this.membership;
    }
    get Banning() {
        return this.banning;
    }
    get ERC721AQueryable() {
        return this.erc721AQueryable;
    }
    get EntitlementDataQueryable() {
        return this.entitlementDataQueryable;
    }
    getSpaceInfo() {
        return this.spaceOwner.read.getSpaceInfo(this.address);
    }
    async getRole(roleId) {
        // get all the entitlements for the space
        const entitlementShims = await this.getEntitlementShims();
        // get the various pieces of details
        const [roleEntitlements, channels] = await Promise.all([
            this.getRoleEntitlements(entitlementShims, roleId),
            this.getChannelsWithRole(roleId),
        ]);
        // assemble the result
        if (roleEntitlements === null) {
            return null;
        }
        return {
            id: roleEntitlements.roleId,
            name: roleEntitlements.name,
            permissions: roleEntitlements.permissions,
            channels,
            users: roleEntitlements.users,
            ruleData: roleEntitlements.ruleData,
        };
    }
    parseChannelMetadataJSON(metadataStr) {
        try {
            return JSON.parse(metadataStr);
        }
        catch (error) {
            return {
                name: metadataStr,
                description: '',
            };
        }
    }
    async getChannel(channelNetworkId) {
        // get most of the channel details except the roles which
        // require a separate call to get each role's details
        const channelId = channelNetworkId.startsWith('0x')
            ? channelNetworkId
            : `0x${channelNetworkId}`;
        const channelInfo = await this.Channels.read.getChannel(channelId);
        const roles = await this.getChannelRoleEntitlements(channelInfo);
        const metadata = this.parseChannelMetadataJSON(channelInfo.metadata);
        return {
            spaceNetworkId: this.spaceId,
            channelNetworkId: channelNetworkId.replace('0x', ''),
            name: metadata.name,
            description: metadata.description,
            disabled: channelInfo.disabled,
            roles,
        };
    }
    async getChannelMetadata(channelNetworkId) {
        const channelId = channelNetworkId.startsWith('0x')
            ? channelNetworkId
            : `0x${channelNetworkId}`;
        const channelInfo = await this.Channels.read.getChannel(channelId);
        const metadata = this.parseChannelMetadataJSON(channelInfo.metadata);
        return {
            name: metadata.name,
            channelNetworkId: channelInfo.id.replace('0x', ''),
            description: metadata.description,
            disabled: channelInfo.disabled,
        };
    }
    async getChannels() {
        const channels = [];
        const getOutput = await this.Channels.read.getChannels();
        for (const o of getOutput) {
            const metadata = this.parseChannelMetadataJSON(o.metadata);
            channels.push({
                name: metadata.name,
                description: metadata.description,
                channelNetworkId: o.id.replace('0x', ''),
                disabled: o.disabled,
            });
        }
        return channels;
    }
    async getChannelRoles(channelNetworkId) {
        const channelId = channelNetworkId.startsWith('0x')
            ? channelNetworkId
            : `0x${channelNetworkId}`;
        // get all the roleIds for the channel
        const channelInfo = await this.Channels.read.getChannel(channelId);
        // return the role info
        return this.getRolesInfo(channelInfo.roleIds);
    }
    async getPermissionsByRoleId(roleId) {
        const permissions = await this.Roles.read.getPermissionsByRoleId(roleId);
        return toPermissions(permissions);
    }
    async getChannelRoleEntitlements(channelInfo) {
        // get all the entitlements for the space
        const entitlementShims = await this.getEntitlementShims();
        const getRoleEntitlementsAsync = [];
        for (const roleId of channelInfo.roleIds) {
            getRoleEntitlementsAsync.push(this.getRoleEntitlements(entitlementShims, roleId));
        }
        // get all the role info
        const allRoleEntitlements = await Promise.all(getRoleEntitlementsAsync);
        return allRoleEntitlements.filter((r) => r !== null);
    }
    async findEntitlementByType(entitlementType) {
        const entitlements = await this.getEntitlementShims();
        for (const entitlement of entitlements) {
            if (entitlement.moduleType === entitlementType) {
                return entitlement;
            }
        }
        return null;
    }
    parseError(error) {
        // try each of the contracts to see who can give the best error message
        let err = this.channel.parseError(error);
        for (const contract of [
            this.entitlements,
            this.multicall,
            this.ownable,
            this.pausable,
            this.roles,
            this.spaceOwner,
            this.membership,
            this.banning,
            this.channel,
        ]) {
            err = contract.parseError(error);
            if (err?.name !== UNKNOWN_ERROR) {
                return err;
            }
        }
        return err;
    }
    parseLog(log) {
        const operations = [
            () => this.channel.parseLog(log),
            () => this.pausable.parseLog(log),
            () => this.entitlements.parseLog(log),
            () => this.roles.parseLog(log),
            () => this.membership.parseLog(log),
        ];
        for (const operation of operations) {
            try {
                return operation();
            }
            catch (error) {
                // ignore, throw error if none match
            }
        }
        throw new Error('Failed to parse log: ' + JSON.stringify(log));
    }
    async getEntitlementByAddress(address) {
        if (!this.addressToEntitlement[address]) {
            const entitlement = await this.entitlements.read.getEntitlement(address);
            switch (entitlement.moduleType) {
                case EntitlementModuleType.UserEntitlement:
                    this.addressToEntitlement[address] = new UserEntitlementShim(address, this.version, this.provider);
                    break;
                case EntitlementModuleType.RuleEntitlement:
                    this.addressToEntitlement[address] = new RuleEntitlementShim(address, this.version, this.provider);
                    break;
                default:
                    throw new Error(`Unsupported entitlement module type: ${entitlement.moduleType}`);
            }
        }
        return this.addressToEntitlement[address];
    }
    async getRoleInfo(roleId) {
        try {
            return await this.roles.read.getRoleById(roleId);
        }
        catch (e) {
            // any error means the role doesn't exist
            //console.error(e)
            return null;
        }
    }
    async getEntitlementShims() {
        // get all the entitlement addresses supported in the space
        const entitlementInfo = await this.entitlements.read.getEntitlements();
        const getEntitlementShims = [];
        // with the addresses, get the entitlement shims
        for (const info of entitlementInfo) {
            getEntitlementShims.push(this.getEntitlementByAddress(info.moduleAddress));
        }
        return Promise.all(getEntitlementShims);
    }
    async getEntitlementDetails(entitlementShims, roleId) {
        let users = [];
        let ruleData;
        // with the shims, get the role details for each entitlement
        const entitlements = await Promise.all(entitlementShims.map(async (entitlement) => {
            if (isUserEntitlement(entitlement)) {
                return await entitlement.getRoleEntitlement(roleId);
            }
            else if (isRuleEntitlement(entitlement)) {
                return await entitlement.getRoleEntitlement(roleId);
            }
            return undefined;
        }));
        function isRuleDataStruct(ruleData) {
            return ruleData !== undefined;
        }
        for (const entitlment of entitlements) {
            if (entitlment) {
                if (isStringArray(entitlment)) {
                    users = users.concat(entitlment);
                }
                else if (isRuleDataStruct(entitlment)) {
                    ruleData = entitlment;
                }
            }
        }
        return { users, ruleData: ruleData ?? NoopRuleData };
    }
    async getChannelsWithRole(roleId) {
        const channelMetadatas = new Map();
        // get all the channels from the space
        const allChannels = await this.channel.read.getChannels();
        // for each channel, check with each entitlement if the role is in the channel
        // add the channel to the list if it is not already added
        for (const c of allChannels) {
            if (!channelMetadatas.has(c.id) && isRoleIdInArray(c.roleIds, roleId)) {
                const metadata = this.parseChannelMetadataJSON(c.metadata);
                channelMetadatas.set(c.id, {
                    channelNetworkId: c.id.replace('0x', ''),
                    name: metadata.name,
                    description: metadata.description,
                    disabled: c.disabled,
                });
            }
        }
        return Array.from(channelMetadatas.values());
    }
    async getRolesInfo(roleIds) {
        // use a Set to ensure that we only get roles once
        const roles = new Set();
        const getRoleStructsAsync = [];
        for (const roleId of roleIds) {
            // get the role info if we don't already have it
            if (!roles.has(roleId.toString())) {
                getRoleStructsAsync.push(this.roles.read.getRoleById(roleId));
            }
        }
        // get all the role info
        return Promise.all(getRoleStructsAsync);
    }
    async getRoleEntitlements(entitlementShims, roleId) {
        const [roleInfo, entitlementDetails] = await Promise.all([
            this.getRoleInfo(roleId),
            this.getEntitlementDetails(entitlementShims, roleId),
        ]);
        // assemble the result
        if (roleInfo === null) {
            return null;
        }
        return {
            roleId: roleInfo.id.toNumber(),
            name: roleInfo.name,
            permissions: toPermissions(roleInfo.permissions),
            users: entitlementDetails.users,
            ruleData: entitlementDetails.ruleData,
        };
    }
}
//# sourceMappingURL=Space.js.map