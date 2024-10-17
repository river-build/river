import { z } from 'zod'
import { baseCommand } from './baseCommand'

export const sendChannelMessage = baseCommand.extend({
    name: z.literal('sendChannelMessage'),
})
