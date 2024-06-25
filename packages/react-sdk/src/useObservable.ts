'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type Identifiable, type PersistedModel, PersistedObservable } from '@river-build/sdk'

export type ObservableConfig<T> = {
    fireImmediately?: boolean
    onUpdate?: (data: T) => void
    onError?: (error: Error) => void
    onSaved?: (data: T) => void
}

type PersistedReturn<T> = {
    data: T | undefined
    error: Error | undefined
    status: PersistedModel<T>['status']
    isLoading: boolean
    isError: boolean
    isSaving: boolean
    isSaved: boolean
    isLoaded: boolean
}

export function useObservable<T extends Identifiable>(
    observable: PersistedObservable<T> | undefined,
    config?: ObservableConfig<T>,
): PersistedReturn<T> {
    const [value, setValue] = useState<PersistedModel<T> | undefined>(observable?.value)
    const opts = { fireImmediately: true, ...config } satisfies ObservableConfig<T>

    const onSubscribe = useCallback(
        (value: PersistedModel<T>) => {
            setValue(value)
            if (value.status === 'loaded') {
                opts.onUpdate?.(value.data)
            }
            if (value.status === 'error') {
                opts.onError?.(value.error)
            }
            if (value.status === 'saved') {
                opts.onSaved?.(value.data)
            }
        },
        [opts],
    )

    useEffect(() => {
        if (!observable) {
            return
        }
        const subscription = observable.subscribe(onSubscribe, {
            fireImediately: opts?.fireImmediately,
        })
        return () => subscription.unsubscribe(onSubscribe)
    }, [opts, observable, onSubscribe])

    const data = useMemo(() => {
        if (!value) {
            return {
                data: undefined,
                error: undefined,
                status: 'loading',
                isLoading: true,
                isError: false,
                isSaving: false,
                isLoaded: false,
                isSaved: false,
            }
        }
        const { data, status } = value
        return {
            data,
            error: status === 'error' ? value.error : undefined,
            status,
            isLoading: status === 'loading',
            isError: status === 'error',
            isSaving: status === 'saving',
            isLoaded: status === 'loaded',
            isSaved: status === 'saved',
        }
    }, [value]) satisfies PersistedReturn<T>

    return data
}
