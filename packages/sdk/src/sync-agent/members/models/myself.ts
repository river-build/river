import type { Address } from '@river-build/web3'
import type { RiverConnection } from '../../river-connection/riverConnection'
import { type NftModel } from './metadata/nft'
import { addressFromUserId } from '../../../id'
import { Member } from './member'

export class Myself {
    observables: Member['observables']
    constructor(
        public member: Member,
        protected streamId: string,
        protected riverConnection: RiverConnection,
    ) {
        this.observables = member.observables
    }

    get username() {
        return this.member.username
    }

    get displayName() {
        return this.member.displayName
    }

    get ensAddress() {
        return this.member.ensAddress
    }

    get nft() {
        return this.member.nft
    }

    get membership() {
        return this.member.membership
    }

    async setUsername(username: string) {
        const streamId = this.streamId
        const usernameObservable = this.observables.username
        const oldState = usernameObservable.data
        usernameObservable.setData({
            username,
            isUsernameConfirmed: true,
            isUsernameEncrypted: false,
        })
        return this.riverConnection
            .withStream(streamId)
            .call((client) => client.setUsername(streamId, username))
            .catch((e) => {
                usernameObservable.setData(oldState)
                throw e
            })
    }

    async setDisplayName(displayName: string) {
        const streamId = this.streamId
        const displayNameObservable = this.observables.displayName
        const oldState = displayNameObservable.data
        displayNameObservable.setData({ displayName })
        return this.riverConnection
            .withStream(streamId)
            .call((client) => client.setDisplayName(streamId, displayName))
            .catch((e) => {
                displayNameObservable.setData(oldState)
                throw e
            })
    }

    async setEnsAddress(ensAddress: Address) {
        const streamId = this.streamId
        const ensAddressObservable = this.observables.ensAddress
        const oldState = ensAddressObservable.data
        ensAddressObservable.setData({ ensAddress })
        const bytes = addressFromUserId(ensAddress as string)
        return this.riverConnection
            .withStream(streamId)
            .call((client) => client.setEnsAddress(streamId, bytes))
            .catch((e) => {
                ensAddressObservable.setData(oldState)
                throw e
            })
    }

    async setNft(nft: NftModel) {
        const streamId = this.streamId
        const nftObservable = this.observables.nft
        const oldState = nftObservable.data
        const { contractAddress, tokenId, chainId } = nft
        nftObservable.setData({
            nft: {
                contractAddress,
                tokenId,
                chainId,
            },
        })
        return this.riverConnection
            .withStream(streamId)
            .call((client) =>
                client.setNft(streamId, nft.tokenId, nft.chainId, nft.contractAddress),
            )
            .catch((e) => {
                nftObservable.setData(oldState)
                throw e
            })
    }
}
