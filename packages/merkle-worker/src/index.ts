import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { Claim } from './types'

export interface Env {}

export const worker = {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'POST' && request.url.endsWith('/merkle-root')) {
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
                return new Response('Error processing request', { status: 500 })
            }
        }

        return new Response('Not found', { status: 404 })
    },
}

export default {
    fetch(request: Request, env: Env, _ctx: ExecutionContext) {
        return worker.fetch(request, env)
    },
}
