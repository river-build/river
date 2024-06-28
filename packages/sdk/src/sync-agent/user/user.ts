import { dlogger } from '@river-build/dlog'
import { Client } from '../../client'
import { Observable } from '../../observable/observable'
import { PersistedObservable, persistedObservable } from '../../observable/persistedObservable'
import { LoadPriority, Store } from '../../store/store'
import { RiverConnection } from '../river-connection/riverConnection'
import { UserDeviceKeys } from './models/userDeviceKeys'
import { UserInbox } from './models/userInbox'
import { UserMemberships } from './models/userMemberships'
import { UserSettings } from './models/userSettings'
import { CreateSpaceParams, SpaceDapp } from '@river-build/web3'
import { ethers } from 'ethers'
import { makeDefaultChannelStreamId, makeSpaceStreamId } from '../../id'
import { makeDefaultMembershipInfo } from '../utils/spaceUtils'

const logger = dlogger('csb:user')

export interface UserModel {
    id: string
    initialized: boolean
}

export enum AuthStatus {
    /** User is not authenticated or connected to the river client. */
    None = 'None',
    /** Transition state: None -> EvaluatingCredentials -> [Credentialed OR ConnectedToRiver]
     *  if a river user is found, will connect to river client, otherwise will just validate credentials.
     */
    EvaluatingCredentials = 'EvaluatingCredentials',
    /** User authenticated with a valid credential but without an active river stream client. */
    Credentialed = 'Credentialed',
    /** User authenticated with a valid credential and with an active river river client. */
    ConnectedToRiver = 'ConnectedToRiver',
    /** Disconnected, client was stopped */
    Disconnected = 'Disconnected',
    /** Error state: User failed to authenticate or connect to river client. */
    Error = 'Error',
}

class LoginContext {
    constructor(
        public client: Client,
        public newUserMetadata?: { spaceId: Uint8Array | string },
        public cancelled: boolean = false,
    ) {}
}

@persistedObservable({ tableName: 'user' })
export class User extends PersistedObservable<UserModel> {
    streams: {
        memberships: UserMemberships
        inbox: UserInbox
        deviceKeys: UserDeviceKeys
        settings: UserSettings
    }
    authStatus = new Observable<AuthStatus>(AuthStatus.None)
    loginError?: Error
    private riverConnection: RiverConnection
    private spaceDapp: SpaceDapp
    private loginPromise?: { promise: Promise<void>; context: LoginContext }

    constructor(id: string, store: Store, riverConnection: RiverConnection, spaceDapp: SpaceDapp) {
        super({ id, initialized: false }, store, LoadPriority.high)
        this.streams = {
            memberships: new UserMemberships(id, store, riverConnection),
            inbox: new UserInbox(id, store, riverConnection),
            deviceKeys: new UserDeviceKeys(id, store, riverConnection),
            settings: new UserSettings(id, store, riverConnection),
        }
        this.riverConnection = riverConnection
        this.spaceDapp = spaceDapp
    }

    protected override async onLoaded() {
        this.riverConnection.registerView(this.onClientStarted)
    }

    private onClientStarted = (client: Client) => {
        const loginContext = new LoginContext(client)
        this.loginWithRetries(loginContext).catch((err) => {
            logger.error('login failed', err)
        })
        return () => {
            loginContext.cancelled = true
            this.authStatus.setValue(AuthStatus.Disconnected)
        }
    }

    async createSpace(
        params: Partial<Omit<CreateSpaceParams, 'spaceName'>> & { spaceName: string },
        signer: ethers.Signer,
    ) {
        const membershipInfo =
            params.membership ?? (await makeDefaultMembershipInfo(this.spaceDapp, this.data.id))
        const channelName = params.channelName ?? 'general'
        const transaction = await this.spaceDapp.createSpace(
            {
                spaceName: params.spaceName,
                spaceMetadata: params.spaceMetadata ?? params.spaceName,
                channelName: channelName,
                membership: membershipInfo,
            },
            signer,
        )
        const receipt = await transaction.wait()
        logger.log('transaction receipt', receipt)
        const spaceAddress = this.spaceDapp.getSpaceAddress(receipt)
        if (!spaceAddress) {
            throw new Error('Space address not found')
        }
        logger.log('spaceAddress', spaceAddress)
        const spaceId = makeSpaceStreamId(spaceAddress)
        const defaultChannelId = makeDefaultChannelStreamId(spaceAddress)
        logger.log('spaceId, defaultChannelId', { spaceId, defaultChannelId })
        await this.riverConnection.call(async (client) => {
            logger.log('createSpace with client')
            const context = new LoginContext(client, { spaceId })
            await this.loginWithRetries(context)
            await client.createSpace(spaceId)
            await client.createChannel(spaceId, channelName, '', defaultChannelId)
        })
        return { spaceId, defaultChannelId }
    }

    async joinSpace(
        spaceId: string,
        signer: ethers.Signer,
        opts?: { skipMintMembership?: boolean },
    ) {
        if (opts?.skipMintMembership !== true) {
            const { issued } = await this.spaceDapp.joinSpace(spaceId, this.data.id, signer)
            logger.log('joinSpace transaction', issued)
        }
        await this.riverConnection.call(async (client) => {
            const context = new LoginContext(client, { spaceId })
            await this.loginWithRetries(context)
            await client.joinStream(spaceId)
            await client.joinStream(makeDefaultChannelStreamId(spaceId))
        })
    }

    private async loginWithRetries(loginContext: LoginContext) {
        logger.log('login')
        if (this.loginPromise) {
            this.loginPromise.context.cancelled = true
            await this.loginPromise.promise
        }
        if (this.authStatus.value === AuthStatus.ConnectedToRiver) {
            return
        }
        this.authStatus.setValue(AuthStatus.EvaluatingCredentials)
        const login = async () => {
            let retryCount = 0
            const MAX_RETRY_COUNT = 20
            while (!loginContext.cancelled) {
                try {
                    logger.log('logging in')
                    const canInitialize =
                        this.data.initialized ||
                        loginContext.newUserMetadata ||
                        (await loginContext.client.userExists(this.data.id))
                    if (canInitialize) {
                        await loginContext.client.initializeUser(loginContext.newUserMetadata)
                        loginContext.client.startSync()
                        this.setData({ initialized: true })
                        this.authStatus.setValue(AuthStatus.ConnectedToRiver)
                    } else {
                        this.authStatus.setValue(AuthStatus.Credentialed)
                    }
                    break
                } catch (err) {
                    retryCount++
                    this.loginError = err as Error
                    logger.log('encountered exception while initializing', err)
                    if (retryCount >= MAX_RETRY_COUNT) {
                        this.authStatus.setValue(AuthStatus.Error)
                        throw err
                    } else {
                        const retryDelay = getRetryDelay(retryCount)
                        logger.log('retrying', { retryDelay, retryCount })
                        // sleep
                        await new Promise((resolve) => setTimeout(resolve, retryDelay))
                    }
                } finally {
                    this.loginPromise = undefined
                }
            }
        }
        this.loginPromise = { promise: login(), context: loginContext }
        return this.loginPromise.promise
    }
}

// exponentially back off, but never wait more than 20 seconds
function getRetryDelay(retryCount: number) {
    return Math.min(1000 * 2 ** retryCount, 20000)
}
