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
