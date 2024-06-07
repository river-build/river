import { BigNumber } from 'ethers';
import { BaseContractShim } from './BaseContractShim';
import { ContractVersion } from '../IStaticContractsInfo';
import LocalhostAbi from '@river-build/generated/dev/abis/MembershipFacet.abi.json' assert { type: 'json' };
import BaseSepoliaAbi from '@river-build/generated/v3/abis/MembershipFacet.abi.json' assert { type: 'json' };
import { dlogger } from '@river-build/dlog';
const log = dlogger('csb:IMembershipShim');
export class IMembershipShim extends BaseContractShim {
    constructor(address, version, provider) {
        super(address, version, provider, {
            [ContractVersion.dev]: LocalhostAbi,
            [ContractVersion.v3]: BaseSepoliaAbi,
        });
    }
    async hasMembership(wallet) {
        const balance = (await this.read.balanceOf(wallet)).toNumber();
        return balance > 0;
    }
    async listenForMembershipToken(receiver, abortController) {
        // TODO: this isn't picking up correct typed fucntion signature, treating as string
        const issuedFilter = this.read.filters['MembershipTokenIssued(address,uint256)'](receiver);
        const rejectedFilter = this.read.filters['MembershipTokenRejected(address)'](receiver);
        return new Promise((resolve, _reject) => {
            const cleanup = () => {
                this.read.off(issuedFilter, issuedListener);
                this.read.off(rejectedFilter, rejectedListener);
                abortController?.signal.removeEventListener('abort', onAbort);
            };
            const onAbort = () => {
                cleanup();
                resolve({ issued: false, tokenId: undefined });
            };
            const issuedListener = (recipient, tokenId) => {
                if (receiver === recipient) {
                    log.log('MembershipTokenIssued', { receiver, recipient, tokenId });
                    cleanup();
                    resolve({ issued: true, tokenId: BigNumber.from(tokenId).toString() });
                }
                else {
                    // This techincally should never happen, but we should log it
                    log.log('MembershipTokenIssued mismatch', { receiver, recipient, tokenId });
                }
            };
            const rejectedListener = (recipient) => {
                if (receiver === recipient) {
                    cleanup();
                    resolve({ issued: false, tokenId: undefined });
                }
                else {
                    // This techincally should never happen, but we should log it
                    log.log('MembershipTokenIssued mismatch', { receiver, recipient });
                }
            };
            this.read.on(issuedFilter, issuedListener);
            this.read.on(rejectedFilter, rejectedListener);
            abortController?.signal.addEventListener('abort', onAbort);
        });
    }
}
//# sourceMappingURL=IMembershipShim.js.map