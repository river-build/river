import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'
import { MlsAgent } from './mlsAgent'
import { Client as MlsClient, ClientOptions as MlsClientOptions } from '@river-build/mls-rs-wasm'
import { MlsQueue } from './mlsQueue'
import { Client } from '../client'
import { MlsProcessor } from './mlsProcessor'
import { IPersistenceStore } from '../persistenceStore'
import {MlsStream} from "./mlsStream";

const mlsClientOptions: MlsClientOptions = {
    withAllowExternalCommit: true,
    withRatchetTreeExtension: false,
}

export class MlsClientExtensions {
    private client: Client
    private persistenceStore?: IPersistenceStore
    public agent?: MlsAgent
    private mlsClient?: MlsClient

    constructor(client: Client, persistenceStore?: IPersistenceStore) {
        this.client = client
        this.persistenceStore = persistenceStore
    }

    public start(): void {
        this.agent?.start()
        this.agent?.queue.start()
        // nop
    }

    public async stop(): Promise<void> {
        await this.agent?.queue.stop()
        this.agent?.stop()
        // nop
    }

    public async initialize(deviceKey: Uint8Array): Promise<void> {
        // nop
        this.mlsClient = await MlsClient.create(deviceKey, mlsClientOptions)
        const queue = new MlsQueue()
        const processor = new MlsProcessor(this.client, this.mlsClient, this.persistenceStore)
        this.agent = new MlsAgent(this.client, processor, queue, this.client, this.client)
        this.agent.queue.delegate = this.agent
    }

    public async encryptMessage(streamId: string, message: Message): Promise<EncryptedData> {
        if (this.agent === undefined) {
            throw new Error('agent not initialized')
        }
        let mlsStream = this.agent.streams.get(streamId)
        if (mlsStream === undefined) {
            mlsStream = new MlsStream(streamId, this.client, this.persistenceStore)
            this.agent.streams.set(streamId, mlsStream)
        }
        return this.agent.processor.encryptMessage(mlsStream, message)
    }
}
