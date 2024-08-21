import { EntitlementsDelegate } from '@river-build/encryption'
import { ISpaceDapp, Permission } from '@river-build/web3'

export class TestEntitlements implements EntitlementsDelegate {
	private spaceDapp: ISpaceDapp
	private xchainRpcUrls: string[]

	constructor(spaceDapp: ISpaceDapp, xchainRpcUrls: string[]) {
		this.spaceDapp = spaceDapp
		this.xchainRpcUrls = xchainRpcUrls
	}

	async isEntitled(
		spaceId: string | undefined,
		channelId: string | undefined,
		user: string,
		permission: Permission,
	) {
		if (channelId && spaceId) {
			return this.spaceDapp.isEntitledToChannel(
				spaceId,
				channelId,
				user,
				permission,
				this.xchainRpcUrls,
			)
		} else if (spaceId) {
			return this.spaceDapp.isEntitledToSpace(spaceId, user, permission)
		} else {
			return true
		}
	}
}
