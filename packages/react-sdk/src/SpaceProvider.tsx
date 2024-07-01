'use client'
import { SpaceContext } from './internals/SpaceContext'

export const SpaceProvider = ({
    spaceId,
    children,
}: {
    spaceId?: string
    children: React.ReactNode
}) => {
    return <SpaceContext.Provider value={{ spaceId }}>{children}</SpaceContext.Provider>
}
