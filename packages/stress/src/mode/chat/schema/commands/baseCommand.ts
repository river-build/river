import { z } from 'zod'

export const baseCommand = z.object({
    name: z.string(),
    targetClients: z.array(z.number().nonnegative()).optional(),
})
