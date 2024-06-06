import { isNode } from 'browser-or-node';
export function isNodeEnv() {
    return isNode;
}
export function isJest() {
    return isNode && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined);
}
//# sourceMappingURL=utils.js.map