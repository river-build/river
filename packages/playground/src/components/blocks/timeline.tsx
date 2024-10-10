import {
    useDisplayName,
    useReactions,
    useRedact,
    useSendMessage,
    useSendReaction,
    useSyncAgent,
    useUsername,
} from '@river-build/react-sdk'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type MessageReactions, RiverEvent, type TimelineEvent } from '@river-build/sdk'
import { useCallback, useMemo } from 'react'
import { cn } from '@/utils'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'

const useMessageReaction = (spaceId: string, channelId: string, eventId: string) => {
    const { data: reactionMap } = useReactions(spaceId, channelId)
    const reactions = reactionMap?.[eventId]
    const { sendReaction } = useSendReaction(spaceId, channelId)
    const { redactEvent } = useRedact(spaceId, channelId)
    const onReact = useCallback(
        (
            params:
                | {
                      type: 'add'
                      reaction: string
                  }
                | {
                      type: 'remove'
                      refEventId: string
                  },
        ) => {
            if (params.type === 'add') {
                sendReaction(eventId, params.reaction)
            } else {
                redactEvent(params.refEventId)
            }
        },
        [sendReaction, redactEvent, eventId],
    )

    return {
        reactions,
        onReact,
    }
}

export const Timeline = ({
    spaceId,
    channelId,
    events,
    threadMap,
    showThreadMessages = false,
}: {
    spaceId: string
    channelId: string
    events: TimelineEvent[]
    showThreadMessages?: boolean
    threadMap?: Record<string, TimelineEvent[]>
}) => {
    return (
        <div className="grid grid-rows-[auto,1fr] gap-2">
            <ScrollArea className="h-[calc(100dvh-172px)]">
                <div className="flex flex-col gap-1.5">
                    {events.flatMap((event) =>
                        event.content?.kind === RiverEvent.RoomMessage &&
                        (showThreadMessages || !event.threadParentId)
                            ? [
                                  <Message
                                      key={event.eventId}
                                      event={event}
                                      spaceId={spaceId}
                                      channelId={channelId}
                                      thread={threadMap?.[event.eventId]}
                                  />,
                              ]
                            : [],
                    )}
                </div>
            </ScrollArea>
            <SendMessage spaceId={spaceId} channelId={channelId} />
        </div>
    )
}

const formSchema = z.object({
    message: z.string(),
})

export const SendMessage = ({ spaceId, channelId }: { spaceId: string; channelId: string }) => {
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
    spaceId,
    channelId,
    thread,
}: {
    event: TimelineEvent
    spaceId: string
    channelId: string
    thread: TimelineEvent[]
}) => {
    const sync = useSyncAgent()
    const member = useMemo(
        () => sync.spaces.getSpace(spaceId).members.get(event.sender.id),
        [sync, spaceId, event.sender.id],
    )
    const { username } = useUsername(member)
    const { displayName } = useDisplayName(member)
    const prettyDisplayName = displayName || username
    const isMyMessage = event.sender.id === sync.userId
    const { reactions, onReact } = useMessageReaction(spaceId, channelId, event.eventId)
    const { redactEvent } = useRedact(spaceId, channelId)

    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
                <span
                    className={cn(
                        'font-semibold',
                        isMyMessage ? 'text-sky-500' : 'text-purple-500',
                    )}
                >
                    {prettyDisplayName || event.sender.id}:
                </span>
                <span>
                    {event.content?.kind === RiverEvent.RoomMessage ? event.content.body : ''}
                </span>
            </div>
            <div className="flex items-center gap-1">
                {reactions && <ReactionRow reactions={reactions} onReact={onReact} />}
                <Button
                    variant="outline"
                    className="aspect-square p-1"
                    onClick={() => onReact({ type: 'add', reaction: '👍' })}
                >
                    👍
                </Button>
                {isMyMessage && (
                    <Button variant="ghost" onClick={() => redactEvent(event.eventId)}>
                        ❌
                    </Button>
                )}

                {thread?.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost">+{thread.length} messages</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2x">
                            <Timeline
                                showThreadMessages
                                events={thread}
                                spaceId={spaceId}
                                channelId={channelId}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    )
}

type OnReactParams =
    | {
          type: 'add'
          reaction: string
      }
    | {
          type: 'remove'
          refEventId: string
      }
const ReactionRow = ({
    reactions,
    onReact,
}: {
    reactions: MessageReactions
    onReact: (params: OnReactParams) => void
}) => {
    const entries = Object.entries<Record<string, { eventId: string }>>(reactions)
    return (
        <div className="flex gap-1">
            {entries.length
                ? entries.map(([reaction, users]) => (
                      <Reaction
                          key={reaction}
                          reaction={reaction}
                          users={users}
                          onReact={onReact}
                      />
                  ))
                : undefined}
        </div>
    )
}

const Reaction = ({
    reaction,
    users,
    onReact,
}: {
    reaction: string
    users: Record<string, { eventId: string }>
    onReact: (params: OnReactParams) => void
}) => {
    const sync = useSyncAgent()

    const isMyReaction = Object.keys(users).some((userId) => userId === sync.userId)
    return (
        <button
            type="button"
            className={cn(
                'w-ful flex h-8 items-center justify-center gap-2 rounded-sm border border-neutral-200 bg-neutral-100',
                isMyReaction && 'border-lime-200 bg-lime-100',
            )}
            onClick={() => {
                if (isMyReaction) {
                    onReact({ type: 'remove', refEventId: users[sync.userId].eventId })
                } else {
                    onReact({ type: 'add', reaction })
                }
            }}
        >
            <span className="text-sm">{reaction}</span>
            <span className="text-xs">{Object.keys(users).length}</span>
        </button>
    )
}
