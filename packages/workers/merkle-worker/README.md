## Merkle Worker

This worker is used to generate a merkle tree from a list of addresses and amounts
and proofs of a merkle tree given a merkle root.

### Test Worker

```bash
yarn dev:local

#
yarn test
```

### Generate Merkle Root Locally

```bash
yarn generate-merkle src/scripts/test_input.json

[
  {
    address: '0x1234567890123456789012345678901234567890',
    amount: '1000000000000000000'
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    amount: '2500000000000000000'
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    amount: '3300000000000000000'
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    amount: '4100000000000000000'
  },
  {
    address: '0x5678901234567890123456789012345678901234',
    amount: '5000000000000000000'
  }
]
Merkle root generated successfully: 0xe96b72feb993a4e9c25627c3877fd6a5de92cc433a07cd3d78b300f575010281
Output written to: src/scripts/test_input_root.json
```
