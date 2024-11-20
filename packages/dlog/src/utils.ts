import { isNode } from 'browser-or-node'

export function isNodeEnv(): boolean {
    return isNode
}

export function isVitest(): boolean {
    return isNode && process.env.NODE_ENV === 'test'
}
