/**
 * @group main
 */
import { dlog } from '@river-build/dlog';
import { converse } from './testDriver.test_util';
const log = dlog('test:aliceAndFriends');
describe('aliceAndBobAndFriends3for8', () => {
    test('aliceAndBobAndFriends3for8', async () => {
        const conversation = [];
        for (let i = 0; i < 8; i++) {
            const step = [];
            for (let j = 0; j < 3; j++) {
                step.push(`step ${i} from ${j}`);
            }
            conversation.push(step);
        }
        const convResult = await converse(conversation, '3for8');
        log(`3for8 completed`, convResult);
        expect(convResult).toBe('success');
    });
});
//# sourceMappingURL=aliceAndFriends3for8.test.js.map