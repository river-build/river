import { ethers } from 'ethers';
import { dlogger } from '@river-build/dlog';
import { ContractVersion } from '../IStaticContractsInfo';
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
const logger = dlogger('csb:BaseContractShim');
// V2 smart contract shim
// todo: replace BaseContractShim with this when refactoring is done
export class BaseContractShim {
    address;
    version;
    contractInterface;
    provider;
    signer;
    abi;
    readContract;
    writeContract;
    constructor(address, version, provider, abis) {
        if (!abis[version]) {
            throw new Error(`No ABI for version ${version}`);
        }
        this.address = address;
        this.version = version;
        this.provider = provider;
        this.abi = abis[version];
        this.contractInterface = new ethers.utils.Interface(this.abi);
    }
    get interface() {
        switch (this.version) {
            case ContractVersion.dev:
                return this.contractInterface;
            case ContractVersion.v3:
                return this.contractInterface;
            default:
                throw new Error(`Unsupported version ${this.version}`);
        }
    }
    get read() {
        // lazy create an instance if it is not already cached
        if (!this.readContract) {
            this.readContract = this.createReadContractInstance();
        }
        switch (this.version) {
            case ContractVersion.dev:
                return this.readContract;
            case ContractVersion.v3:
                return this.readContract;
            default:
                throw new Error(`Unsupported version ${this.version}`);
        }
    }
    write(signer) {
        // lazy create an instance if it is not already cached
        if (!this.writeContract) {
            this.writeContract = this.createWriteContractInstance(signer);
        }
        else {
            // update the signer if it has changed
            if (this.writeContract.signer !== signer) {
                this.writeContract = this.createWriteContractInstance(signer);
            }
        }
        switch (this.version) {
            case ContractVersion.dev:
                return this.writeContract;
            case ContractVersion.v3:
                return this.writeContract;
            default:
                throw new Error(`Unsupported version ${this.version}`);
        }
    }
    decodeFunctionResult(functionName, data) {
        if (typeof functionName !== 'string') {
            throw new Error('functionName must be a string');
        }
        if (!this.interface.getFunction(functionName)) {
            throw new Error(`Function ${functionName} not found in contract interface`);
        }
        return this.interface.decodeFunctionResult(functionName, data);
    }
    decodeFunctionData(functionName, data) {
        if (typeof functionName !== 'string') {
            throw new Error('functionName must be a string');
        }
        if (!this.interface.getFunction(functionName)) {
            throw new Error(`Function ${functionName} not found in contract interface`);
        }
        return this.interface.decodeFunctionData(functionName, data);
    }
    encodeFunctionData(functionName, args) {
        if (typeof functionName !== 'string') {
            throw new Error('functionName must be a string');
        }
        if (!this.interface.getFunction(functionName)) {
            throw new Error(`Function ${functionName} not found in contract interface`);
        }
        return this.interface.encodeFunctionData(functionName, args);
    }
    parseError(error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        const anyError = error;
        const { errorData, errorMessage, errorName } = this.getErrorData(anyError);
        /**
         * Return early if we have trouble extracting the error data.
         * Don't know how to decode it.
         */
        if (!errorData) {
            logger.log(`parseError ${errorName}: no error data, or don't know how to extract error data`);
            return {
                name: errorName ?? UNKNOWN_ERROR,
                message: errorMessage ?? anyError,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                code: anyError?.code,
            };
        }
        /**
         * Try to decode the error data. If it fails, return the original error message.
         */
        try {
            const errDescription = this.interface.parseError(errorData);
            const decodedError = {
                name: errDescription?.errorFragment.name ?? UNKNOWN_ERROR,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                message: errorMessage,
            };
            logger.log('decodedError', decodedError);
            return decodedError;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            // Cannot decode error
            logger.error('cannot decode error', e);
            return {
                name: UNKNOWN_ERROR,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                message: e.message,
            };
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getErrorData(anyError) {
        /**
         * Error data is nested in different places depending on whether the app is
         * running in jest/node, or which blockchain (goerli, or anvil).
         */
        // Case: jest/node error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        let errorData = anyError.error?.error?.error?.data;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        let errorMessage = anyError.error?.error?.error?.message;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        let errorName = anyError.error?.error?.error?.name;
        if (!errorData) {
            // Case: Browser (anvil || base goerli)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorData = anyError.error?.error?.data;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorMessage = anyError.error?.error?.message;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorName = anyError.error?.error?.name;
        }
        if (!errorData) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorData = anyError.data;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorData = anyError?.data;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorMessage = anyError?.message;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            errorName = anyError?.name;
        }
        if (!errorData) {
            // sometimes it's a stringified object under anyError.reason or anyError.message
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                const reason = anyError?.reason || anyError?.message;
                if (typeof reason === 'string') {
                    const errorMatch = reason?.match(/error\\":\{([^}]+)\}/)?.[1];
                    if (errorMatch) {
                        const parsedData = JSON.parse(`{${errorMatch?.replace(/\\/g, '')}}`);
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        errorData = parsedData?.data;
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        errorMessage = parsedData?.message;
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        errorName = parsedData?.name;
                    }
                }
            }
            catch (error) {
                logger.error('error parsing reason', error);
            }
        }
        return {
            errorData,
            errorMessage,
            errorName,
        };
    }
    parseLog(log) {
        return this.contractInterface.parseLog(log);
    }
    createReadContractInstance() {
        if (!this.provider) {
            throw new Error('No provider');
        }
        return new ethers.Contract(this.address, this.abi, this.provider);
    }
    createWriteContractInstance(signer) {
        return new ethers.Contract(this.address, this.abi, signer);
    }
}
//# sourceMappingURL=BaseContractShim.js.map