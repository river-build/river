import {
    useDisplayName,
    useReactions,
    useSendMessage,
    useSendReaction,
    useSyncAgent,
    useTimeline,
    useUsername,
} from '@river-build/react-sdk'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type MessageReactions, RiverEvent, type TimelineEvent } from '@river-build/sdk'
import { useMemo } from 'react'
import { useCurrentSpaceId } from '@/hooks/current-space'
import { useCurrentChannelId } from '@/hooks/current-channel'
import { cn } from '@/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'

export const Timeline = () => {
    const spaceId = useCurrentSpaceId()
    const channelId = useCurrentChannelId()
    const { data: timeline } = useTimeline(spaceId, channelId)
    const { data: reactions } = useReactions(spaceId, channelId)
    const { sendReaction } = useSendReaction(spaceId, channelId)

    return (
        <div className="grid grid-rows-[auto,1fr] gap-2">
            <ScrollArea className="h-[calc(100dvh-172px)]">
                <div className="flex flex-col gap-1.5">
                    {timeline.flatMap((event) =>
                        event.content?.kind === RiverEvent.RoomMessage
                            ? [
                                  <Message
                                      key={event.eventId}
                                      event={event}
                                      reactions={reactions?.[event.eventId]}
                                      sendReaction={sendReaction}
                                  />,
                              ]
                            : [],
                    )}
                </div>
            </ScrollArea>
            <SendMessage />
        </div>
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

const Message = ({
    event,
    reactions,
    sendReaction,
}: {
    event: TimelineEvent
    reactions: MessageReactions | undefined
    sendReaction: (refEventId: string, reaction: string) => Promise<{ eventId: string }>
}) => {
    const sync = useSyncAgent()
    const spaceId = useCurrentSpaceId()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.get(event.sender.id),
        [sync, spaceId, event.sender.id],
    )
    const { username } = useUsername(member)
    const { displayName } = useDisplayName(member)
    const prettyDisplayName = displayName || username

    return (
        <div className="flex flex-wrap items-center gap-1">
            <span
                className={cn(
                    'font-semibold',
                    event.sender.id === sync.userId ? 'text-sky-500' : 'text-purple-500',
                )}
            >
                {prettyDisplayName || event.sender.id}:
            </span>
            <span>{event.content?.kind === RiverEvent.RoomMessage ? event.content.body : ''}</span>
            {reactions && <ReactionRow reactions={reactions} />}
        </div>
    )
}

const ReactionRow = ({ reactions }: { reactions: MessageReactions }) => {
    const entries = Object.entries<Record<string, { eventId: string }>>(reactions)
    const map = entries.length
        ? entries.map(([reaction, users]) => (
              <button
                  type="button"
                  className="flex h-8 w-10 items-center justify-center gap-2 rounded-sm border border-neutral-200 bg-neutral-100"
              >
                  <span className="text-sm">{reaction}</span>
                  <span className="text-xs">{Object.keys(users).length}</span>
              </button>
          ))
        : undefined
    return <>{map}</>
}
