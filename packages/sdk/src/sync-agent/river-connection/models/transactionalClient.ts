import { CryptoStore, EntitlementsDelegate } from '@river-build/encryption'
import { Client, ClientEvents } from '../../../client'
import { StreamRpcClient } from '../../../makeStreamRpcClient'
import { SignerContext } from '../../../signerContext'
import { Store } from '../../../store/store'
import { UnpackEnvelopeOpts } from '../../../sign'
import type { Unpacker } from '../../../unpacker'

export class TransactionalClient extends Client {
    store: Store
    constructor(
        store: Store,
        signerContext: SignerContext,
        rpcClient: StreamRpcClient,
        cryptoStore: CryptoStore,
        entitlementsDelegate: EntitlementsDelegate,
        persistenceStoreName?: string,
        logNamespaceFilter?: string,
        highPriorityStreamIds?: string[],
        unpacker?: Unpacker,
        unpackEnvelopeOpts?: UnpackEnvelopeOpts,
    ) {
        super(
            signerContext,
            rpcClient,
            cryptoStore,
            entitlementsDelegate,
            persistenceStoreName,
            logNamespaceFilter,
            highPriorityStreamIds,
            unpacker,
            unpackEnvelopeOpts,
        )
        this.store = store
    }

    override emit<E extends keyof ClientEvents>(
        event: E,
        ...args: Parameters<ClientEvents[E]>
    ): boolean {
        return this.store.withTransaction(event.toLocaleString(), () => {
            return super.emit(event, ...args)
        })
    }
}
