/**
 * @group main
 */

import { bobTalksToHimself } from './bob.test_util'
import { dlog } from '@river-build/dlog'
import { makeRandomUserContext } from './test-utils'
import { SignerContext } from './signerContext'

const baseLog = dlog('csb:test:bobFlushes')

describe('bobFlushes', () => {
    let bobsContext: SignerContext

    beforeEach(async () => {
        bobsContext = await makeRandomUserContext()
    })

    it('bobTalksToHimself-noflush-nopresync', async () => {
        await bobTalksToHimself(
            baseLog.extend('bobTalksToHimself-noflush-nopresync'),
            bobsContext,
            false,
            false,
        )
    })
    it('bobTalksToHimself-noflush-presync', async () => {
        await bobTalksToHimself(
            baseLog.extend('bobTalksToHimself-noflush-presync'),
            bobsContext,
            false,
            true,
        )
    })
})
