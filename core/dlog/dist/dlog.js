import { bin_toHexString, isHexString, shortenHexString } from './binary';
import debug from 'debug';
import { isJest } from './utils';
// Works as debug.enabled, but falls back on options if not explicitly set in env instead of returning false.
debug.enabled = (ns) => {
    if (ns.length > 0 && ns[ns.length - 1] === '*') {
        return true;
    }
    for (const s of debug.skips) {
        if (s.test(ns)) {
            return false;
        }
    }
    for (const s of debug.names) {
        if (s.test(ns)) {
            return true;
        }
    }
    const opts = allDlogs.get(ns)?.opts;
    if (opts !== undefined) {
        if (!opts.allowJest && isJest()) {
            return false;
        }
        else {
            return opts.defaultEnabled ?? false;
        }
    }
    return false;
};
// Set namespaces to empty string if not set so debug.enabled() is called and can retireve defaultEnabled from options.
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (debug.namespaces === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ;
    debug.namespaces = '';
}
const MAX_CALL_STACK_SZ = 18;
const hasOwnProperty = (obj, prop) => {
    return Object.prototype.hasOwnProperty.call(obj, prop);
};
export const cloneAndFormat = (obj, opts) => {
    return _cloneAndFormat(obj, 0, new WeakSet(), opts?.shortenHex === true);
};
const _cloneAndFormat = (obj, depth, seen, shorten) => {
    if (depth > MAX_CALL_STACK_SZ) {
        return 'MAX_CALL_STACK_SZ exceeded';
    }
    if (typeof obj === 'object' && obj !== null) {
        if (seen.has(obj)) {
            return '[circular reference]';
        }
        seen.add(obj);
    }
    if (typeof obj === 'string') {
        return isHexString(obj) && shorten ? shortenHexString(obj) : obj;
    }
    if (obj instanceof Uint8Array) {
        return shorten ? shortenHexString(bin_toHexString(obj)) : bin_toHexString(obj);
    }
    if (obj instanceof BigInt || typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        return obj.map((e) => _cloneAndFormat(e, depth + 1, seen, shorten));
    }
    if (typeof obj === 'object' && obj !== null) {
        if (obj instanceof Error) {
            return obj.stack || obj.message;
        }
        if (typeof obj[Symbol.iterator] === 'function') {
            // Iterate over values of Map, Set, etc.
            const newObj = [];
            for (const e of obj) {
                newObj.push(_cloneAndFormat(e, depth + 1, seen, shorten));
            }
            return newObj;
        }
        const newObj = {};
        for (const key in obj) {
            if (hasOwnProperty(obj, key)) {
                let newKey = key;
                if (typeof key === 'string' && isHexString(key) && shorten) {
                    newKey = shortenHexString(key);
                }
                if (key == 'emitter') {
                    newObj[newKey] = '[emitter]';
                }
                else {
                    newObj[newKey] = _cloneAndFormat(obj[key], depth + 1, seen, shorten);
                }
            }
        }
        return newObj;
    }
    return obj;
};
const allDlogs = new Map();
const makeDlog = (d, opts) => {
    if (opts?.printStack) {
        // eslint-disable-next-line no-console
        d.log = console.error.bind(console);
    }
    const dlog = (...args) => {
        if (!d.enabled || args.length === 0) {
            return;
        }
        const fmt = [];
        const newArgs = [];
        const tailArgs = [];
        for (let i = 0; i < args.length; i++) {
            let c = args[i];
            if (typeof c === 'string') {
                fmt.push('%s ');
                if (isHexString(c)) {
                    c = shortenHexString(c);
                }
                newArgs.push(c);
            }
            else if (typeof c === 'object' && c !== null) {
                if (c instanceof Error) {
                    tailArgs.push('\n');
                    tailArgs.push(c);
                }
                else {
                    fmt.push('%O\n');
                    newArgs.push(cloneAndFormat(c, { shortenHex: true }));
                }
            }
            else {
                fmt.push('%O ');
                newArgs.push(c);
            }
        }
        d(fmt.join(''), ...newArgs, ...tailArgs);
    };
    dlog.baseDebug = d;
    dlog.namespace = d.namespace;
    dlog.opts = opts;
    dlog.extend = (sub, delimiter) => {
        return makeDlog(d.extend(sub, delimiter), opts);
    };
    Object.defineProperty(dlog, 'enabled', {
        enumerable: true,
        configurable: false,
        get: () => d.enabled,
        set: (v) => (d.enabled = v),
    });
    allDlogs.set(d.namespace, dlog);
    return dlog;
};
/**
 * Create a new logger with namespace `ns`.
 * It's based on the `debug` package logger with custom formatter:
 * All aguments are formatted, hex strings and UInt8Arrays are printer as hex and shortened.
 * No %-specifiers are supported.
 *
 * @param ns Namespace for the logger.
 * @returns New logger with namespace `ns`.
 */
export const dlog = (ns, opts) => {
    return makeDlog(debug(ns), opts);
};
/**
 * Same as dlog, but logger is bound to console.error so clicking on it expands log site callstack (in addition to printed error callstack).
 * Also, logger is enabled by default, except if running in jest.
 *
 * @param ns Namespace for the logger.
 * @returns New logger with namespace `ns`.
 */
export const dlogError = (ns) => {
    const l = makeDlog(debug(ns), { defaultEnabled: true, printStack: true });
    return l;
};
/**
 * Create complex logger with multiple levels
 * @param ns Namespace for the logger.
 * @returns New logger with log/info/error namespace `ns`.
 */
export const dlogger = (ns) => {
    return {
        log: makeDlog(debug(ns + ':log')),
        info: makeDlog(debug(ns + ':info'), { defaultEnabled: true, allowJest: true }),
        error: dlogError(ns + ':error'),
    };
};
//# sourceMappingURL=dlog.js.map