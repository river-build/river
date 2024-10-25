// test/index.spec.ts
import { Env, worker } from '../src/index'
import { Claim } from '../src/types'

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

describe('Return merkle root worker', () => {
    test('responds with merkle root for valid claims (unit style)', async () => {
        const claims: Claim[] = [
            { address: '0x1234567890123456789012345678901234567890', amount: '100000' },
            { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '200000' },
            { address: '0x9876543210987654321098765432109876543210', amount: '300000' },
        ]

        const result = await worker.fetch(
            ...generateRequest(
                'merkle-root',
                'POST',
                {
                    'Content-Type': 'application/json',
                },
                JSON.stringify({ claims }), // Stringify the entire object, not just the claims array
            ),
        )

        expect(result.status).toBe(200)
        const responseBody = await result.json()
        console.log(responseBody)
        expect(responseBody).toHaveProperty('merkleRoot')
    })
})
