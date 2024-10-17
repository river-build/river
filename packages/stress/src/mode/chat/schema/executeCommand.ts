import { StressClient } from '../../../utils/stressClient'
import { ChatConfig } from '../../common/types'
import { Command } from './testPlanSchema'
import { getLogger } from '../../../utils/logger'
import { joinSpace } from './commands/joinSpaceCommand'
import { check } from '@river-build/dlog'
import { mintMemberships } from './commands/mintMembershipCommand'
import { sendChannelMessage } from './commands/sendChannelMessageCommand'
import { expectChannelMessages } from './commands/expectChannelMessageCommand'

export async function executeCommand(
    command: Command,
    commandId: string, // For logging / error reporting
    chatConfig: ChatConfig,
    clients: StressClient[],
) {
    const logger = getLogger('stress:run', { function: 'executeCommand' })
    logger.info({ command }, '--------------- executing command ---------------')

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
    let execute: execFn | undefined = undefined

    switch (command.name) {
        case 'mintMemberships':
            {
                execute = async (client: StressClient, cfg: ChatConfig) => {
                    await mintMemberships(client, cfg, command.params)
                }
            }
            break
        case 'joinSpace':
            {
                execute = async (client: StressClient, cfg: ChatConfig) =>
                    await joinSpace(client, cfg, command.params)
            }
            break
        case 'expectChannelMessage':
            {
                execute = async (client: StressClient, cfg: ChatConfig) =>
                    await expectChannelMessages(client, cfg, command.params)
            }
            break
        case 'sendChannelMessage':
            {
                execute = async (client: StressClient, cfg: ChatConfig) => {
                    await sendChannelMessage(client, cfg, command.params)
                }
            }
            break
        default: {
            logger.error({ command }, 'unrecognized command type')
        }
    }

    check(!!execute, 'Unimplemented command type')
    await Promise.all(
        targetClients.map(async (client) => {
            // A null `execute` should not be an issue due to the check line above, but sometimes
            // tsc complains that execute may be undefined.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await execute!(client, chatConfig)
        }),
    )
}
