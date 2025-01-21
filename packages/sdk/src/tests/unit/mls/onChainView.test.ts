import { describe } from 'vitest'

describe.skip('onChainViewTests', () => {
    describe('Snapshot', () => {
        it('can be loaded from snapshot', () => {})
    })

    describe('InitializeGroup', () => {
        it('accepts initialize group', () => {})

        it('rejects second initialize group', () => {})
    })

    describe('ExternalJoin', () => {
        it('accepts external join', () => {})

        it('rejects second external join for the same epoch', () => {})

        it('commits are in order', () => {})
    })
})
