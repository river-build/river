import EntitlementCheckerAbi from '@river-build/generated/dev/abis/IEntitlementChecker.abi'
import EntitlementGatedAbi from '@river-build/generated/dev/abis/IEntitlementGated.abi'
import { Address, Hex, decodeFunctionData } from 'viem'
import { config } from './environment'
import { getLogger } from './logger'
import { BlockType, createCustomPublicClient, PublicClientType } from './client'

const logger = getLogger('xchain')

// NodeVoteStatus maps to the type used by the contract to denote the node's evaluation
// of the entitlement check. Subtlety to note here is that the 0 value is invalid in
// any response post, and a result of false is actually enum value 2.
enum NodeVoteStatus {
    Passed = 1,
    Failed,
}

// A single transaction may initiate several xchain requests according to each role that
// must be checked, and each role is going to have
type PostResultSummary = { [roleId: number]: RoleResultSummary }
type RoleResultSummary = { [nodeAddress: string]: boolean }

export interface XChainRequest {
    callerAddress: Address
    contractAddress: Address
    transactionId: Hex
    blockNumber: bigint
    requestedNodes: { [roleId: number]: Address[] }
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
): Promise<PostResultSummary> {
    var summary: PostResultSummary = {}

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

                    const sender = tx.from.toLowerCase() as Address
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
        // We can cast as a number here because these start from 0 and it's unlikely that a
        // space will have very big role ids.
        const roleId = Number(log.args.roleId)
        const transactionId = log.args.transactionId
        const selectedNodes = [...log.args.selectedNodes]
        const blockNumber = log.blockNumber
        var result: boolean | undefined

        const responseLogs = await publicClient.getContractEvents({
            address: log.args.contractAddress,
            abi: EntitlementGatedAbi,
            eventName: 'EntitlementCheckResultPosted',
            fromBlock: log.blockNumber,
            toBlock: log.blockNumber + BigInt(config.transactionValidBlocks),
            args: {
                transactionId,
            },
            strict: true,
        })

        if (responseLogs.length > 1) {
            logger.error(
                'Multiple results posted for the same entitlement request',
                'transactionId',
                transactionId,
                'resolverContract',
                log.args.contractAddress,
                'callerAddress',
                log.args.callerAddress,
            )
        }
        if (responseLogs.length >= 1) {
            // Just take the first response if more than one exists - this should not happen
            // and will cause an error log
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
                    transactionId,
                    'requestBlockNumber',
                    blockNumber,
                    'responseBlockNumber',
                    response.blockNumber,
                )
            }
        }

        var request: XChainRequest

        // If we've seen this request issued before, validate that we have not yet seen this
        // role id and add the expected nodes for it.
        if (transactionId in requests) {
            request = requests[transactionId]
            if (roleId in request.requestedNodes) {
                logger.error(
                    {
                        roleId,
                        transactionId,
                    },
                    '',
                )
            }
            request.requestedNodes[roleId] = selectedNodes
        } else {
            request = {
                callerAddress: log.args.callerAddress,
                contractAddress: log.args.contractAddress,
                transactionId: transactionId,
                requestedNodes: { [roleId]: selectedNodes },
                blockNumber,
                responses: await scanForPostResults(
                    publicClient,
                    log.args.contractAddress,
                    transactionId,
                    blockNumber,
                ),
                checkResult: result,
            }
            requests[transactionId] = request
        }
        // TODO:
        // - Validate that role ids appearing in responses match role ids in expectedNodes, emit error
        // if not.
        // validate that set of selected nodes for each roleId response is a subset of the set of
        // expectedNodes for that roleId
        // - Validate that results for each role id are consistent, emit warning if not.
    }

    return Object.values(requests)
}
