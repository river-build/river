import fs, { WriteFileOptions } from 'fs'

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
