import { StressClient } from '../../../utils/stressClient'
import { ChatConfig } from '../../common/types'
import { Command } from './testPlanSchema'
import { getLogger } from '../../../utils/logger'
import { joinSpace } from './commands/joinSpaceCommand'
import { check } from '@river-build/dlog'

export async function executeCommand(
    command: Command,
    commandId: string, // For logging / error reporting
    chatConfig: ChatConfig,
    clients: StressClient[],
) {
    const logger = getLogger('stress:run', { function: 'executeCommand' })
    logger.info({ command }, 'executing command')

    const range = (start: number, end: number) =>
        Array.from({ length: end - start }, (v, k) => k + start)
    // run on specified clients, or if unspecified, run on all clients assigned to this process
    const targetClientIndices =
        command.targetClients ??
        range(chatConfig.localClients.startIndex, chatConfig.localClients.endIndex)
    const targetClients = clients.filter((client) =>
        targetClientIndices.includes(client.clientIndex),
    )

    if (targetClients.length === 0) {
        logger.debug({ commandId }, 'No local clients to execute command')
        return
    }

    logger.debug({ commandId, targetClientIndices }, 'Executing command for clients', 'command')
    type execFn = (client: StressClient, cfg: ChatConfig) => Promise<void>
    var execute: execFn | undefined = undefined

    switch (command.name) {
        case 'joinSpace':
            {
                execute = async (client: StressClient, cfg: ChatConfig) =>
                    await joinSpace(client, cfg, command.params)
            }
            break
        case 'expectRootMessage':
            {
            }
            break
        case 'sendRootMessage':
            {
            }
            break
        default: {
            logger.error({ command }, 'unrecognized command type')
        }
    }

    check(!!execute, 'Unrecognized command type')
    await Promise.all(
        targetClients.map(async (client) => {
            await execute!(client, chatConfig)
        }),
    )
}
