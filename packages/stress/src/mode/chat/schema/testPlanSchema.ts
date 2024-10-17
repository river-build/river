import { z } from 'zod'

import { joinSpaceCommand } from './commands/joinSpaceCommand'
import { sendRootMessage } from './commands/sendRootMessageCommand'
import { expectMessage } from './commands/expectMessageCommand'

const commands = z.union([joinSpaceCommand, sendRootMessage, expectMessage])

export const testSchema = z.object({
    commands: z.array(commands),
})

export type Command = z.infer<typeof commands>
export type TestPlan = z.infer<typeof testSchema>
