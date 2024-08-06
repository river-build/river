import { createTestClient, http, publicActions, walletActions } from 'viem'
import { foundry } from 'viem/chains'

import { MockERC20 } from './MockERC20'

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

import { deployContract } from './TestGatingUtils'

import { Mutex } from './TestGatingUtils'

import { Address } from './ContractTypes'

import { dlogger } from '@river-build/dlog'

const logger = dlogger('csb:TestGatingERC20')

const erc20Contracts = new Map<string, Address>()
const erc20ContractsMutex = new Mutex()

async function getContractAddress(tokenName: string): Promise<Address> {
    try {
        await erc20ContractsMutex.lock()
        const contractAddress = await deployContract(tokenName, MockERC20.abi, MockERC20.bytecode)
        erc20Contracts.set(tokenName, contractAddress)
    } catch (e) {
        logger.error('Failed to deploy contract', e)
        throw new Error(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `Failed to get contract address: ${tokenName}`,
        )
    } finally {
        erc20ContractsMutex.unlock()
    }

    return erc20Contracts.get(tokenName)!
}

async function publicMint(
    tokenName: string,
    toAddress: Address,
    amount: number,
): Promise<void> {
    const privateKey = generatePrivateKey()
    const throwawayAccount = privateKeyToAccount(privateKey)
    const client = createTestClient({
        chain: foundry,
        mode: 'anvil',
        transport: http(),
        account: throwawayAccount,
    })
        .extend(publicActions)
        .extend(walletActions)

    const contractAddress = await getContractAddress(tokenName)

    logger.log(`Minting ${amount} tokens to address ${toAddress}`)
    const txnReceipt = await client.writeContract({
        address: contractAddress,
        abi: MockERC20.abi,
        functionName: 'mint',
        args: [toAddress, amount],
        account: throwawayAccount,
    })

    const receipt = await client.waitForTransactionReceipt({ hash: txnReceipt })
    expect(receipt.status).toBe('success')
    logger.log(`Minted ${amount} tokens to address ${toAddress}`, txnReceipt)
}

export const TestERC20 = {
    getContractAddress,
    publicMint,
}
