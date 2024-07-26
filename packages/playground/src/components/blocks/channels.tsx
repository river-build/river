import { useChannel, useCreateChannel, useSpace } from '@river-build/react-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCurrentSpaceId } from '@/hooks/current-space'
import { useEthersSigner } from '@/utils/viem-to-ethers'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form'
import { Block, type BlockProps } from '../ui/block'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { JsonHover } from '../utils/json-hover'

type ChannelsBlockProps = {
    setCurrentChannelId: (channelId: string) => void
}

const formSchema = z.object({
    channelName: z.string().min(1, { message: 'Space name is required' }),
})

export const ChannelsBlock = (props: ChannelsBlockProps) => {
    const spaceId = useCurrentSpaceId()
    const { data: space } = useSpace(spaceId)
    console.log('ChannelsBlock', spaceId, space.id, space.channelIds)
    return (
        <Block title={`Channels in ${space.metadata?.name || 'Unnamed Space'}`}>
            <CreateChannel setCurrentChannelId={props.setCurrentChannelId} variant="secondary" />
            <div className="flex flex-col gap-1">
                <span className="text-xs">Select a channel to start messaging</span>
                {space.channelIds.map((channelId) => (
                    <ChannelInfo
                        key={`${spaceId}-${channelId}`}
                        spaceId={spaceId}
                        channelId={channelId}
                        setCurrentChannelId={props.setCurrentChannelId}
                    />
                ))}
            </div>
            {space.channelIds.length === 0 && (
                <p className="pt-4 text-center text-sm text-secondary-foreground">
                    You're not in any Channels yet.
                </p>
            )}
        </Block>
    )
}

const ChannelInfo = ({
    spaceId,
    channelId,
    setCurrentChannelId,
}: {
    spaceId: string
    channelId: string
    setCurrentChannelId: (channelId: string) => void
}) => {
    console.log('ChannelInfo', spaceId, channelId)
    const { data: channel } = useChannel(spaceId, channelId)
    return (
        <JsonHover data={channel}>
            <div>
                <Button variant="outline" onClick={() => setCurrentChannelId(channelId)}>
                    {channel.metadata?.name || 'Unnamed Channel'}
                </Button>
            </div>
        </JsonHover>
    )
}

export const CreateChannel = (
    props: {
        setCurrentChannelId: (channelId: string) => void
    } & BlockProps,
) => {
    const { setCurrentChannelId, ...rest } = props
    const spaceId = useCurrentSpaceId()
    const { createChannel, isPending } = useCreateChannel(spaceId)
    const signer = useEthersSigner()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { channelName: '' },
    })

    // TODO: this should be a dialog
    return (
        <Block {...rest}>
            <Form {...form}>
                <form
                    className="space-y-8"
                    onSubmit={form.handleSubmit(async ({ channelName }) => {
                        if (!signer) {
                            return
                        }
                        const channelId = await createChannel(channelName, signer)
                        setCurrentChannelId(channelId)
                    })}
                >
                    <FormField
                        control={form.control}
                        name="channelName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New channel name</FormLabel>
                                <FormControl>
                                    {/* TODO: input mask so it start with # but gets stripped */}
                                    <Input placeholder="#cool-photos" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This will be the name of your channel.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit"> {isPending ? 'Creating...' : 'Create'}</Button>
                </form>
            </Form>
        </Block>
    )
}
