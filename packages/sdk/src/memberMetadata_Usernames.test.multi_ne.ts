/**
 * @group main
 */

import { EncryptedData } from '@river-build/proto'
import { MemberMetadata_Usernames } from './memberMetadata_Usernames'
import { usernameChecksum } from './utils'

describe('memberMetadata_UsernamesTests', () => {
    const streamId = 'streamid1'
    let usernames: MemberMetadata_Usernames
    beforeEach(() => {
        usernames = new MemberMetadata_Usernames(streamId)
    })

    it('clientCanSetUsername', async () => {
        const username = 'bob-username1'
        const checksum = usernameChecksum(username, streamId)
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))
    })

    it('clientCannotSetDuplicateUsername', async () => {
        const username = 'bob-username1'
        const checksum = usernameChecksum(username, streamId)
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-2',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))
    })

    it('duplicateUsernamesAreCaseInsensitive', async () => {
        const username = 'bob-username1'
        const checksum = usernameChecksum(username, streamId)
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        const username2 = 'BOB-USERNAME1'
        const checksum2 = usernameChecksum(username2, streamId)
        const encryptedData2 = new EncryptedData({
            ciphertext: username2,
            checksum: checksum2,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))

        usernames.addEncryptedData(
            'eventid-2',
            encryptedData2,
            'userid-2',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-2', username2)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))
    })

    it('usernameIsAvailableAfterChange', async () => {
        const username = 'bob-username1'
        const checksum = usernameChecksum(username, streamId)
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username]]))

        const username2 = 'bob-username2'
        const checksum2 = usernameChecksum(username2, streamId)
        const encryptedData2 = new EncryptedData({
            ciphertext: username2,
            checksum: checksum2,
        })

        // userid-1 changes their username
        usernames.addEncryptedData(
            'eventid-2',
            encryptedData2,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-2', username2)
        expect(usernames.plaintextUsernames).toEqual(new Map([['userid-1', username2]]))

        // userid-2 can now use the old username
        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-2',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)

        expect(usernames.plaintextUsernames).toEqual(
            new Map([
                ['userid-1', username2],
                ['userid-2', username],
            ]),
        )
    })

    it('clientCannotFakeChecksum', async () => {
        const username = 'bob-username1'
        const checksum = 'invalid-checksum'
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        usernames.onDecryptedContent('eventid-1', username)
        expect(usernames.plaintextUsernames).toEqual(new Map([]))
    })

    it('encryptedFlagsAreReturnedWhenEncrypted', async () => {
        const username = 'bob-username1'
        const checksum = usernameChecksum(username, streamId)
        const encryptedData = new EncryptedData({
            ciphertext: username,
            checksum: checksum,
        })

        usernames.addEncryptedData(
            'eventid-1',
            encryptedData,
            'userid-1',
            true,
            undefined,
            undefined,
            undefined,
        )
        const info = usernames.info('userid-1')
        expect(info.usernameEncrypted).toEqual(true)

        usernames.onDecryptedContent('eventid-1', username)
        const infoAfterDecrypt = usernames.info('userid-1')
        expect(infoAfterDecrypt.usernameEncrypted).toEqual(false)
    })
})
