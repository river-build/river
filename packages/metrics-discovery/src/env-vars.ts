import { z } from 'zod'

export const envVarsSchema = z.object({
    RIVER_RPC_URL: z.string().url(),
    ENV: z.string(),
})
