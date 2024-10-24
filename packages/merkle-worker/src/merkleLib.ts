import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

interface Claim {
    address: string
    amount: string
}

export function createMerkleRoot(claims: Claim[]): string {
    const tree = StandardMerkleTree.of(
        claims.map((claim) => [claim.address, claim.amount]),
        ['address', 'uint256'],
    )
    return tree.root
}

export function generateMerkleProof(address: string, amount: string, claims: Claim[]): string[] {
    const tree = StandardMerkleTree.of(
        claims.map((claim) => [claim.address, claim.amount]),
        ['address', 'uint256'],
    )

    for (const [i, v] of tree.entries()) {
        if (v[0] === address && v[1] === amount) {
            return tree.getProof(i)
        }
    }

    throw new Error('Claim not found in the Merkle tree')
}
