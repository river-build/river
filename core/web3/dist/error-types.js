export class WalletAlreadyLinkedError extends Error {
    constructor(message) {
        super(message ?? 'Wallet is already linked');
        this.name = 'SpaceDappWalletLinkLinkAlreadyExists';
    }
}
export class WalletNotLinkedError extends Error {
    constructor(message) {
        super(message ?? 'Wallet is not linked');
        this.name = 'SpaceDappWalletLinkLinkDoesNotExist';
    }
}
//# sourceMappingURL=error-types.js.map