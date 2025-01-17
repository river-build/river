import { ExternalCrypto, ExternalGroupService } from '../externalGroup'
import { Crypto, GroupService, IGroupStore } from '../group'
import { CipherSuite as MlsCipherSuite } from '@river-build/mls-rs-wasm'
import { EpochSecretService, IEpochSecretStore } from '../epoch'
import { Coordinator } from '../coordinator'
import { QueueService } from '../queue'

export class MlsInspector {
    constructor(
        public readonly externalCrypto: ExternalCrypto,
        public readonly externalGroupService: ExternalGroupService,
        public readonly crypto: Crypto,
        public readonly groupStore: IGroupStore,
        public readonly groupService: GroupService,
        public readonly cipherSuite: MlsCipherSuite,
        public readonly epochSecretStore: IEpochSecretStore,
        public readonly epochSecretService: EpochSecretService,
        public readonly coordinator: Coordinator,
        public readonly queueService: QueueService,
    ) {}
}
