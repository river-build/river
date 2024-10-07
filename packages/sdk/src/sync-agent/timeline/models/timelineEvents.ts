import { Observable } from '../../../observable/observable'
import type { TimelineEvent } from './timeline-types'

export class TimelineEvents extends Observable<TimelineEvent[]> {
    constructor(initialValue: TimelineEvent[] = []) {
        super(initialValue)
    }

    update(fn: (current: TimelineEvent[]) => TimelineEvent[]): void {
        this.setValue(fn(this.value))
    }
}
