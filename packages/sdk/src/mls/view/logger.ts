import { DLogger } from '@river-build/dlog'

export type MlsLogger = {
    info?: DLogger
    debug?: DLogger
    error?: DLogger
    warn?: DLogger
}

export function extendLogger(logger: MlsLogger, namespace: string, delimiter?: string): MlsLogger {
    return {
        info: logger.info?.extend(namespace, delimiter),
        debug: logger.debug?.extend(namespace, delimiter),
        error: logger.error?.extend(namespace, delimiter),
        warn: logger.warn?.extend(namespace, delimiter),
    }
}
