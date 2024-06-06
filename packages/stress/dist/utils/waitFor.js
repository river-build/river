export async function waitFor(condition, opts) {
    const interval = opts?.interval ?? 100;
    const timeoutMs = opts?.timeoutMs ?? 10000;
    const start = Date.now();
    let result = undefined;
    while (!result) {
        const retVal = condition();
        if (retVal && retVal instanceof Promise) {
            result = await retVal;
        }
        else {
            result = retVal;
        }
        if (!result) {
            if (Date.now() - start > timeoutMs) {
                throw new Error(`${opts?.logId ?? ''} timeout after ${timeoutMs}ms`);
            }
            else {
                await new Promise((resolve) => setTimeout(resolve, interval));
            }
        }
    }
    return result;
}
//# sourceMappingURL=waitFor.js.map