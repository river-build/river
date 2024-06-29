import { CryptoStore, EntitlementsDelegate } from '@river-build/encryption'
import { Client, ClientEvents } from '../../../client'
import { StreamRpcClient } from '../../../makeStreamRpcClient'
import { SignerContext } from '../../../signerContext'
import { Store } from '../../../store/store'

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
    ) {
        super(
            signerContext,
            rpcClient,
            cryptoStore,
            entitlementsDelegate,
            persistenceStoreName,
            logNamespaceFilter,
            highPriorityStreamIds,
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
