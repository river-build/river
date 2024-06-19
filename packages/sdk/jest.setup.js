const originalStringify = JSON.stringify

// Patch json stringify to handle BigInt
JSON.stringify = function (value, replacer, space) {
    return originalStringify(
        value,
        (key, value) => (typeof value === 'bigint' ? value.toString() + 'n' : value),
        space,
    )
}
