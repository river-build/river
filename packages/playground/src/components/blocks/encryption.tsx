import { useEncryptionAlgorithm } from '@/hooks/encryption-algorithm.tsx'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type EncryptionProps = {
    streamId: string
}
const MLS_ALGORITHM = 'mls_0.0.1'

export const Encryption = ({ streamId }: EncryptionProps) => {
    const { encryption, setEncryptionAlgorithm } = useEncryptionAlgorithm(streamId)
    return (
        <div>
            <Label>{encryption === MLS_ALGORITHM ? 'MLS ENABLED' : 'MLS DISABLED'}</Label>
            <Button onClick={() => setEncryptionAlgorithm(MLS_ALGORITHM)}>ENABLE MLS</Button>
        </div>
    )
}
