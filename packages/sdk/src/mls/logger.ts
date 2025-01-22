import { DLogger } from '@river-build/dlog'

export type MlsLogger = {
    info?: DLogger
    debug?: DLogger
    error?: DLogger
    warn?: DLogger
}

export function extendAll(logger: MlsLogger, namespace: string, delimiter?: string): MlsLogger {
    return {
        info: logger.info?.extend(namespace, delimiter),
        debug: logger.debug?.extend(namespace, delimiter),
        error: logger.error?.extend(namespace, delimiter),
        warn: logger.warn?.extend(namespace, delimiter),
    }
}

export function fromSingle(logger: DLogger): MlsLogger {
    return {
        info: logger.extend('info'),
        debug: logger.extend('debug'),
        error: logger.extend('error'),
        warn: logger.extend('warn'),
    }
}
