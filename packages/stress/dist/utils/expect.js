// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expect = (a) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toEqual: (b) => {
        if (a === b)
            return;
        throw new Error(`expected ${a} to equal ${b}`);
    },
});
export function isSet(value) {
    return value !== undefined && value !== null && value.length > 0;
}
//# sourceMappingURL=expect.js.map