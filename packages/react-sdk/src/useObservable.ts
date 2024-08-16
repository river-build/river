import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
    type Identifiable,
    type Observable,
    type PersistedModel,
    type PersistedObservable,
} from '@river-build/sdk'
import { isPersistedModel } from './utils'

export type ObservableConfig<T> = {
    fireImmediately?: boolean
    onUpdate?: (data: T) => void
}

export type PersistedObservableConfig<T> = ObservableConfig<T> & {
    onError?: (error: Error) => void
}

type ObservableValue<Data> = {
    data: Data | undefined
    status: 'loaded'
    isLoading: false
    isError: false
    isLoaded: true
}

type PersistedObservableValue<Data> = {
    data: Data extends PersistedModel<infer UnwrappedData> ? UnwrappedData : Data
    error: Error | undefined
    status: 'loading' | 'loaded' | 'error'
    isLoading: boolean
    isError: boolean
    isLoaded: boolean
}

export function useObservable<T>(
    observable: Observable<T> | undefined,
    config?: ObservableConfig<T>,
): ObservableValue<T>
export function useObservable<T>(
    observable: Observable<PersistedModel<T>> | undefined,
    config?: PersistedObservableConfig<T>,
): PersistedObservableValue<T>
export function useObservable<T extends Identifiable>(
    observable: Observable<T | PersistedModel<T>> | PersistedObservable<T> | undefined,
    config?: ObservableConfig<T> | PersistedObservableConfig<T>,
): ObservableValue<T> | PersistedObservableValue<T> {
    const opts = useMemo(() => ({ fireImmediately: true, ...config }), [config])

    const value = useSyncExternalStore(
        (subscriber) =>
            observable
                ? observable.subscribe(subscriber, { fireImediately: opts.fireImmediately })
                : () => undefined,
        () => observable?.value,
    )

    useEffect(() => {
        if (!value) {
            return
        }

        if (isPersistedModel(value)) {
            if (value.status === 'loaded' && 'onUpdate' in opts) {
                opts.onUpdate?.(value.data)
            }
            if (value.status === 'error' && 'onError' in opts) {
                opts.onError?.(value.error)
            }
        } else if ('onUpdate' in opts) {
            opts.onUpdate?.(value)
        }
    }, [opts, value])

    const result = useMemo(() => {
        if (isPersistedModel(value)) {
            const { data, status } = value
            return {
                data: data as T extends PersistedModel<infer Unwrapped> ? Unwrapped : T,
                error: status === 'error' ? value.error : undefined,
                status,
                isLoading: status === 'loading',
                isError: status === 'error',
                isLoaded: status === 'loaded',
            } satisfies PersistedObservableValue<T>
        } else {
            return {
                data: value,
                status: 'loaded' as const,
                isLoading: false,
                isError: false,
                isLoaded: true,
            } satisfies ObservableValue<T>
        }
    }, [value])

    return result
}
