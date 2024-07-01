'use client'
import { createContext } from 'react'

type SpaceContextProps = {
    spaceId: string | undefined
}
export const SpaceContext = createContext<SpaceContextProps | undefined>(undefined)
