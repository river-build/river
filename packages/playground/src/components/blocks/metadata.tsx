import {
    useDisplayName,
    useEnsAddress,
    useNft,
    useSetDisplayName,
    useSetEnsAddress,
    useSetNft,
    useSetUsername,
    useSyncAgent,
    useUsername,
} from '@river-build/react-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Address } from 'viem'
import { useCurrentSpaceId } from '@/hooks/current-space'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Block, type BlockProps } from '../ui/block'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const memberMetadataFormSchema = z.object({
    username: z.string().optional(),
    displayName: z.string().optional(),
    ensAddress: z.string().optional(),
    nft: z
        .object({
            contractAddress: z.string(),
            tokenId: z.string(),
            chainId: z.string().transform((value) => parseInt(value)),
        })
        .optional(),
})

export const MetadataBlock = (props: BlockProps) => {
    const spaceId = useCurrentSpaceId()
    const sync = useSyncAgent()
    const { setUsername, isPending: isPendingUsername } = useSetUsername(spaceId)
    const { setDisplayName, isPending: isPendingDisplayName } = useSetDisplayName(spaceId)
    const { setEnsAddress, isPending: isPendingEnsAddress } = useSetEnsAddress(spaceId)
    const { setNft, isPending: isPendingNft } = useSetNft(spaceId)

    const isPending =
        isPendingDisplayName || isPendingUsername || isPendingEnsAddress || isPendingNft

    const { username } = useUsername(spaceId, sync.userId)
    const { displayName } = useDisplayName(spaceId, sync.userId)
    const { ensAddress } = useEnsAddress(spaceId, sync.userId)
    const { nft } = useNft(spaceId, sync.userId)

    const form = useForm<z.infer<typeof memberMetadataFormSchema>>({
        resolver: zodResolver(memberMetadataFormSchema),
        defaultValues: {
            username: username ?? '',
            displayName: displayName ?? '',
            ensAddress: ensAddress ?? '',
            nft: nft ?? undefined,
        },
    })

    return (
        <Block {...props}>
            <Form {...form}>
                <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit(
                        async ({ username, displayName, ensAddress, nft }) => {
                            const promises = []
                            if (username) {
                                promises.push(setUsername(username))
                            }
                            if (displayName) {
                                promises.push(setDisplayName(displayName))
                            }
                            if (ensAddress) {
                                promises.push(setEnsAddress(ensAddress as Address))
                            }
                            if (nft) {
                                promises.push(setNft(nft))
                            }
                            await Promise.all(promises)
                        },
                    )}
                >
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="the_bob" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Bob" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ensAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ENS Address</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0x7c68798466a7c9E048Fcb6eb1Ac3A876Ba98d8Ee"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nft.contractAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>NFT Contract Address</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0x5af0d9827e0c53e4799bb226655a1de152a425a5"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nft.tokenId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>NFT Token ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="1043" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nft.chainId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>NFT Chain ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit"> {isPending ? 'Updating...' : 'Update'}</Button>
                </form>
            </Form>
        </Block>
    )
}
