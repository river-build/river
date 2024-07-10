# Bot Hub

## Building a Bot with River SDK

This guide will walk you through creating your own bot using the River SDK, as demonstrated in the provided sample.

### Setup

1. **Install Dependencies**: Ensure you have [`fake-indexddb`](https://github.com/dumbmatter/fakeIndexedDB) and [`@river-build/sdk`](https://www.npmjs.com/package/@river-build/sdk). 
Install them using yarn:

   ```bash
   yarn add fake-indexddb @river-build/sdk
   ```

   `fake-indexeddb` serves as an in-memory implementation of the IndexedDB API, replacing Dexie used internally by the `@river-build/sdk` in Node.

2. **Custom Loader**: To load `@river-build/sdk` properly in Node, you must use this [`custom-loader.mjs`](custom-loader.mjs). It handles a WebAssembly file dependency. Make sure `package.json` uses this custom loader.

   ```json
   "scripts": {
      "my-node": "node --experimental-loader ./custom-loader.mjs",
      "start": "yarn my-node ./dist/index.js",
   }
   ```

3. **Setting the Yarn Version**: The dependency `@river-build/generated` requires the use of Yarn version 3.8.0.

   ```bash
   yarn set version 3.8.0
   ```

   This will create the `.yarnrc.yml` file. Ensure you have `nodeLinker: node-modules` in the file:

   ```yaml
   nodeLinker: node-modules
   yarnPath: .yarn/releases/yarn-3.8.0.cjs
   ```

### Understanding the Code

#### Initializing the Bot

First, initialize the bot and start the sync:

```ts
const bot = new Bot(ethers.Wallet.fromMnemonic(mnemonic));
const syncAgent = await bot.makeSyncAgent();
await syncAgent.start();
```
The `SyncAgent` is responsible for syncing data from River nodes. It utilizes the [`RIVER_ENV`](../../sdk/src/riverConfig.ts#L14) to establish a connection to the specified nodes.

You can wait for the spaces to be loaded before proceeding:

```ts
await syncAgent.spaces.when((spaces) => {
  return spaces.status === "loaded";
});
```

#### Listening for Messages

You can listen for new messages in the specified channel using the `when` method to find new decrypted messages and process them.

```ts
const channel = syncAgent.spaces.getSpace(spaceId).getChannel(channelId);
let latestEventTimestamp = BigInt(new Date().getTime());

await channel.timeline.events.when((events) => {
  const event = events.find((event) => {
    // ignore events that are not new, or don't have text, or are not decrypted
    if (
      event.createdAtEpochMs <= latestEventTimestamp ||
      !event.text ||
      !event.isDecryptedEvent
    ) {
      return false;
    }

    latestEventTimestamp = event.createdAtEpochMs;
    // ignore events created by the bot
    return event.creatorUserId !== bot.userId;
  });

  if (!event) {
    return false;
  }

  channel.sendMessage("New message received!");
  return true;
});
```

#### Sending Messages

To send a message, first obtain the channel, then call sendMessage:

```ts
const channel = syncAgent.spaces.getSpace(spaceId).getChannel(channelId);
await channel.sendMessage("Hello World");
```

#### Stopping the Sync
Don't forget to stop the syncAgent when your processing is done:

```ts
await syncAgent.stop();
```

It's recommended to set up listeners for SIGINT and SIGTERM signals to gracefully shut down the bot when the process is terminated.


## Samples

Explore the sample projects below to learn how it works:

- [Good Morning Bot](good-morning-bot/README.md)
