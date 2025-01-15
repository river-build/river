/// Adapter to hook MLS Coordinator to the client

import { Client } from '../client'
import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { DLogger, dlog } from '@river-build/dlog'

const defaultLogger = dlog('csb:mls:adapter')

export class MlsAdapter {
    private client: Client
    private log!: {
        error: DLogger
        debug: DLogger
    }

    public constructor(client: Client, opts?: { log: DLogger }) {
        this.client = client
        const logger = opts?.log ?? defaultLogger
        this.log = {
            debug: logger.extend('debug'),
            error: logger.extend('error'),
        }
    }

    // API exposed to the client
    public initialize(): Promise<void> {
        this.log.debug('initialize')
        return Promise.resolve()
    }

    public start(): void {
        this.log.debug('start')
    }

    public async stop(): Promise<void> {
        this.log.debug('stop')
    }

    public async encryptGroupEventEpochSecret(
        _streamId: string,
        _event: Message,
    ): Promise<EncryptedData> {
        this.log.debug('encryptGroupEventEpochSecret')
        throw new Error('Not implemented')
    }
}
