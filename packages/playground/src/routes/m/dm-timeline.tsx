import { useParams } from 'react-router-dom'
import { useDm, useTimeline } from '@river-build/react-sdk'
import { Timeline } from '@/components/blocks/timeline'
import {Encryption} from "@/components/blocks/encryption.tsx";

export const DmTimelineRoute = () => {
    const { dmStreamId } = useParams<{ dmStreamId: string }>()
    const { data: dm } = useDm(dmStreamId!)
    const { data: timeline } = useTimeline(dmStreamId!)
    return (
        <>
            <h2 className="text-2xl font-bold">
                Direct Message Timeline {dm.metadata?.name ? `#${dm.metadata.name}` : ''}
            </h2>
            <Encryption streamId={dmStreamId!} />
            <Timeline events={timeline} streamId={dmStreamId!} />
        </>
    )
}
