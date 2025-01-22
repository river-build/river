import EntitlementCheckerAbi from '@river-build/generated/dev/abis/IEntitlementChecker.abi'
import EntitlementGatedAbi from '@river-build/generated/dev/abis/IEntitlementGated.abi'

import { base } from 'viem/chains'
import { createPublicClient, http, Address, Hex } from 'viem'
import { config } from './environment'
import { getLogger } from './logger'

const logger = getLogger('xchain')

enum NodeVoteStatus {
    Passed = 1,
    Failed,
}

export interface XChainRequest {
    callerAddress: Address
    contractAddress: Address
    transactionId: Hex
    roleIds: bigint[]
    blockNumber: bigint
    requestedNodes: Address[]
    // Nodes that have responded are recorded in this map of maps along with the response the
    // node gave for reach roleId - did the request pass or fail? If a node did not respond for
    // a particular role id, the map will be missing an entry for that node.
    responses: { [roleId: number]: { [nodeAddress: string]: boolean } }

    // checkResult will be defined for requests that had a result post. If a result was not posted,
    // then the entitlement gated failed to acheive quorum for any role id.
    checkResult: boolean | undefined
}

export async function scanBlockchainForXchainEvents(
    initialBlockNum: BigInt,
    transactionValidBlocks: number,
    blocksToScan: number,
): Promise<XChainRequest[]> {
    const publicClient = createPublicClient({
        chain: {
            ...base,
            rpcUrls: {
                default: {
                    http: [config.baseProviderUrl],
                },
            },
        },
        transport: http(),
    })

    const requestLogs = await publicClient.getContractEvents({
        address: config.web3Config.base.addresses.baseRegistry,
        abi: EntitlementCheckerAbi,
        eventName: 'EntitlementCheckRequested',
        fromBlock: initialBlockNum.valueOf(),
        toBlock: initialBlockNum.valueOf() + BigInt(blocksToScan),
        strict: true,
    })

    // Keep a map of requests organized by transactionId since a single transaction id
    // can be associated with many EntitlementCheckRequested events if there are multiple
    // role ids to check.
    const requests: { [transactionId: Hex]: XChainRequest } = {}
    for (const log of requestLogs) {
        var result: boolean | undefined

        var responses: { [address: string]: boolean } = {}
        const responseLogs = await publicClient.getContractEvents({
            address: log.args.contractAddress,
            abi: EntitlementGatedAbi,
            eventName: 'EntitlementCheckResultPosted',
            fromBlock: log.blockNumber,
            toBlock: log.blockNumber + BigInt(transactionValidBlocks),
            args: {
                transactionId: log.args.transactionId,
            },
            strict: true,
        })

        if (responseLogs.length > 1) {
            logger.error(
                'Multiple results posted for the same entitlement request',
                'transactionId',
                log.args.transactionId,
                'resolverContract',
                log.args.contractAddress,
                'callerAddress',
                log.args.callerAddress,
            )
        }
        if (responseLogs.length >= 1) {
            const response = responseLogs[0]
            if (response.args.result === NodeVoteStatus.Passed) {
                result = true
            } else if (response.args.result === NodeVoteStatus.Failed) {
                result = false
            } else {
                logger.error(
                    'Entitlement Check Response has malformatted node vote',
                    'transactionHash',
                    response.transactionHash,
                    'requestTransactionId',
                    log.args.transactionId,
                    'requestBlockNumber',
                    log.blockNumber,
                    'responseBlockNumber',
                    response.blockNumber,
                )
            }
        }

        var request: XChainRequest
        if (log.args.transactionId in requests) {
            request = requests[log.args.transactionId]
            request.roleIds.push(log.args.roleId)
        } else {
            request = {
                callerAddress: log.args.callerAddress,
                contractAddress: log.args.contractAddress,
                transactionId: log.args.transactionId,
                roleIds: [log.args.roleId],
                requestedNodes: [...log.args.selectedNodes],
                blockNumber: log.blockNumber,
                responses: {},
                checkResult: result,
            }

            requests[request.transactionId] = request
        }
    }

    return Object.values(requests)
}
