import { ethers } from 'ethers'
import {
    CheckOperation,
    CheckOperationType,
    LogicalOperationType,
    OperationType,
    decodeEntitlementData,
    encodeEntitlementData,
    evaluateTree,
    postOrderArrayToTree,
    Operation,
    AndOperation,
    OrOperation,
    treeToRuleData,
    ruleDataToOperations,
} from '../src/entitlement'
import { MOCK_ADDRESS } from '../src/Utils'
import { zeroAddress } from 'viem'
import { base } from 'viem/chains'

function makeRandomOperation(depth: number): Operation {
    const rand = Math.random()

    if ((depth > 5 && depth < 10 && rand < 1 / 3) || (depth < 10 && rand < 1 / 2)) {
        return {
            opType: OperationType.LOGICAL,
            logicalType: LogicalOperationType.AND,
            leftOperation: makeRandomOperation(depth + 1),
            rightOperation: makeRandomOperation(depth + 1),
        }
    } else if ((depth > 5 && depth < 10 && rand < 2 / 3) || (depth < 10 && rand > 1 / 2)) {
        return {
            opType: OperationType.LOGICAL,
            logicalType: LogicalOperationType.OR,
            leftOperation: makeRandomOperation(depth + 1),
            rightOperation: makeRandomOperation(depth + 1),
        }
    } else {
        return {
            opType: OperationType.CHECK,
            checkType: CheckOperationType.MOCK,
            chainId: rand > 0.5 ? 1n : 0n,
            contractAddress: generateRandomEthAddress(),
            threshold: rand > 0.5 ? 500n : 10n,
        }
    }
}

test('random', async () => {
    const operation = makeRandomOperation(0)
    // it takes a Uint8Array and returns a Uint8Array
    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], operation)
    expect(result).toBeDefined()
})

function generateRandomEthAddress(): `0x${string}` {
    let address: `0x${string}` = '0x'
    const characters = '0123456789abcdef'
    for (let i = 0; i < 40; i++) {
        address += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return address
}
/**
 * An operation that always returns true
 */
const falseCheck: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.MOCK,
    chainId: 0n,
    contractAddress: `0x0`,
    threshold: 10n,
} as const

const slowFalseCheck: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.MOCK,
    chainId: 0n,
    contractAddress: '0x1',
    threshold: 500n,
} as const

const trueCheck: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.MOCK,
    chainId: 1n,
    contractAddress: '0x0',
    threshold: 10n,
} as const

const slowTrueCheck: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.MOCK,
    chainId: 1n,
    contractAddress: '0x1',
    threshold: 500n,
} as const

// We have a custom NFT contract deployed to both ethereum sepolia and base sepolia where we
// can mint NFTs for testing. These are included in our unit tests because the local chain
// stack does not always behave the same as remote chains, so our xchain tests use them. We
// reproduce the same unit tests here to ensure parity between evaluation in xchain and the
// client.
// Contract addresses for the test NFT contracts.
const SepoliaTestNftContract: `0x${string}` = '0xb088b3f2b35511A611bF2aaC13fE605d491D6C19'
const SepoliaTestNftWallet_1Token: `0x${string}` = '0x1FDBA84c2153568bc22686B88B617CF64cdb0637'
const SepoliaTestNftWallet_3Tokens: `0x${string}` = '0xB79Af997239A334355F60DBeD75bEDf30AcD37bD'
const SepoliaTestNftWallet_2Tokens: `0x${string}` = '0x8cECcB1e5537040Fc63A06C88b4c1dE61880dA4d'

const ethereumSepoliaChainId = 11155111n
const baseSepoliaChainId = 84532n

const nftCheckEthereumSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: ethereumSepoliaChainId,
    contractAddress: SepoliaTestNftContract,
    threshold: 1n,
} as const

const nftMultiCheckEthereumSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: ethereumSepoliaChainId,
    contractAddress: SepoliaTestNftContract,
    threshold: 6n,
} as const

const nftMultiCheckHighThresholdEthereumSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: ethereumSepoliaChainId,
    contractAddress: SepoliaTestNftContract,
    threshold: 100n,
} as const

const nftCheckBaseSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: 84532n,
    contractAddress: SepoliaTestNftContract,
    threshold: 1n,
} as const

const nftMultiCheckBaseSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: 84532n,
    contractAddress: SepoliaTestNftContract,
    threshold: 6n,
} as const

const nftMultiCheckHighThresholdBaseSepolia: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC721,
    chainId: 84532n,
    contractAddress: SepoliaTestNftContract,
    threshold: 100n,
} as const

const ethSepoliaProvider = new ethers.providers.JsonRpcProvider(
    'https://ethereum-sepolia-rpc.publicnode.com',
)
const baseSepoliaProvider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org')

const nftCases = [
    {
        desc: 'base sepolia',
        check: nftCheckBaseSepolia,
        wallets: [SepoliaTestNftWallet_1Token],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia (no tokens)',
        check: nftCheckBaseSepolia,
        wallets: [ethers.constants.AddressZero],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'base sepolia (insufficient balance)',
        check: nftMultiCheckBaseSepolia,
        wallets: [SepoliaTestNftWallet_1Token],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'base sepolia multi-wallet',
        check: nftMultiCheckBaseSepolia,
        wallets: [
            SepoliaTestNftWallet_1Token,
            SepoliaTestNftWallet_2Tokens,
            SepoliaTestNftWallet_3Tokens,
        ],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia multi-wallet (insufficient balance)',
        check: nftMultiCheckHighThresholdBaseSepolia,
        wallets: [
            SepoliaTestNftWallet_1Token,
            SepoliaTestNftWallet_2Tokens,
            SepoliaTestNftWallet_3Tokens,
        ],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },

    {
        desc: 'eth sepolia',
        check: nftCheckEthereumSepolia,
        wallets: [SepoliaTestNftWallet_1Token],
        provider: ethSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'eth sepolia (no tokens)',
        check: nftCheckEthereumSepolia,
        wallets: [ethers.constants.AddressZero],
        provider: ethSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia (insufficient balance)',
        check: nftMultiCheckEthereumSepolia,
        wallets: [SepoliaTestNftWallet_1Token],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia multi-wallet',
        check: nftMultiCheckEthereumSepolia,
        wallets: [
            SepoliaTestNftWallet_1Token,
            SepoliaTestNftWallet_2Tokens,
            SepoliaTestNftWallet_3Tokens,
        ],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'eth sepolia multi-wallet (insufficient balance)',
        check: nftMultiCheckHighThresholdEthereumSepolia,
        wallets: [
            SepoliaTestNftWallet_1Token,
            SepoliaTestNftWallet_2Tokens,
            SepoliaTestNftWallet_3Tokens,
        ],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
]

test.each(nftCases)('erc721Check - $desc', async (props) => {
    const { check, wallets, provider, expectedResult } = props
    const controller = new AbortController()
    const result = await evaluateTree(controller, wallets, [provider], check)
    if (expectedResult) {
        expect(result).toBeTruthy()
    } else {
        expect(result).toEqual(zeroAddress)
    }
})

// These are the addresses of the chain link test contract on base sepolia and ethereum sepolia.
const baseSepoliaChainLinkContract: `0x${string}` = '0xE4aB69C077896252FAFBD49EFD26B5D171A32410'
const ethSepoliaChainLinkContract: `0x${string}` = '0x779877A7B0D9E8603169DdbD7836e478b4624789'

// The following are the addresses of the wallets that hold the chain link tokens for testing.
// Some wallet addresses are duplicated for the sake of self-documenting variable names.
const sepoliaChainLinkWallet_50Link: `0x${string}` = '0x4BCfC6962Ab0297aF801da21216014F53B46E991'
const sepoliaChainLinkWallet_25Link: `0x${string}` = '0xa4D440AeA5F555feEB5AEa0ddcED6e1B9FaD6A9C'
const baseSepoliaChainLinkWallet_50Link: `0x${string}` =
    '0x4BCfC6962Ab0297aF801da21216014F53B46E991'
const baseSepoliaChainLinkWallet_25Link: `0x${string}` =
    '0xa4D440AeA5F555feEB5AEa0ddcED6e1B9FaD6A9C'
const testEmptyAccount: `0x${string}` = '0xb227905F186095083869928BAb49cA9CE9546817'

const chainlinkExp = BigInt(10) ** BigInt(18)

const erc20ChainLinkCheckBaseSepolia_20Tokens: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC20,
    chainId: 84532n,
    contractAddress: baseSepoliaChainLinkContract,
    threshold: 20n * chainlinkExp,
}

const erc20ChainLinkCheckBaseSepolia_30Tokens: CheckOperation = {
    ...erc20ChainLinkCheckBaseSepolia_20Tokens,
    threshold: 30n * chainlinkExp,
}

const erc20ChainLinkCheckBaseSepolia_75Tokens: CheckOperation = {
    ...erc20ChainLinkCheckBaseSepolia_20Tokens,
    threshold: 75n * chainlinkExp,
}

const erc20ChainLinkCheckBaseSepolia_90Tokens: CheckOperation = {
    ...erc20ChainLinkCheckBaseSepolia_20Tokens,
    threshold: 90n * chainlinkExp,
}

const erc20ChainLinkEthereumSepolia_20Tokens: CheckOperation = {
    opType: OperationType.CHECK,
    checkType: CheckOperationType.ERC20,
    chainId: ethereumSepoliaChainId,
    contractAddress: ethSepoliaChainLinkContract,
    threshold: 20n * chainlinkExp,
}

const erc20ChainLinkCheckEthereumSepolia_30Tokens: CheckOperation = {
    ...erc20ChainLinkEthereumSepolia_20Tokens,
    threshold: 30n * chainlinkExp,
}

const erc20ChainLinkCheckEthereumSepolia_75Tokens: CheckOperation = {
    ...erc20ChainLinkEthereumSepolia_20Tokens,
    threshold: 75n * chainlinkExp,
}

const erc20ChainLinkCheckEthereumSepolia_90Tokens: CheckOperation = {
    ...erc20ChainLinkEthereumSepolia_20Tokens,
    threshold: 90n * chainlinkExp,
}

const erc20Cases = [
    {
        desc: 'base sepolia (empty wallet, false)',
        check: erc20ChainLinkCheckBaseSepolia_20Tokens,
        wallets: [testEmptyAccount],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'base sepolia (single wallet)',
        check: erc20ChainLinkCheckBaseSepolia_20Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia (two wallets)',
        check: erc20ChainLinkCheckBaseSepolia_20Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link, testEmptyAccount],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia (false)',
        check: erc20ChainLinkCheckBaseSepolia_30Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'base sepolia (two wallets, false)',
        check: erc20ChainLinkCheckBaseSepolia_30Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link, testEmptyAccount],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'base sepolia (two nonempty wallets, true)',
        check: erc20ChainLinkCheckBaseSepolia_30Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link, baseSepoliaChainLinkWallet_50Link],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia (two nonempty wallets, exact balance - true)',
        check: erc20ChainLinkCheckBaseSepolia_75Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link, baseSepoliaChainLinkWallet_50Link],
        provider: baseSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'base sepolia (two nonempty wallets, false)',
        check: erc20ChainLinkCheckBaseSepolia_90Tokens,
        wallets: [baseSepoliaChainLinkWallet_25Link, baseSepoliaChainLinkWallet_50Link],
        provider: baseSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia (empty wallet, false)',
        check: erc20ChainLinkCheckEthereumSepolia_30Tokens,
        wallets: [testEmptyAccount],
        provider: ethSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia (single wallet)',
        check: erc20ChainLinkCheckBaseSepolia_20Tokens,
        wallets: [sepoliaChainLinkWallet_25Link],
        provider: ethSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'eth sepolia (two wallets)',
        check: erc20ChainLinkCheckBaseSepolia_20Tokens,
        wallets: [sepoliaChainLinkWallet_25Link, testEmptyAccount],
        provider: ethSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'eth sepolia (false)',
        check: erc20ChainLinkCheckBaseSepolia_30Tokens,
        wallets: [sepoliaChainLinkWallet_25Link],
        provider: ethSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia (two wallets, false)',
        check: erc20ChainLinkCheckBaseSepolia_30Tokens,
        wallets: [sepoliaChainLinkWallet_25Link, testEmptyAccount],
        provider: ethSepoliaProvider,
        expectedResult: false,
    },
    {
        desc: 'eth sepolia (two nonempty wallets, exact balance - true)',
        check: erc20ChainLinkCheckEthereumSepolia_75Tokens,
        wallets: [sepoliaChainLinkWallet_25Link, sepoliaChainLinkWallet_50Link],
        provider: ethSepoliaProvider,
        expectedResult: true,
    },
    {
        desc: 'eth sepolia (two nonempty wallets, false)',
        check: erc20ChainLinkCheckEthereumSepolia_90Tokens,
        wallets: [sepoliaChainLinkWallet_25Link, sepoliaChainLinkWallet_50Link],
        provider: ethSepoliaProvider,
        expectedResult: false,
    },
]

test.each(erc20Cases)('erc20Check - $desc', async (props) => {
    const { check, wallets, provider, expectedResult } = props
    const controller = new AbortController()
    const result = await evaluateTree(controller, wallets, [provider], check)
    if (expectedResult) {
        expect(result).toBeTruthy()
    } else {
        expect(result).toEqual(zeroAddress)
    }
})

/*
["andOperation", trueCheck, trueCheck, true],
["andOperation", falseCheck, falseCheck, false],
["andOperation", falseCheck, falseCheck, false],
["andOperation", falseCheck, falseCheck, false],
];
*/

const orCases = [
    { leftCheck: trueCheck, rightCheck: trueCheck, expectedResult: MOCK_ADDRESS },
    { leftCheck: trueCheck, rightCheck: falseCheck, expectedResult: MOCK_ADDRESS },
    { leftCheck: falseCheck, rightCheck: trueCheck, expectedResult: MOCK_ADDRESS },
    { leftCheck: falseCheck, rightCheck: falseCheck, expectedResult: ethers.constants.AddressZero },
]

test.each(orCases)('orOperation', async (props) => {
    const { leftCheck, rightCheck, expectedResult } = props
    const orOperation: OrOperation = {
        opType: OperationType.LOGICAL,
        logicalType: LogicalOperationType.OR,
        leftOperation: leftCheck,
        rightOperation: rightCheck,
    } as const

    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], orOperation)
    expect(result).toBe(expectedResult)
})

const slowOrCases = [
    {
        leftCheck: trueCheck,
        rightCheck: slowTrueCheck,
        expectedResult: MOCK_ADDRESS,
        expectedTime: 10,
    },
    {
        leftCheck: trueCheck,
        rightCheck: slowFalseCheck,
        expectedResult: MOCK_ADDRESS,
        expectedTime: 10,
    },
    {
        leftCheck: slowFalseCheck,
        rightCheck: trueCheck,
        expectedResult: MOCK_ADDRESS,
        expectedTime: 10,
    },
    {
        leftCheck: falseCheck,
        rightCheck: slowFalseCheck,
        expectedResult: ethers.constants.AddressZero,
        expectedTime: 500,
    },
]

test.each(slowOrCases)('slowOrOperation', async (props) => {
    const { leftCheck, rightCheck, expectedResult, expectedTime } = props
    const operation: OrOperation = {
        opType: OperationType.LOGICAL,
        logicalType: LogicalOperationType.OR,
        leftOperation: leftCheck,
        rightOperation: rightCheck,
    } as const

    const controller = new AbortController()
    const start = performance.now()
    const result = await evaluateTree(controller, [], [], operation)
    const timeTaken = performance.now() - start
    expect(timeTaken).toBeCloseTo(expectedTime, -2)
    expect(result).toBe(expectedResult)
})

const andCases = [
    { leftCheck: trueCheck, rightCheck: trueCheck, expectedResult: MOCK_ADDRESS },
    { leftCheck: trueCheck, rightCheck: falseCheck, expectedResult: ethers.constants.AddressZero },
    { leftCheck: falseCheck, rightCheck: trueCheck, expectedResult: ethers.constants.AddressZero },
    { leftCheck: falseCheck, rightCheck: falseCheck, expectedResult: ethers.constants.AddressZero },
]

test.each(andCases)('andOperation', async (props) => {
    const { leftCheck, rightCheck, expectedResult } = props
    const operation: AndOperation = {
        opType: OperationType.LOGICAL,
        logicalType: LogicalOperationType.AND,
        leftOperation: leftCheck,
        rightOperation: rightCheck,
    } as const

    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], operation)
    expect(result).toBe(expectedResult)
})

const slowAndCases = [
    {
        leftCheck: trueCheck,
        rightCheck: slowTrueCheck,
        expectedResult: MOCK_ADDRESS,
        expectedTime: 500,
    },
    {
        leftCheck: slowTrueCheck,
        rightCheck: falseCheck,
        expectedResult: ethers.constants.AddressZero,
        expectedTime: 10,
    },
    {
        leftCheck: falseCheck,
        rightCheck: slowTrueCheck,
        expectedResult: ethers.constants.AddressZero,
        expectedTime: 10,
    },
    {
        leftCheck: falseCheck,
        rightCheck: slowFalseCheck,
        expectedResult: ethers.constants.AddressZero,
        expectedTime: 10,
    },
]

test.each(slowAndCases)('slowAndOperation', async (props) => {
    const { leftCheck, rightCheck, expectedResult, expectedTime } = props
    const operation: AndOperation = {
        opType: OperationType.LOGICAL,
        logicalType: LogicalOperationType.AND,
        leftOperation: leftCheck,
        rightOperation: rightCheck,
    } as const

    const controller = new AbortController()
    const start = performance.now()
    const result = await evaluateTree(controller, [], [], operation)
    const timeTaken = performance.now() - start

    expect(result).toBe(expectedResult)
    expect(timeTaken).toBeCloseTo(expectedTime, -2)
})

test('empty', async () => {
    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], undefined)
    expect(result).toBe(ethers.constants.AddressZero)
})

test('true', async () => {
    const operation = trueCheck

    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], operation)
    expect(result).toBe(MOCK_ADDRESS)
})

test('false', async () => {
    const operation = falseCheck

    const controller = new AbortController()
    const result = await evaluateTree(controller, [], [], operation)
    expect(result).toBe(ethers.constants.AddressZero)
})

test('encode', async () => {
    const randomTree = makeRandomOperation(5)

    const data = treeToRuleData(randomTree)
    const encoded = encodeEntitlementData(data)

    const decodedDag = decodeEntitlementData(encoded)
    const operations = ruleDataToOperations(decodedDag)
    const newTree = postOrderArrayToTree(operations)
    expect(randomTree.opType === newTree.opType).toBeTruthy()
})
