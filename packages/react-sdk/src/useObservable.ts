'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type Observable, type PersistedModel } from '@river-build/sdk'
import { isPersistedModel } from './utils'

type BaseObservableConfig<T> = {
    fireImmediately?: boolean
    onUpdate?: (updatedValue: T) => void
}

type ObservableValue<T> = T | PersistedModel<T>

export const useObservable = <T>(
    observable: Observable<T> | undefined,
    config?: BaseObservableConfig<T>,
) => {
    const [value, setValue] = useState<ObservableValue<T> | undefined>(observable?.value)
    const opts = { fireImmediately: true, ...config } satisfies BaseObservableConfig<T>

    const onSubscribe = useCallback(
        (value: ObservableValue<T>) => {
            setValue(value)
            if (opts?.onUpdate) {
                if (isPersistedModel(value)) {
                    opts.onUpdate(value.data)
                } else {
                    opts.onUpdate(value)
                }
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
                status: undefined,
                isLoading: true,
                isError: false,
                isSaving: false,
                isLoaded: false,
            }
        }
        if (isPersistedModel(value)) {
            const { data, status } = value
            return {
                data,
                status,
                isLoading: status === 'loading',
                isError: status === 'error',
                isSaving: status === 'saving',
                isLoaded: status === 'loaded',
            }
        }
        return {
            data: value,
            status: undefined,
            isLoading: false,
            isError: false,
            isSaving: false,
            isLoaded: true,
        }
    }, [value])

    return data
}
