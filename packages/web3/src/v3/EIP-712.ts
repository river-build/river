import { BigNumber, TypedDataDomain, TypedDataField } from 'ethers'

import { Address } from '../ContractTypes'

/**
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 * */
interface LinkedWalletValue {
    message: string
    userID: Address
    nonce: BigNumber
}

interface Eip712LinkedWalletArgs {
    domain: TypedDataDomain
    nonce: BigNumber
    userID: Address
    message: string
}

export function createEip712LinkedWalletdData({
    domain,
    userID,
    nonce,
    message,
}: Eip712LinkedWalletArgs) {
    // should match the types and order of _LINKED_WALLET_TYPEHASH in
    // river/contracts/src/factory/facets/wallet-link/WalletLinkBase.sol
    const linkedWalletTypes: Record<string, TypedDataField[]> = {
        LinkedWallet: [
            { name: 'message', type: 'string' },
            { name: 'userID', type: 'address' },
            { name: 'nonce', type: 'uint256' },
        ],
    }
    const types = linkedWalletTypes
    const value: LinkedWalletValue = {
        message,
        userID,
        nonce,
    }
    return {
        types,
        domain,
        value,
    }
}
