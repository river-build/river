import { Space } from '../generated/schema'
import { ethereum } from '@graphprotocol/graph-ts'

export function loadSpace(event: ethereum.Event): Space | null {
    let spaceId = event.address.toHex()
    let space = Space.load(spaceId)
    if (!space) return null
    return space
}
