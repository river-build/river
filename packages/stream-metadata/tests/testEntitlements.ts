import { EntitlementsDelegate } from '@river-build/encryption'
import { ISpaceDapp, Permission } from '@river-build/web3'

export class TestEntitlements implements EntitlementsDelegate {
	private spaceDapp: ISpaceDapp

	constructor(spaceDapp: ISpaceDapp) {
		this.spaceDapp = spaceDapp
	}

	async isEntitled(
		spaceId: string | undefined,
		channelId: string | undefined,
		user: string,
		permission: Permission,
	) {
		if (channelId && spaceId) {
			return this.spaceDapp.isEntitledToChannel(spaceId, channelId, user, permission)
		} else if (spaceId) {
			return this.spaceDapp.isEntitledToSpace(spaceId, user, permission)
		} else {
			return true
		}
	}
}
