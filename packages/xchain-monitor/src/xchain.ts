import EntitlementCheckerAbi from '@river-build/generated/dev/abis/IEntitlementChecker.abi'
import EntitlementGatedAbi from '@river-build/generated/dev/abis/IEntitlementGated.abi'
import { Address, Hex, decodeFunctionData } from 'viem'
import { config } from './environment'
import { getLogger } from './logger'
import { BlockType, createCustomPublicClient, PublicClientType } from './client'

const logger = getLogger('xchain')

enum NodeVoteStatus {
    Passed = 1,
    Failed,
}

type PostResultSummary = { [roleId: number]: RoleResultSummary }
type RoleResultSummary = { [nodeAddress: string]: boolean }

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
    responses: PostResultSummary

    // checkResult will be defined for requests that had a result post. If a result was not posted,
    // then the entitlement gated failed to acheive quorum for any role id.
    checkResult: boolean | undefined
}

var blockCache: {
    [blockNumString: string]: BlockType
} = {}
async function scanForPostResults(
    client: PublicClientType,
    resolverAddress: Address,
    transactionId: Hex,
    requestBlockNum: bigint,
    expectedNodes: Address[],
): Promise<PostResultSummary> {
    var summary: PostResultSummary = {}

    const normalizedExpectedNodes = expectedNodes.map((address: Address): Address => {
        return address.toLowerCase() as Address
    })

    for (
        var i = requestBlockNum;
        i < requestBlockNum + BigInt(config.transactionValidBlocks);
        i++
    ) {
        if (!(i.toString() in blockCache)) {
            blockCache[i.toString()] = await client.getBlock({
                blockNumber: i,
                includeTransactions: true,
            })
            const block = blockCache[i.toString()]

            for (const tx of block.transactions) {
                // Skip txns that are not method calls to our contract
                if (
                    tx.to?.toLowerCase() !== resolverAddress.toLowerCase() ||
                    !tx.input ||
                    tx.input === '0x'
                ) {
                    continue
                }

                try {
                    // This decode may fail, as the resolver address may receive calls outside of
                    // what is defined by the ABI, especially if it is a diamond with many facets.
                    const decoded = decodeFunctionData({
                        abi: EntitlementGatedAbi,
                        data: tx.input,
                    })
                    const { functionName, args } = decoded

                    if (functionName !== 'postEntitlementCheckResult') {
                        continue
                    }

                    const [txTransactionId, roleId, nodeVoteStatus] = args
                    if (txTransactionId.toLowerCase() !== transactionId.toLowerCase()) {
                        continue
                    }

                    const sender = tx.from.toLowerCase() as Address
                    if (!normalizedExpectedNodes.includes(sender)) {
                        logger.error(
                            {
                                expectedNodes,
                                transactionId,
                                txnHash: tx.hash,
                                blockNumber: tx.blockNumber,
                                sender,
                            },
                            'postEntitlementCheckResult was from an unexpected address',
                        )
                        continue
                    }

                    if (
                        nodeVoteStatus !== NodeVoteStatus.Passed &&
                        nodeVoteStatus !== NodeVoteStatus.Failed
                    ) {
                        logger.error(
                            'postEntitlementCheckResult with unexpected nodeVoteStatus',
                            'nodeVoteStatus',
                            nodeVoteStatus,
                            'transactionId',
                            transactionId,
                            'txHash',
                            tx.hash,
                            'blockNumber',
                            tx.blockNumber,
                            'from',
                            tx.from,
                        )
                    }

                    // Initialize summary results for roleId if needed
                    const roleIdAsNumber = Number(roleId)
                    if (!(roleIdAsNumber in summary)) {
                        summary[roleIdAsNumber] = {}
                    }

                    const roleResult = summary[roleIdAsNumber]

                    if (sender in roleResult) {
                        logger.error(
                            'postEntitlementCheckResult called twice by the same sender',
                            'from',
                            sender,
                            'nodeVoteStatus',
                            nodeVoteStatus,
                            'transactionId',
                            transactionId,
                            'txHash',
                            tx.hash,
                            'blockNumber',
                            tx.blockNumber,
                            'existingResult',
                            roleResult[sender],
                        )
                        continue
                    }

                    roleResult[sender] = nodeVoteStatus === NodeVoteStatus.Passed
                } catch (err) {
                    continue
                }
            }
        }
    }

    return summary
}

export async function scanBlockchainForXchainEvents(
    initialBlockNum: BigInt,
    blocksToScan: number,
): Promise<XChainRequest[]> {
    // Reset block cache
    blockCache = {}

    const publicClient = createCustomPublicClient()

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

        const responseLogs = await publicClient.getContractEvents({
            address: log.args.contractAddress,
            abi: EntitlementGatedAbi,
            eventName: 'EntitlementCheckResultPosted',
            fromBlock: log.blockNumber,
            toBlock: log.blockNumber + BigInt(config.transactionValidBlocks),
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
                responses: await scanForPostResults(
                    publicClient,
                    log.args.contractAddress,
                    log.args.transactionId,
                    log.blockNumber,
                    [...log.args.selectedNodes],
                ),
                checkResult: result,
            }
            requests[request.transactionId] = request
        }
        // TODO:
        // - Validate that role ids appearing in responses match role ids at top level, emit error
        // if not.
        // - Validate that results for each role id are consistent, emit warning if not.
    }

    return Object.values(requests)
}
