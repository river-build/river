import { z } from 'zod'
import { baseCommand } from './baseCommand'

const paramsSchema = z.object({
    channelId: z.string(),
    timeoutMs: z.number().nonnegative(),
})

export const expectChannelMessage = baseCommand.extend({
    name: z.literal('expectChannelMessage'),
    params: paramsSchema,
})

export type ExpectChannelMessageParams = z.infer<typeof paramsSchema>
