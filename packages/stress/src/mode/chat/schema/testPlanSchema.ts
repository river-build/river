import { z } from 'zod'

import { joinSpaceCommand } from './commands/joinSpaceCommand'
import { sendChannelMessageCommand } from './commands/sendChannelMessageCommand'
import { expectChannelMessageCommand } from './commands/expectChannelMessageCommand'
import { mintMembershipsCommand } from './commands/mintMembershipCommand'

const commands = z.union([
    joinSpaceCommand,
    sendChannelMessageCommand,
    mintMembershipsCommand,
    expectChannelMessageCommand,
])

export const testSchema = z.object({
    commands: z.array(commands),
})

export type Command = z.infer<typeof commands>
export type TestPlan = z.infer<typeof testSchema>
