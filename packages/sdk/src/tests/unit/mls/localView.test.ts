import { describe } from 'vitest'

describe('LocalViewTests', () => {
    describe('InitializeGroup', () => {
        it('accepted initialize group makes active', () => {
            // TODO
        })

        it('rejected initialize group makes rejected', () => {
            // TODO
        })

        it('accepted initialize group with different group id makes rejected', () => {
            // TODO
        })
    })

    describe('ExternalJoin', () => {
        // TODO
    })

    describe('OnChainView', () => {
        // TODO
    });

    describe('Commit', () => {
        it('commit adds an epoch secret', () => {
            // TODO
        })

        it('wrong commits marks rejected if that was first commit', () => {
            // TODO
        })

        it('wrong commit mark corrupted if that was not first commit', () => {
            // TODO
        })
    })

    describe('PendingInfo', () => {
        it('pending info makes pending', () => {
            // TODO
        })
        it('no pending info makes accepted', () => {
            // TODO
        })
        it('no pending info gives epoch secret', () => {
            // TODO
        })
    })
})
