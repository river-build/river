import path from 'path'
import fs from 'fs'
import os from 'os'
import type { JestConfigWithTsJest } from 'ts-jest'

if (process.env.NODE_EXTRA_CA_CERTS === undefined || process.env.NODE_EXTRA_CA_CERTS === '') {
    console.log('jest.config.ts: ERROR: NODE_EXTRA_CA_CERTS must be set')
    // Next line only works for node subprocesses, it's too late for the current process.
    process.env.NODE_EXTRA_CA_CERTS = path.join(os.homedir(), 'river-ca-cert.pem')
} else {
    if (!fs.existsSync(process.env.NODE_EXTRA_CA_CERTS)) {
        console.log(
            'jest.config.ts: ERROR: NODE_EXTRA_CA_CERTS does not exist, did you forget to run scripts/register-ca.sh? ',
            process.env.NODE_EXTRA_CA_CERTS,
        )
    }
}

const findMsgpackrFolder = () => {
    let currentDir = __dirname

    //Iterate up until we either no find a folder node_modules folder that contains msgpackr folder or we reach the root
    //If we reach the root path.dirname(currentDir) will return currenDir, we break the loop and return null
    while (currentDir !== path.dirname(currentDir)) {
        const nodeModulesPath = path.join(currentDir, 'node_modules')
        if (fs.existsSync(nodeModulesPath)) {
            const msgpackerPath = path.join(nodeModulesPath, 'msgpackr')
            if (fs.existsSync(msgpackerPath) && fs.lstatSync(msgpackerPath).isDirectory()) {
                return msgpackerPath
            }
        }
        currentDir = path.dirname(currentDir) // Move one directory up
    }

    return null // Folder not found
}

const MSGPACKR_FOLDER = findMsgpackrFolder()

const config: JestConfigWithTsJest = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: './../jest.env.ts',
    testEnvironmentOptions: {
        browsers: ['chrome', 'firefox', 'safari'],
        url: 'http://localhost:80',
    },
    runner: 'groups',
    verbose: true,
    testTimeout: 120000,
    modulePathIgnorePatterns: ['/dist/'],
    testPathIgnorePatterns: ['/dist/', '/node_modules/', 'util.test.ts', 'setupUrl.test.ts'],
    setupFilesAfterEnv: ['jest-extended/all', './../jest.matchers.ts'],
    setupFiles: ['fake-indexeddb/auto'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        'bn.js': 'bn.js',
        // match "hash.js" but not whateverHash.js - viem has many of these which should not be
        '\\bhash\\.js\\b': 'hash.js',
        '(.+)\\.js': '$1',
        // need for encryption
        'olm.wasm': require.resolve('../encryption/src/mock-wasm-file.js'),
        msgpackr: `${MSGPACKR_FOLDER}/dist/node.cjs`,
    },
    collectCoverage: true,
    coverageProvider: 'v8',
    coverageReporters: ['json', 'html'],
}

export default config
