import { Outlet, useNavigate } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import {
    useDm,
    useGdm,
    useMember,
    useSpace,
    useSyncAgent,
    useUserDms,
    useUserGdms,
    useUserSpaces,
} from '@river-build/react-sdk'
import { GridSidePanel } from '@/components/layout/grid-side-panel'
import { Button } from '@/components/ui/button'
import { CreateSpace } from '@/components/form/space/create'
import { JoinSpace } from '@/components/form/space/join'
import { ScrollArea } from '@/components/ui/scroll-area'

export const DashboardRoute = () => {
    const navigate = useNavigate()
    const { spaceIds } = useUserSpaces()
    const { streamIds: gdmStreamIds } = useUserGdms()
    const { streamIds: dmStreamIds } = useUserDms()

    const navigateToSpace = useCallback(
        (spaceId: string) => {
            navigate(`/t/${spaceId}`)
        },
        [navigate],
    )

    const navigateToGdm = useCallback(
        (gdmStreamId: string) => {
            navigate(`/m/gdm/${gdmStreamId}`)
        },
        [navigate],
    )

    const navigateToDm = useCallback(
        (dmStreamId: string) => {
            navigate(`/m/dm/${dmStreamId}`)
        },
        [navigate],
    )

    return (
        <GridSidePanel
            side={
                <>
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium">Create Space</h2>
                        <CreateSpace onCreateSpace={navigateToSpace} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium">Join Space</h2>
                        <JoinSpace onJoinSpace={navigateToSpace} />
                    </div>
                    <span className="text-xs">Select a space to start messaging</span>

                    <ScrollArea className="flex h-[calc(100dvh-18rem-2/4)]">
                        <div className="flex flex-col gap-1">
                            {spaceIds.map((spaceId) => (
                                <SpaceInfo
                                    key={spaceId}
                                    spaceId={spaceId}
                                    onSpaceChange={navigateToSpace}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                    {spaceIds.length === 0 && (
                        <p className="pt-4 text-center text-sm text-secondary-foreground">
                            You're not in any spaces yet.
                        </p>
                    )}

                    <hr className="my-2" />

                    <span className="text-xs">Your group chats</span>
                    <ScrollArea className="flex h-[calc(100dvh-18rem-1/4%)]">
                        <div className="flex flex-col gap-1">
                            {gdmStreamIds.map((gdmStreamId) => (
                                <GdmInfo
                                    key={gdmStreamId}
                                    gdmStreamId={gdmStreamId}
                                    onGdmChange={navigateToGdm}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                    {gdmStreamIds.length === 0 && (
                        <p className="pt-4 text-center text-sm text-secondary-foreground">
                            You're not in any group chats yet.
                        </p>
                    )}

                    <hr className="my-2" />

                    <span className="text-xs">Your direct messages</span>
                    <ScrollArea className="flex h-[calc(100dvh-18rem-1/4%)]">
                        <div className="flex flex-col gap-1">
                            {dmStreamIds.map((dmStreamId) => (
                                <DmInfo
                                    key={dmStreamId}
                                    dmStreamId={dmStreamId}
                                    onDmChange={navigateToDm}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                    {dmStreamIds.length === 0 && (
                        <p className="pt-4 text-center text-sm text-secondary-foreground">
                            You don't have any direct messages yet.
                        </p>
                    )}
                </>
            }
            main={<Outlet />}
        />
    )
}

const SpaceInfo = ({
    spaceId,
    onSpaceChange,
}: {
    spaceId: string
    onSpaceChange: (spaceId: string) => void
}) => {
    const { data: space } = useSpace(spaceId)
    return (
        <div>
            <Button variant="outline" onClick={() => onSpaceChange(space.id)}>
                {space.metadata?.name || 'Unnamed Space'}
            </Button>
        </div>
    )
}

const GdmInfo = ({
    gdmStreamId,
    onGdmChange,
}: {
    gdmStreamId: string
    onGdmChange: (gdmStreamId: string) => void
}) => {
    const { data: gdm } = useGdm(gdmStreamId)
    return (
        <div>
            <Button variant="outline" onClick={() => onGdmChange(gdm.id)}>
                {gdm.metadata?.name || 'Unnamed Gdm'}
            </Button>
        </div>
    )
}

const DmInfo = ({
    dmStreamId,
    onDmChange,
}: {
    dmStreamId: string
    onDmChange: (dmStreamId: string) => void
}) => {
    const sync = useSyncAgent()
    const { data: dm } = useDm(dmStreamId)

    // geez
    const member = useMemo(() => {
        const dm = sync.dms.getDmByStreamId(dmStreamId)
        const userIds = dm.members.data.userIds
        const myself = dm.members.myself
        const other = dm.members.get(
            userIds.find((userId) => userId !== myself.userId) ?? myself.userId,
        )
        return other ? other : myself
    }, [dmStreamId, sync.dms])

    const { username } = useMember(member)
    return (
        <div>
            <Button variant="outline" onClick={() => onDmChange(dm.id)}>
                {username || 'Unnamed DM'}
            </Button>
        </div>
    )
}
