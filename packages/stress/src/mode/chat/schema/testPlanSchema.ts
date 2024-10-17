import { z } from 'zod'

import { joinSpaceCommand } from './commands/joinSpaceCommand'
import { sendChannelMessage } from './commands/sendChannelMessage'
import { expectChannelMessage } from './commands/expectChannelMessage'
import { mintMembershipsCommand } from './commands/mintMembershipCommand'

const commands = z.union([
    joinSpaceCommand,
    sendChannelMessage,
    expectChannelMessage,
    mintMembershipsCommand,
])

export const testSchema = z.object({
    commands: z.array(commands),
})

export type Command = z.infer<typeof commands>
export type TestPlan = z.infer<typeof testSchema>
