import { useCreateChannel, useCurrentSpaceId, useSpace } from '@river-build/react-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getEthersSigner } from '@/utils/viem-to-ethers'
import { config } from '@/config/wagmi'
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

type ChannelsBlockProps = {
    setCurrentChannelId: (channelId: string) => void
}

const formSchema = z.object({
    channelName: z.string().min(1, { message: 'Space name is required' }),
})

export const ChannelsBlock = (props: ChannelsBlockProps) => {
    const spaceId = useCurrentSpaceId()
    const { data: space } = useSpace(spaceId)

    return (
        <Block title="Channels">
            <CreateChannel setCurrentChannelId={props.setCurrentChannelId} variant="secondary" />
            <div className="divide-y-2 divide-neutral-200">
                {space.channelIds.map((channelId) => (
                    <ChannelInfo
                        key={channelId}
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
    channelId,
    setCurrentChannelId,
}: {
    channelId: string
    setCurrentChannelId: (channelId: string) => void
}) => {
    const { data: space } = useSpace(channelId)
    return (
        <div className="px-4 py-2">
            <button onClick={() => setCurrentChannelId(channelId)}>
                {space.metadata?.name || 'Unnamed Channel'}
            </button>
        </div>
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
                        const signer = await getEthersSigner(config)
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
