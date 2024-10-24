import {
    useDisplayName,
    useReactions,
    useRedact,
    useScrollback,
    useSendMessage,
    useSendReaction,
    useSyncAgent,
    useUsername,
} from '@river-build/react-sdk'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type MessageReactions, RiverTimelineEvent, type TimelineEvent } from '@river-build/sdk'
import { useCallback, useMemo } from 'react'
import { cn } from '@/utils'
import { getNativeEmojiFromName } from '@/utils/emojis'
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog'

const useMessageReaction = (props: GdmOrChannel, eventId: string) => {
    const { data: reactionMap } = useReactions(props)
    const reactions = reactionMap?.[eventId]
    const { sendReaction } = useSendReaction(props)
    const { redactEvent } = useRedact(props)
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

type GdmOrChannel =
    | {
          type: 'gdm'
          streamId: string
      }
    | {
          type: 'channel'
          spaceId: string
          channelId: string
      }

type TimelineProps =
    | {
          type: 'gdm'
          events: TimelineEvent[]
          showThreadMessages?: boolean
          threadMap?: Record<string, TimelineEvent[]>
          streamId: string
      }
    | {
          type: 'channel'
          events: TimelineEvent[]
          showThreadMessages?: boolean
          threadMap?: Record<string, TimelineEvent[]>
          spaceId: string
          channelId: string
      }

export const Timeline = (props: TimelineProps) => {
    const { scrollback, isPending } = useScrollback(props)
    return (
        <div className="grid grid-rows-[auto,1fr] gap-2">
            <ScrollArea className="h-[calc(100dvh-172px)]">
                <div className="flex flex-col gap-1.5">
                    {!props.showThreadMessages && (
                        <Button disabled={isPending} variant="outline" onClick={scrollback}>
                            {isPending ? 'Loading more...' : 'Scrollback'}
                        </Button>
                    )}
                    {props.events.flatMap((event) =>
                        event.content?.kind === RiverTimelineEvent.RoomMessage &&
                        (props.showThreadMessages || !event.threadParentId)
                            ? [
                                  <Message
                                      key={event.eventId}
                                      {...props}
                                      event={event}
                                      thread={props.threadMap?.[event.eventId]}
                                  />,
                              ]
                            : [],
                    )}
                </div>
            </ScrollArea>
            <SendMessage {...props} />
        </div>
    )
}

const formSchema = z.object({
    message: z.string(),
})

export const SendMessage = (props: GdmOrChannel) => {
    const { sendMessage, isPending } = useSendMessage(props)
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
    ...props
}: { event: TimelineEvent; thread: TimelineEvent[] | undefined } & GdmOrChannel) => {
    const sync = useSyncAgent()
    const member = useMemo(() => {
        if (props.type === 'gdm') {
            return sync.gdms.getGdm(props.streamId).members.get(event.sender.id)
        }
        return sync.spaces.getSpace(props.spaceId).members.get(event.sender.id)
    }, [props, sync.gdms, sync.spaces, event.sender.id])
    const { username } = useUsername(member)
    const { displayName } = useDisplayName(member)
    const prettyDisplayName = displayName || username
    const isMyMessage = event.sender.id === sync.userId
    const { reactions, onReact } = useMessageReaction(props, event.eventId)
    const { redactEvent } = useRedact(props)

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
                    {event.content?.kind === RiverTimelineEvent.RoomMessage
                        ? event.content.body
                        : ''}
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

                {props.thread && props.thread.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost">+{props.thread.length} messages</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2x">
                            <DialogTitle>Thread</DialogTitle>
                            <Timeline {...props} showThreadMessages events={props.thread} />
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
                'flex h-8 w-full items-center justify-center gap-2 rounded-sm border border-neutral-200 bg-neutral-100 px-2',
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
            <span className="text-sm">{getNativeEmojiFromName(reaction)}</span>
            <span className="text-xs">{Object.keys(users).length}</span>
        </button>
    )
}
