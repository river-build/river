/* eslint-disable import/no-unresolved */
// @ts-ignore
// need to include the olmWasm file for the app/browser. BUT this is probably not what we want to do in the long run
// Since we are not bundling the csb SDK, just transpiling TS to JS (like in lib), the SDK is not handling this import at all.
// Actually `?url` is vite specific - which means that the vite bundler in app is handling this import and doing its thing, and our app runs.
// But, if another app were to import this that didn't bundle via Vite, or if Vite changes something, this may break.
import olmWasm from '@matrix-org/olm/olm.wasm?url';
import Olm from '@matrix-org/olm';
import { isNodeEnv } from '@river-build/dlog';
export class EncryptionDelegate {
    delegate;
    _initialized = false;
    get initialized() {
        return this._initialized;
    }
    constructor(olmLib) {
        if (olmLib == undefined) {
            this.delegate = Olm;
        }
        else {
            this.delegate = olmLib;
        }
    }
    async init() {
        // initializes Olm library. This should run before using any Olm classes.
        if (this._initialized) {
            return;
        }
        if (isNodeEnv()) {
            await this.delegate.init();
        }
        else {
            await this.delegate.init({ locateFile: () => olmWasm });
        }
        this._initialized = typeof this.delegate.get_library_version === 'function';
    }
    createAccount() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.Account();
    }
    createSession() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.Session();
    }
    createInboundGroupSession() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.InboundGroupSession();
    }
    createOutboundGroupSession() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.OutboundGroupSession();
    }
    createPkEncryption() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.PkEncryption();
    }
    createPkDecryption() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.PkDecryption();
    }
    createPkSigning() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.PkSigning();
    }
    createUtility() {
        if (!this._initialized) {
            throw new Error('olm not initialized');
        }
        return new this.delegate.Utility();
    }
}
//# sourceMappingURL=encryptionDelegate.js.map