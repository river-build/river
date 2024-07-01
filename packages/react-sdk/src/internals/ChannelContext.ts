'use client'
import { createContext } from 'react'

type ChannelContextProps = {
    channelId: string | undefined
}
export const ChannelContext = createContext<ChannelContextProps | undefined>(undefined)
