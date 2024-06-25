'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type Identifiable, type PersistedModel, PersistedObservable } from '@river-build/sdk'

type BaseObservableConfig<T> = {
    fireImmediately?: boolean
    onUpdate?: (updatedValue: T) => void
}

type PersistedReturn<T> = {
    data: T | undefined
    status: PersistedModel<T>['status']
    isLoading: boolean
    isError: boolean
    isSaving: boolean
    isLoaded: boolean
}

export function useObservable<T extends Identifiable>(
    observable: PersistedObservable<T> | undefined,
    config?: BaseObservableConfig<T>,
): PersistedReturn<T> {
    const [value, setValue] = useState<PersistedModel<T> | undefined>(observable?.value)
    const opts = { fireImmediately: true, ...config } satisfies BaseObservableConfig<T>

    const onSubscribe = useCallback(
        (value: PersistedModel<T>) => {
            setValue(value)
            if (opts?.onUpdate) {
                opts.onUpdate(value.data)
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
                status: 'loading',
                isLoading: true,
                isError: false,
                isSaving: false,
                isLoaded: false,
            }
        }
        const { data, status } = value
        return {
            data,
            status,
            isLoading: status === 'loading',
            isError: status === 'error',
            isSaving: status === 'saving',
            isLoaded: status === 'loaded',
        }
    }, [value]) satisfies PersistedReturn<T>

    return data
}
