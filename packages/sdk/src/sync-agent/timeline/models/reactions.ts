import { Observable } from '../../../observable/observable'
import { TimelineEvent, Event, type MessageReactions } from './timeline-types'

// { parentEventId -> { reactionName: { userId: { eventId: string } } } }
type ReactionsMap = Record<string, MessageReactions>
export class Reactions extends Observable<ReactionsMap> {
    constructor(initialValue: ReactionsMap = {}) {
        super(initialValue)
    }

    update(fn: (current: ReactionsMap) => ReactionsMap): void {
        this.setValue(fn(this.value))
    }

    reset() {
        this.setValue({})
    }

    removeEvent(event: TimelineEvent) {
        const parentId = event.reactionParentId
        const content = event.content?.kind === Event.Reaction ? event.content : undefined
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
        const content = event.content?.kind === Event.Reaction ? event.content : undefined
        if (!content || !parentId) {
            return
        }
        const reactionName = content.reaction
        const senderId = event.sender.id
        this.update((current) => ({
            ...current,
            [parentId]: {
                ...current[reactionName],
                [reactionName]: {
                    [senderId]: {
                        eventId: event.eventId,
                    },
                },
            },
        }))
    }
}
