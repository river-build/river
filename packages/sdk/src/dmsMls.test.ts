/**
 * @group main
 */

// import { makeTestClient, createEventDecryptedPromise, waitFor } from './util.test'
import { makeTestClient } from './util.test'
import { Client } from './client'
import { Client as MlsClient } from '@river-build/mls-rs-wasm'
import { MlsEvent } from '@river-build/proto'
import { MlsCrypto } from './mls'
// import { addressFromUserId, makeDMStreamId, streamIdAsBytes } from './id'
// import { makeEvent } from './sign'
// import { make_DMChannelPayload_Inception, make_MemberPayload_Membership2 } from './types'
// import { MembershipOp } from '@river-build/proto'

describe('mlsTests', () => {
    let clients: Client[] = []
    const makeInitAndStartClient = async () => {
        const client = await makeTestClient()
        await client.initializeUser()
        client.startSync()
        clients.push(client)
        return client
    }

    beforeEach(async () => {})

    afterEach(async () => {
        for (const client of clients) {
            await client.stop()
        }
        clients = []
    })

    const utf8Encoder = new TextEncoder()
    const utf8Decoder = new TextDecoder()

    // Sanity check for MLS
    test('jestCanLoadMlsLibrary', async () => {
        const aliceMlsClient: MlsClient = await MlsClient.create('Alice')
        const aliceMlsGroup = await aliceMlsClient.createGroup()

        const bobMlsClient: MlsClient = await MlsClient.create('Bob')
        const bobKeyPackage = await bobMlsClient.generateKeyPackageMessage()

        const {
            welcomeMessages: [welcome],
        } = await aliceMlsGroup.addMember(bobKeyPackage)

        const { group: bobMlsGroup } = await bobMlsClient.joinGroup(welcome)
        await aliceMlsGroup.applyPendingCommit()

        const message = await aliceMlsGroup.encryptApplicationMessage(
            utf8Encoder.encode('Hello Bob!'),
        )

        const received = await bobMlsGroup.processIncomingMessage(message)
        const applicationMessage = received.asApplicationMessage()!

        expect(applicationMessage).toBeDefined()

        expect(utf8Decoder.decode(applicationMessage.data())).toBe('Hello Bob!')
    })

    // NOTE: MLS Encryption is done out-of band
    test('clientsCanSendMlsMessages', async () => {
        const bobsClient = await makeInitAndStartClient()
        const alicesClient = await makeInitAndStartClient()
        const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)
        await expect(bobsClient.waitForStream(streamId)).toResolve()
        await expect(bobsClient.sendMlsMessage(streamId, utf8Encoder.encode('hello'))).toResolve()

        await expect(alicesClient.waitForStream(streamId)).toResolve()
        await expect(alicesClient.sendMlsMessage(streamId, utf8Encoder.encode('hello'))).toResolve()
    })

    test('MlsCryptoBackend', async () => {
        const alice = new MlsCrypto('Alice')
        const bob = new MlsCrypto('Bob')

        await alice.initialize()
        await bob.initialize()

        await alice.bootstrap('streamId')
        const bobKeyPackage = bob.keyPackage

        const { commit, welcome } = await alice.addMember('streamId', bobKeyPackage)

        // At this point commit and welcome are in a block and can be processed by both parties
        await bob.join('streamId', welcome)
        await alice.processCommit('streamId', commit)

        const aliceToBobMessage = await alice.encrypt('streamId', utf8Encoder.encode('Hello Bob!'))
        const bobReceived = await bob.decrypt('streamId', aliceToBobMessage)
        expect(utf8Decoder.decode(bobReceived)).toBe('Hello Bob!')

        const bobToAliceMessage = await bob.encrypt('streamId', utf8Encoder.encode('Hello Alice!'))
        const aliceReceived = await alice.decrypt('streamId', bobToAliceMessage)
        expect(utf8Decoder.decode(aliceReceived)).toBe('Hello Alice!')
    })

    type User = {
        state: 'waiting' | 'joined'
        keyPackage: Uint8Array
        identity: string
        backend: MlsCrypto
    }

    test('MlsCryptoBackendMulti', async () => {
        const alice = new MlsCrypto('Alice')
        await alice.initialize()
        await alice.bootstrap('streamId')

        const joinedUsers = new Set<MlsCrypto>()
        joinedUsers.add(alice)

        const users: Map<string, User> = new Map<string, User>()

        for (let i = 0; i < 10; i++) {
            const identity = `User_${i}`
            const backend = new MlsCrypto(identity)
            await backend.initialize()
            const keyPackage = backend.keyPackage

            users.set(identity, {
                state: 'waiting',
                keyPackage,
                identity,
                backend,
            })
        }

        // get random backend from joinedUsers
        function randomJoinedUser() {
            const users = Array.from(joinedUsers)
            return users[Math.floor(Math.random() * users.length)]
        }

        for (const user of users.values()) {
            const joinedUser = randomJoinedUser()

            const { commit, welcome } = await joinedUser.addMember('streamId', user.keyPackage)
            const welcomeEvent = { commit, welcome, identity: user.identity }

            // alice processes her commit
            await alice.processCommit('streamId', welcomeEvent.commit)

            // we are mimicking the loop of users reacting to events
            for (const user of users.values()) {
                if (welcomeEvent.identity === user.identity) {
                    // User joins
                    await user.backend.join('streamId', welcomeEvent.welcome)
                    user.state = 'joined'
                    joinedUsers.add(user.backend)
                } else if (user.state === 'joined') {
                    // User processes commit to advance their group
                    await user.backend.processCommit('streamId', welcomeEvent.commit)
                }
            }
        }

        // here all users should have joined
        expect(
            Array.from(users.values()).filter((user: User) => user.state === 'waiting'),
        ).toHaveLength(0)

        const aliceToAllMessage = await alice.encrypt('streamId', utf8Encoder.encode('Hello All!'))
        for (const user of users.values()) {
            const userReceived = await user.backend.decrypt('streamId', aliceToAllMessage)
            expect(utf8Decoder.decode(userReceived)).toBe('Hello All!')
        }
        // const aliceToBobMessage = await alice.encrypt('streamId', utf8Encoder.encode('Hello Bob!'))
        // const bobReceived = await bob.decrypt('streamId', aliceToBobMessage)
        // expect(utf8Decoder.decode(bobReceived)).toBe('Hello Bob!')

        // const bobToAliceMessage = await bob.encrypt('streamId', utf8Encoder.encode('Hello Alice!'))
        // const aliceReceived = await alice.decrypt('streamId', bobToAliceMessage)
        // expect(utf8Decoder.decode(aliceReceived)).toBe('Hello Alice!')
    })

    // test('clientsCanSendMlsEvents', async () => {
    //     const bobsClient = await makeInitAndStartClient()
    //     const alicesClient = await makeInitAndStartClient()
    //     const { streamId } = await bobsClient.createDMChannel(alicesClient.userId)

    //     const groupInfo = await bobsClient.mls.createGroupInfo()
    //     const groupInfoEvent = new MlsEvent({
    //         content: {
    //             case: 'groupInfo',
    //             value: {
    //                 groupInfo: groupInfo.toBytes(),
    //             },
    //         },
    //     })
    //     await expect(bobsClient.addMlsEvent(streamId, groupInfoEvent)).toResolve()

    //     const mlsEvent = new MlsEvent({
    //         content: {
    //             case: 'join',
    //             value: {
    //                 keyPackage: new Uint8Array([1, 2, 3, 4]),
    //             },
    //         },
    //     })
    //     await expect(bobsClient.addMlsEvent(streamId, mlsEvent)).toResolve()
    // })
})
