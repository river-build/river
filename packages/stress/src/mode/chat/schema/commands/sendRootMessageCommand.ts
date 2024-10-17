import { z } from 'zod'
import { baseCommand } from './baseCommand'

export const sendRootMessage = baseCommand.extend({
    name: z.literal('sendRootMessage'),
})
