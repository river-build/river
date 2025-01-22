export interface IValueAwaiter<T> {
    promise: Promise<T>
    resolve: (arg: T) => void
}

export class IndefiniteValueAwaiter<T> implements IValueAwaiter<T> {
    public promise: Promise<T>
    public resolve!: (arg: T) => void

    public constructor() {
        this.promise = new Promise((resolve) => {
            this.resolve = resolve
        })
    }
}

export class TimeoutValueAwaiter<T> implements IValueAwaiter<T> {
    public promise: Promise<T>
    public resolve!: (arg: T) => void

    public constructor(timeoutMS: number, msg: string = 'Awaiter timed out') {
        let timeout: NodeJS.Timeout
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error(msg))
            }, timeoutMS)
        })
        const internalPromise: Promise<T> = new Promise((resolve: (value: T) => void, _reject) => {
            this.resolve = (arg: T) => {
                resolve(arg)
            }
        }).finally(() => {
            clearTimeout(timeout)
        })
        this.promise = Promise.race([internalPromise, timeoutPromise])
    }
}

export function awaiter<T>(timeoutMS?: number, msg?: string): IValueAwaiter<T> {
    return timeoutMS !== undefined
        ? new TimeoutValueAwaiter<T>(timeoutMS, msg)
        : new IndefiniteValueAwaiter<T>()
}
