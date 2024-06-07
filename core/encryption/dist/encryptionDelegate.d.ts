import Olm from '@matrix-org/olm';
import { Account, InboundGroupSession, OutboundGroupSession, PkDecryption, PkEncryption, PkSigning, Session, Utility } from './encryptionTypes';
type OlmLib = typeof Olm;
export declare class EncryptionDelegate {
    private readonly delegate;
    private _initialized;
    get initialized(): boolean;
    constructor(olmLib?: OlmLib);
    init(): Promise<void>;
    createAccount(): Account;
    createSession(): Session;
    createInboundGroupSession(): InboundGroupSession;
    createOutboundGroupSession(): OutboundGroupSession;
    createPkEncryption(): PkEncryption;
    createPkDecryption(): PkDecryption;
    createPkSigning(): PkSigning;
    createUtility(): Utility;
}
export {};
//# sourceMappingURL=encryptionDelegate.d.ts.map