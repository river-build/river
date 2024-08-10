import type { Store } from '../../../store/store'
import type { RiverConnection } from '../../river-connection/riverConnection'
import { MemberDisplayName } from './metadata/displayName'
import { MemberEnsAddress } from './metadata/ensAddress'
import { MemberNft, type NftModel } from './metadata/nft'
import { MemberUsername } from './metadata/username'
import type { Address } from '@river-build/web3'

export class Member {
    observables: {
        username: MemberUsername
        displayName: MemberDisplayName
        ensAddress: MemberEnsAddress
        nft: MemberNft
    }
    constructor(
        userId: string,
        streamId: string,
        private riverConnection: RiverConnection,
        store: Store,
    ) {
        this.observables = {
            username: new MemberUsername(userId, streamId, this.riverConnection, store),
            displayName: new MemberDisplayName(userId, streamId, this.riverConnection, store),
            ensAddress: new MemberEnsAddress(userId, streamId, this.riverConnection, store),
            nft: new MemberNft(userId, streamId, this.riverConnection, store),
        }
    }

    get username() {
        return this.observables.username.data.username
    }

    setUsername(username: string) {
        return this.observables.username.setUsername(username)
    }

    get displayName() {
        return this.observables.displayName.data.displayName
    }

    setDisplayName(displayName: string) {
        return this.observables.displayName.setDisplayName(displayName)
    }

    get ensAddress() {
        return this.observables.ensAddress.data.ensAddress
    }

    setEnsAddress(ensAddress: Address) {
        return this.observables.ensAddress.setEnsAddress(ensAddress)
    }

    get nft() {
        return this.observables.nft.data.nft
    }

    setNft(nft: NftModel) {
        return this.observables.nft.setNft(nft)
    }
}
