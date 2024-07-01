'use client'
import { ChannelContext } from './internals/ChannelContext'

export const ChannelProvider = ({
    channelId,
    children,
}: {
    channelId?: string
    children: React.ReactNode
}) => {
    return <ChannelContext.Provider value={{ channelId }}>{children}</ChannelContext.Provider>
}
