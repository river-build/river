import { Message } from '@bufbuild/protobuf'
import { EncryptedData } from '@river-build/proto'

export class MlsClientExtensions {
    public start(): void {
        // nop
    }

    public async stop(): Promise<void> {
        // nop
    }

    public async initialize(): Promise<void> {
        // nop
    }

    public async encryptMessage(_streamId: string, _message: Message): Promise<EncryptedData> {
        throw new Error('Not implemented')
    }
}
