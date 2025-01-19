import { Client as MlsClient } from '@river-build/mls-rs-wasm'
import { ConfirmedMlsEvent } from './types'

export class LocalView {
    private client: MlsClient

    private constructor(client: MlsClient) {
        this.client = client
    }

    public async processConfirmedEvent(_event: ConfirmedMlsEvent): Promise<void> {
        // nop
    }

    public static async loadFromStorage(): Promise<LocalView> {
        throw new Error('Not implemented')
    }
}
