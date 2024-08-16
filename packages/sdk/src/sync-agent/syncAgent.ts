import { RiverConnection, RiverConnectionModel } from './river-connection/riverConnection'
import { RiverConfig } from '../riverConfig'
import { RiverRegistry, SpaceDapp } from '@river-build/web3'
import { RetryParams } from '../rpcInterceptors'
import { Store } from '../store/store'
import { SignerContext } from '../signerContext'
import { userIdFromAddress } from '../id'
import { StreamNodeUrlsModel } from './river-connection/models/streamNodeUrls'
import { User, UserModel } from './user/user'
import { makeBaseProvider, makeRiverProvider } from './utils/providers'
import { UserMembershipsModel } from './user/models/userMemberships'
import { RiverDbManager } from '../riverDbManager'
import { Entitlements } from './entitlements/entitlements'
import { PersistedObservable } from '../observable/persistedObservable'
import { Observable } from '../observable/observable'
import { UserInboxModel } from './user/models/userInbox'
import { DB_MODELS, DB_VERSION } from './db'
import { UserDeviceKeysModel } from './user/models/userDeviceKeys'
import { UserSettingsModel } from './user/models/userSettings'
import { Spaces, SpacesModel } from './spaces/spaces'
import { AuthStatus } from './river-connection/models/authStatus'
import { ethers } from 'ethers'
import { makeStreamRpcClient, type MakeRpcClientType } from '../makeStreamRpcClient'
import type { EncryptionDeviceInitOpts } from '@river-build/encryption'

export interface SyncAgentConfig {
    context: SignerContext
    riverConfig: RiverConfig
    retryParams?: RetryParams
    highPriorityStreamIds?: string[]
    deviceId?: string
    disablePersistenceStore?: boolean
    riverProvider?: ethers.providers.Provider
    baseProvider?: ethers.providers.Provider
    makeRpcClient?: MakeRpcClientType
    encryptionDevice?: EncryptionDeviceInitOpts
}

export class SyncAgent {
    userId: string
    config: SyncAgentConfig
    riverConnection: RiverConnection
    store: Store
    user: User
    spaces: Spaces

    // flattened observables - just pointers to the observable objects in the models
    observables: {
        riverAuthStatus: Observable<AuthStatus>
        riverConnection: PersistedObservable<RiverConnectionModel>
        riverStreamNodeUrls: PersistedObservable<StreamNodeUrlsModel>
        spaces: PersistedObservable<SpacesModel>
        user: PersistedObservable<UserModel>
        userMemberships: PersistedObservable<UserMembershipsModel>
        userInbox: PersistedObservable<UserInboxModel>
        userDeviceKeys: PersistedObservable<UserDeviceKeysModel>
        userSettings: PersistedObservable<UserSettingsModel>
    }

    constructor(config: SyncAgentConfig) {
        this.userId = userIdFromAddress(config.context.creatorAddress)
        this.config = config
        const base = config.riverConfig.base
        const river = config.riverConfig.river
        const baseProvider = config.baseProvider ?? makeBaseProvider(config.riverConfig)
        const riverProvider = config.riverProvider ?? makeRiverProvider(config.riverConfig)
        this.store = new Store(this.syncAgentDbName(), DB_VERSION, DB_MODELS)
        this.store.newTransactionGroup('SyncAgent::initalization')
        const spaceDapp = new SpaceDapp(base.chainConfig, baseProvider)
        const riverRegistryDapp = new RiverRegistry(river.chainConfig, riverProvider)
        this.riverConnection = new RiverConnection(
            this.store,
            spaceDapp,
            riverRegistryDapp,
            config.makeRpcClient ?? makeStreamRpcClient,
            {
                signerContext: config.context,
                cryptoStore: RiverDbManager.getCryptoDb(this.userId, this.cryptoDbName()),
                entitlementsDelegate: new Entitlements(this.config.riverConfig, spaceDapp),
                persistenceStoreName:
                    config.disablePersistenceStore !== true ? this.persistenceDbName() : undefined,
                logNamespaceFilter: undefined,
                highPriorityStreamIds: this.config.highPriorityStreamIds,
                rpcRetryParams: config.retryParams,
                encryptionDevice: config.encryptionDevice,
            },
        )

        this.user = new User(this.userId, this.store, this.riverConnection)
        this.spaces = new Spaces(this.store, this.riverConnection, this.user.memberships, spaceDapp)

        // flatten out the observables
        this.observables = {
            riverAuthStatus: this.riverConnection.authStatus,
            riverConnection: this.riverConnection,
            riverStreamNodeUrls: this.riverConnection.streamNodeUrls,
            spaces: this.spaces,
            user: this.user,
            userMemberships: this.user.memberships,
            userInbox: this.user.inbox,
            userDeviceKeys: this.user.deviceKeys,
            userSettings: this.user.settings,
        }
    }

    async start() {
        // commit the initialization transaction, which triggers onLoaded on the models
        await this.store.commitTransaction()
        // start thie river connection, this will log us in if the user is already signed up
        // it will leave us in a connected state otherwise, see riverConnection.authStatus
        await this.riverConnection.start()
    }

    async stop() {
        await this.riverConnection.stop()
    }

    syncAgentDbName(): string {
        return this.dbName('syncAgent')
    }

    persistenceDbName(): string {
        return this.dbName('persistence')
    }

    cryptoDbName(): string {
        return this.dbName('database')
    }

    dbName(db: string): string {
        const envSuffix =
            this.config.riverConfig.environmentId === 'gamma'
                ? ''
                : `-${this.config.riverConfig.environmentId}`
        const postfix = this.config.deviceId !== undefined ? `-${this.config.deviceId}` : ''
        const dbName = `${db}-${this.userId}${envSuffix}${postfix}`
        return dbName
    }
}
