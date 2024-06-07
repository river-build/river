/**
 * @group main
 */
import { dlog } from '@river-build/dlog';
import { converse } from './testDriver.test_util';
const log = dlog('test:aliceAndFriends');
describe('aliceAndBobAndFriends10for10', () => {
    test('10for10', async () => {
        const conversation = [];
        for (let i = 0; i < 10; i++) {
            const step = [];
            for (let j = 0; j < 10; j++) {
                step.push(`step ${i} from ${j}`);
            }
            conversation.push(step);
        }
        log(`10for10 starting`);
        const convResult = await converse(conversation, '10for10');
        log(`10for10 completed`, convResult);
        expect(convResult).toBe('success');
    }, 250_000);
});
//# sourceMappingURL=aliceAndFriends10for10.test.js.map