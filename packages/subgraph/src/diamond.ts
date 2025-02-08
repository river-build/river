import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
    DiamondCut as DiamondCutEvent,
    InterfaceAdded as InterfaceAddedEvent,
} from '../generated/DiamondCut/DiamondCutFacet'
import { DiamondCut, FacetCut, Interface } from '../generated/schema'

export function handleDiamondCut(event: DiamondCutEvent): void {
    let id = event.transaction.hash.toHex()
    let diamondCut = new DiamondCut(id)

    diamondCut.init = event.params.init
    diamondCut.initPayload = event.params.initPayload
    diamondCut.timestamp = event.block.timestamp

    diamondCut.save()

    let facetCuts = event.params.facetCuts
    for (let i = 0; i < facetCuts.length; i++) {
        let facetCutId = id + '-' + i.toString()
        let facetCut = new FacetCut(facetCutId)

        facetCut.diamondCut = diamondCut.id
        facetCut.facetAddress = facetCuts[i].facetAddress
        facetCut.action = facetCuts[i].action
        facetCut.functionSelectors = facetCuts[i].functionSelectors

        facetCut.save()
    }
}

export function handleInterfaceAdded(event: InterfaceAddedEvent): void {
    let id = event.transaction.hash.toHex()
    let interfaceAdded = new Interface(id)

    interfaceAdded.id = id
    interfaceAdded.interfaceId = event.params.interfaceId
    interfaceAdded.timestamp = event.block.timestamp

    interfaceAdded.save()
}
