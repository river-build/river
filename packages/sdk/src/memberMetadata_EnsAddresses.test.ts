/**
 * @group main
 */

import { userIdFromAddress } from './id'
import { MemberMetadata_EnsAddresses } from './memberMetadata_EnsAddresses'
import { makeRandomUserAddress } from './test-utils'

describe('memberMetadata_EnsAddressesTests', () => {
    const streamId = 'streamid1'
    let ensAddresses: MemberMetadata_EnsAddresses
    beforeEach(() => {
        ensAddresses = new MemberMetadata_EnsAddresses(streamId)
    })

    it('clientCanSetEnsAddress', async () => {
        const ensAddress = makeRandomUserAddress()
        ensAddresses.addEnsAddressEvent('event-id-1', ensAddress, 'userid-1', true, undefined)

        // the plaintext map is empty until the event is no longer pending
        expect(ensAddresses.confirmedEnsAddresses).toEqual(new Map([]))
        ensAddresses.onConfirmEvent('event-id-1')
        // event confirmed, now it exists in the map
        expect(ensAddresses.confirmedEnsAddresses).toEqual(
            new Map([['userid-1', userIdFromAddress(ensAddress)]]),
        )
    })

    it('clientCanClearEnsAddress', async () => {
        const ensAddress = makeRandomUserAddress()
        ensAddresses.addEnsAddressEvent('event-id-1', ensAddress, 'userid-1', true, undefined)

        // the plaintext map is empty until the event is no longer pending
        expect(ensAddresses.confirmedEnsAddresses).toEqual(new Map([]))
        ensAddresses.onConfirmEvent('event-id-1')
        // event confirmed, now it exists in the map
        expect(ensAddresses.confirmedEnsAddresses).toEqual(
            new Map([['userid-1', userIdFromAddress(ensAddress)]]),
        )

        const clearAddress = new Uint8Array()
        ensAddresses.addEnsAddressEvent('event-id-2', clearAddress, 'userid-1', true, undefined)
        ensAddresses.onConfirmEvent('event-id-2')
        // clear event confirmed, map should be empty
        expect(ensAddresses.confirmedEnsAddresses).toEqual(new Map([]))
    })
})
