// test/index.spec.ts
import { Env, worker } from '../src/index'
import { Claim, MerkleProofResponse, ApiErrorResponse } from '../src/types'
import { ErrorCode } from '../src/createResponse'

const FAKE_SERVER_URL = 'http:/server.com'

function generateRequest(
    route: string,
    method = 'GET',
    headers = {},
    body?: BodyInit,
    env?: Env,
): [Request, Env] {
    const url = `${FAKE_SERVER_URL}/${route}`
    return [new Request(url, { method, headers, body }), env ?? getMiniflareBindings()]
}

describe('Merkle Tree Worker', () => {
    const testClaims: Claim[] = [
        { address: '0x1234567890123456789012345678901234567890', amount: '100000' },
        { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '200000' },
        { address: '0x9876543210987654321098765432109876543210', amount: '300000' },
    ]

    const testConditionId = 'test-condition-123'

    describe('POST /admin/api/merkle-root', () => {
        test('creates merkle root successfully', async () => {
            const result = await worker.fetch(
                ...generateRequest(
                    'admin/api/merkle-root',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        claims: testClaims,
                        conditionId: testConditionId,
                    }),
                ),
            )

            expect(result.status).toBe(200)
            const responseBody = (await result.json()) as { merkleRoot: string }
            expect(responseBody).toHaveProperty('merkleRoot')
            expect(responseBody.merkleRoot).toBeTruthy()
        })

        test('returns ALREADY_EXISTS when trying to store same merkle root', async () => {
            // First request to create
            await worker.fetch(
                ...generateRequest(
                    'admin/api/merkle-root',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        claims: testClaims,
                        conditionId: testConditionId,
                    }),
                ),
            )

            // Second request with same data
            const result = await worker.fetch(
                ...generateRequest(
                    'admin/api/merkle-root',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        claims: testClaims,
                        conditionId: testConditionId,
                    }),
                ),
            )

            expect(result.status).toBe(409)
            const responseBody = (await result.json()) as ApiErrorResponse
            expect(responseBody.errorDetail.code).toBe(ErrorCode.ALREADY_EXISTS)
        })
    })

    describe('POST /api/merkle-proof', () => {
        let merkleRoot: string

        // Setup: Create merkle root first
        beforeEach(async () => {
            const result = await worker.fetch(
                ...generateRequest(
                    'admin/api/merkle-root',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        claims: testClaims,
                        conditionId: testConditionId,
                    }),
                ),
            )
            const responseBody = (await result.json()) as { merkleRoot: string }
            merkleRoot = responseBody.merkleRoot
        })

        test('generates proof successfully for valid claim', async () => {
            const testClaim = testClaims[0] // Use first claim for testing

            const result = await worker.fetch(
                ...generateRequest(
                    'api/merkle-proof',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        conditionId: testConditionId,
                        merkleRoot: merkleRoot,
                        claim: testClaim,
                    }),
                ),
            )

            expect(result.status).toBe(200)
            const responseBody = (await result.json()) as { data: MerkleProofResponse }
            expect(responseBody.data).toHaveProperty('proof')
            expect(Array.isArray(responseBody.data.proof)).toBe(true)
            expect(responseBody.data.leaf).toEqual([testClaim.address, testClaim.amount])
        })

        test('returns NOT_FOUND for non-existent merkle data', async () => {
            const result = await worker.fetch(
                ...generateRequest(
                    'api/merkle-proof',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        conditionId: 'non-existent',
                        merkleRoot: 'invalid-root',
                        claim: testClaims[0],
                    }),
                ),
            )

            expect(result.status).toBe(404)
            const responseBody = (await result.json()) as ApiErrorResponse
            expect(responseBody.errorDetail.code).toBe(ErrorCode.MERKLE_TREE_NOT_FOUND)
        })

        test('returns NOT_FOUND for invalid address/amount combination', async () => {
            const result = await worker.fetch(
                ...generateRequest(
                    'api/merkle-proof',
                    'POST',
                    { 'Content-Type': 'application/json' },
                    JSON.stringify({
                        conditionId: testConditionId,
                        merkleRoot: merkleRoot,
                        claim: {
                            address: '0x0000000000000000000000000000000000000000',
                            amount: '999999',
                        },
                    }),
                ),
            )

            expect(result.status).toBe(404)
            const responseBody = (await result.json()) as ApiErrorResponse
            expect(responseBody.errorDetail.code).toBe(ErrorCode.CLAIM_NOT_FOUND)
        })
    })
})
