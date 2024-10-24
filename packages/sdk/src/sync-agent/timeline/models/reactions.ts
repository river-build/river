import { Observable } from '../../../observable/observable'
import { TimelineEvent, RiverTimelineEvent, type MessageReactions } from './timeline-types'

// { parentEventId -> { reactionName: { userId: { eventId: string } } } }
export type ReactionsMap = Record<string, MessageReactions>
export class Reactions extends Observable<ReactionsMap> {
    constructor(initialValue: ReactionsMap = {}) {
        super(initialValue)
    }

    get(parentId: string) {
        return this.value[parentId] ?? {}
    }

    update(fn: (current: ReactionsMap) => ReactionsMap): void {
        this.setValue(fn(this.value))
    }

    reset() {
        this.setValue({})
    }

    removeEvent(event: TimelineEvent) {
        const parentId = event.reactionParentId
        const content =
            event.content?.kind === RiverTimelineEvent.Reaction ? event.content : undefined
        if (!content || !parentId || !this.value[parentId]) {
            return
        }
        const reactionName = content.reaction
        const senderId = event.sender.id

        const mutation = { ...this.value }
        const entry = mutation[reactionName]
        if (entry) {
            delete entry[senderId]
            if (Object.keys(entry).length === 0) {
                delete this.value[reactionName]
            }
        }
        this.setValue(mutation)
    }

    addEvent(event: TimelineEvent) {
        const parentId = event.reactionParentId
        if (!parentId) {
            return
        }
        this.update((reactions) => ({
            ...reactions,
            [parentId]: this.addReaction(event, reactions[parentId]),
        }))
    }

    private addReaction(event: TimelineEvent, entry?: MessageReactions): MessageReactions {
        const content =
            event.content?.kind === RiverTimelineEvent.Reaction ? event.content : undefined
        if (!content) {
            return entry ?? {}
        }
        const reactionName = content.reaction
        const senderId = event.sender.id
        return {
            ...entry,
            [reactionName]: {
                ...entry?.[reactionName],
                [senderId]: { eventId: event.eventId },
            },
        }
    }
}
