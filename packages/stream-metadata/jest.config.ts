import { resolve } from 'path'
import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
	preset: 'ts-jest/presets/default-esm',
	extensionsToTreatAsEsm: ['.ts'],
	modulePathIgnorePatterns: ['/dist/'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
		'@matrix-org/olm/olm.wasm': resolve(__dirname, './tests/__mocks__/mock-wasm-file.js'),
	},
	setupFilesAfterEnv: [resolve(__dirname, './jest.setup.ts')],
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/dist/', '/node_modules/'],
	testTimeout: 10000,
	transform: {
		'^.+\\.ts$': ['ts-jest', { useESM: true }],
		'^.+\\.wasm$': 'jest-transform-stub',
	},
	transformIgnorePatterns: ['/node_modules/(?!@river-build)'],
	verbose: true,
}

export default config
