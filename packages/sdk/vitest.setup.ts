import { vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('@matrix-org/olm/olm.wasm?url', () => ({
    default: 'file-mock',
}))
