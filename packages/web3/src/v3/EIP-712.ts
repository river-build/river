import { BigNumber, TypedDataField, TypedDataDomain } from 'ethers'
import { Address } from '../ContractTypes'

/**
 * https://eips.ethereum.org/EIPS/eip-4361#message-format
 * */
const linkAccountTypes: Record<string, TypedDataField[]> = {
    LinkAccounts: [
        { name: 'request', type: 'string' },
        { name: 'linkAccount', type: 'address' },
        { name: 'signInAccount', type: 'address' },
        { name: 'nonce', type: 'uint256' },
    ],
}

interface LinkAccountsValue {
    linkAccount: Address
    signInAccount: Address
    nonce: BigNumber
    request: string
}

interface Eip712LinkAccountArgs {
    chainId: number
    nonce: BigNumber
    linkAccount: Address
    rootAccount: Address
    message: string
    verifyingContract: Address
}

export function createEip712LinkAccountdData({
    chainId,
    linkAccount,
    rootAccount,
    nonce,
    message,
    verifyingContract,
}: Eip712LinkAccountArgs) {
    const domain: TypedDataDomain = {
        name: 'SpaceFactory',
        version: '1',
        chainId,
        verifyingContract,
    }
    const types = linkAccountTypes
    const value: LinkAccountsValue = {
        linkAccount,
        signInAccount: rootAccount,
        nonce,
        request: message,
    }
    return {
        types,
        domain,
        value,
    }
}
