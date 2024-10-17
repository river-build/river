import { z } from 'zod'
import { baseCommand } from './baseCommand'

const paramsSchema = z.object({
    channelId: z.string(),
    timeoutMs: z.number().nonnegative(),
})

export const expectMessage = baseCommand.extend({
    name: z.literal('expectRootMessage'),
    params: paramsSchema,
})

export type ExpectMessageParams = z.infer<typeof paramsSchema>
