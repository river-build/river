// OLM_OPTIONS is undefined https://gitlab.matrix.org/matrix-org/olm/-/issues/10
// but this comment suggests we define it ourselves? https://gitlab.matrix.org/matrix-org/olm/-/blob/master/javascript/olm_pre.js#L22-24
globalThis.OLM_OPTIONS = {}

/**
 * Utilities common to Olm encryption
 */

// Supported algorithms
export enum EncryptionAlgorithmId {
    Olm = 'r.olm.v1.curve25519-aes-sha2',
}

export enum GroupEncryptionAlgorithmId {
    // group olm encryption based on signal protocol with ratcheting
    GroupEncryption = 'r.group-encryption.v1.aes-sha2',
    // asymmetric encryption (olm) to share symmetric encryption (AES-GSM-256) keys
    HybridGroupEncryption = 'gaes',
}

export function isGroupEncryptionAlgorithmId(value: string): value is GroupEncryptionAlgorithmId {
    return Object.values(GroupEncryptionAlgorithmId).includes(value as GroupEncryptionAlgorithmId)
}

type Unset = { kind: 'unset' }
type Matched = { kind: 'matched'; value: GroupEncryptionAlgorithmId }
type Unrecognized = { kind: 'unrecognized'; value: string }

export function parseGroupEncryptionAlgorithmId(value: string): Matched | Unset | Unrecognized {
    if (value === '') {
        // for backwards compatibility, historically there were places where this was not defined
        return { kind: 'unset' }
    }
    if (isGroupEncryptionAlgorithmId(value)) {
        return { kind: 'matched', value: value as GroupEncryptionAlgorithmId }
    }
    return { kind: 'unrecognized', value }
}

export interface UserDevice {
    deviceKey: string
    fallbackKey: string
}

export interface UserDeviceCollection {
    [userId: string]: UserDevice[]
}

export interface GroupEncryptionSession {
    streamId: string
    sessionId: string
    sessionKey: string
    algorithm: GroupEncryptionAlgorithmId
}
