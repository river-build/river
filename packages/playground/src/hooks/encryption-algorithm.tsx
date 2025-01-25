'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSyncAgent } from '@river-build/react-sdk'

export const useEncryptionAlgorithm = (streamId?: string) => {
    const { riverConnection } = useSyncAgent()
    const [encryption, setEncryption] = useState<string | undefined>(undefined)

    const setEncryptionAlgorithm = useCallback(
        (algorithm?: string) => {
            if (!streamId) {
                return
            }
            void riverConnection.callWithStream(streamId, async (client, stream) => {
                try {
                    await client.setStreamEncryptionAlgorithm(streamId, algorithm)
                } catch (error) {
                    console.error(error)
                }
            })
        },
        [streamId, riverConnection],
    )

    useEffect(() => {
        let isMounted = true

        const onStreamUpdated = (updatedStreamId: string) => {
            if (updatedStreamId !== streamId) {
                return
            }

            void riverConnection.callWithStream(streamId, async (_, stream) => {
                const encryptionAlgorithm = stream._view.membershipContent.encryptionAlgorithm
                setEncryption(encryptionAlgorithm)
            })
        }

        if (streamId) {
            onStreamUpdated(streamId)
        }
        void riverConnection.call(async (client) => {
            if (!isMounted) {
                return
            }
            client.on('streamUpdated', onStreamUpdated)
        })

        return () => {
            isMounted = false
            void riverConnection.call(async (client) => {
                client.off('streamUpdated', onStreamUpdated)
            })
        }
    })

    return { encryption, setEncryptionAlgorithm }
}
