import { ethers } from 'ethers';
import { MockERC721AShim as MockERC721AShimV3, } from './v3';
import { getTestGatingNFTContractAddress } from './TestGatingNFT';
export function mintMockNFT(provider, config, fromWallet, toAddress) {
    if (!config.addresses.mockNFT) {
        throw new Error('No mock ERC721 address provided');
    }
    const mockNFTAddress = config.addresses.mockNFT;
    const mockNFT = new MockERC721AShimV3(mockNFTAddress, config.contractVersion, provider);
    return mockNFT.write(fromWallet).mintTo(toAddress);
}
export function balanceOfMockNFT(config, provider, address) {
    if (!config.addresses.mockNFT) {
        throw new Error('No mock ERC721 address provided');
    }
    const mockNFTAddress = config.addresses.mockNFT;
    const mockNFT = new MockERC721AShimV3(mockNFTAddress, config.contractVersion, provider);
    return mockNFT.read.balanceOf(address);
}
export async function getTestGatingNftAddress(_chainId) {
    return await getTestGatingNFTContractAddress();
}
export async function getFilteredRolesFromSpace(spaceDapp, spaceNetworkId) {
    const spaceRoles = await spaceDapp.getRoles(spaceNetworkId);
    const filteredRoles = [];
    // Filter out space roles which won't work when creating a channel
    for (const r of spaceRoles) {
        // Filter out roles which have no permissions & the Owner role
        if (r.name !== 'Owner') {
            filteredRoles.push(r);
        }
    }
    return filteredRoles;
}
export function isRoleIdInArray(roleIds, roleId) {
    for (const r of roleIds) {
        if (r.eq(roleId)) {
            return true;
        }
    }
    return false;
}
/**
 * TODO: these are only used in tests, should move them to different file?
 */
function isMembershipStructV3(returnValue) {
    return typeof returnValue.settings.price === 'number';
}
function _createMembershipStruct({ name, permissions, requirements, }) {
    return {
        settings: {
            name,
            symbol: 'MEMBER',
            price: 0,
            maxSupply: 1000,
            duration: 0,
            currency: ethers.constants.AddressZero,
            feeRecipient: ethers.constants.AddressZero,
            freeAllocation: 0,
            pricingModule: ethers.constants.AddressZero,
        },
        permissions,
        requirements,
    };
}
export function createMembershipStruct(args) {
    const result = _createMembershipStruct(args);
    if (isMembershipStructV3(result)) {
        return result;
    }
    else {
        throw new Error("createMembershipStruct: version is not 'v3'");
    }
}
//# sourceMappingURL=ContractHelpers.js.map