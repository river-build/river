import { config } from './environment'
import { getLogger } from './logger'
import { scanBlockchainForXchainEvents } from './xchain'

const logger = getLogger('main')

async function main() {
    const results = await scanBlockchainForXchainEvents(
        config.initialBlockNum,
        config.transactionValidBlocks,
        100000,
    )

    console.log(results)
}

await main()
