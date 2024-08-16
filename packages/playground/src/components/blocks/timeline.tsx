import {
    useChannel,
    useDisplayName,
    useEnsAddress,
    useNft,
    useSendMessage,
    useSyncAgent,
    useTimeline,
    useUsername,
} from '@river-build/react-sdk'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Member, TimelineEvent } from '@river-build/sdk'
import { useMemo } from 'react'
import { useCurrentSpaceId } from '@/hooks/current-space'
import { useCurrentChannelId } from '@/hooks/current-channel'
import { cn } from '@/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Button } from '../ui/button'
import { Block } from '../ui/block'
import { JsonHover } from '../utils/json-hover'
import { Input } from '../ui/input'

export const TimelineBlock = () => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()
    const { data: channel } = useChannel(spaceId, channelId)
    const { data: timeline } = useTimeline(spaceId, channelId)
    return (
        <Block title={`#${channel.metadata?.name} timeline`} className="w-full">
            <SendMessage />
            <div className="flex flex-col gap-1">
                {timeline.map((event) => (
                    <JsonHover key={event.eventId} data={event}>
                        <Message event={event} />
                    </JsonHover>
                ))}
            </div>
        </Block>
    )
}

const formSchema = z.object({
    message: z.string(),
})

export const SendMessage = () => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()
    const { sendMessage, isPending } = useSendMessage(spaceId, channelId)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { message: '' },
    })

    return (
        <Form {...form}>
            <form
                className="grid grid-cols-[1fr,auto] gap-2"
                onSubmit={form.handleSubmit(async ({ message }) => {
                    sendMessage(message)
                })}
            >
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder="Type a message" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit"> {isPending ? 'Sending...' : 'Send'}</Button>
            </form>
        </Form>
    )
}

const Message = ({ event }: { event: TimelineEvent }) => {
    const sync = useSyncAgent()
    const spaceId = useCurrentSpaceId()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.getMember(event.creatorUserId),
        [sync, spaceId, event.creatorUserId],
    )

    return (
        <div className="flex gap-1">
            {member && <MemberInfo member={member} />}
            <span>{event.text}</span>
        </div>
    )
}

const MemberInfo = ({ member }: { member: Member }) => {
    const sync = useSyncAgent()
    const { username, id: userId } = useUsername(member)
    const { displayName } = useDisplayName(member)
    const { ensAddress } = useEnsAddress(member)
    const { nft } = useNft(member)
    const prettyDisplayName = displayName || username

    return (
        <JsonHover data={{ ensAddress, displayName, username, nft }}>
            <span
                className={cn(
                    'font-semibold',
                    userId === sync.userId ? 'text-sky-500' : 'text-purple-500',
                )}
            >
                {prettyDisplayName}:
            </span>
        </JsonHover>
    )
}
