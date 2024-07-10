import * as z from 'zod'

const envSchema = z.object({
    DEBUG: z.string().optional(),
    NODE_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
    RIVER_ENV: z.string().optional(),
    SPACE_ID: z.string(),
    CHANNEL_ID: z.string(),
    MNEMONIC: z.string(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error(parsed.error)
    throw new Error('Invalid environment variables')
}

export const env = parsed.data
