import { Router } from 'itty-router'
import { createErrorResponse, ErrorCode } from './createResponse'
import { Env } from '.'
import { WorkerRequest } from './utils'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { Claim } from './types'

const router = Router()

router.post('/admin/api/merkle-root', async (request: WorkerRequest, env: Env) => {
    try {
        const { claims }: { claims: Claim[] } = await request.json()

        if (!Array.isArray(claims) || claims.length === 0) {
            return new Response('Invalid claims array', { status: 400 })
        }

        const tree = StandardMerkleTree.of(
            claims.map((claim) => [claim.address, claim.amount]),
            ['address', 'uint256'],
        )

        const merkleRoot = tree.root

        return new Response(JSON.stringify({ merkleRoot }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return createErrorResponse(500, `Error processing request`, ErrorCode.INTERNAL_SERVER_ERROR)
    }
})

router.get('*', () => createErrorResponse(404, 'Not Found', ErrorCode.NOT_FOUND))

export const handleRequest = (request: WorkerRequest, env: Env) => router.handle(request, env)
