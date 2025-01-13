import { ExternalGroup } from './externalGroup'
import { ExternalCrypto } from './externalCrypto'
import { dlog, DLogger } from '@river-build/dlog'

const defaultLogger = dlog('csb:mls:externalGroupService')

export class ExternalGroupService {
    private log: {
        debug: DLogger
        error: DLogger
    }

    private crypto: ExternalCrypto

    constructor(crypto: ExternalCrypto, opts?: { log: DLogger }) {
        this.crypto = crypto
        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
        }
    }

    public async getExternalGroup(_streamId: string): Promise<ExternalGroup | undefined> {
        throw new Error('Not implemented')
    }

    public exportTree(_group: ExternalGroup): Uint8Array {
        throw new Error('Not implemented')
    }

    public snapshot(_group: ExternalGroup): Promise<Uint8Array> {
        throw new Error('Not implemented')
    }

    public latestGroupInfo(_group: ExternalGroup): Uint8Array {
        throw new Error('Not implemented')
    }
}
