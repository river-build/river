import { dlogger } from '@river-build/dlog';
import { makeBotName } from '../../utils/botName';
export async function updateProfile(client, cfg) {
    const logger = dlogger(`stress:updateProfile:${client.logId}`);
    // set the name and profile picture in the space
    const spaceStream = await client.streamsClient.waitForStream(cfg.spaceId);
    const existingName = spaceStream.view?.membershipContent.userMetadata.usernames.usernameEvents.get(client.connection.userId);
    if (!existingName) {
        const name = makeBotName(client.clientIndex);
        logger.log('updating profile to: ' + name);
        await client.streamsClient.setUsername(cfg.spaceId, name);
    }
}
//# sourceMappingURL=updateProfile.js.map