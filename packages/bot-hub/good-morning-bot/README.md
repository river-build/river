# Good Morning Bot

This is a lightweight Node.js service that runs a bot to listen to new messages and reply with "Good Morning!" when it receives a `\gm` command.


## Usage

To run this bot sample you'll need:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- **Environment Variables**:

   - [`RIVER_ENV`](src/environment.ts): The River environment your bot will operate in.
   - [`SPACE_ID`](src/environment.ts): The ID of the space your bot will monitor.
   - [`CHANNEL_ID`](src/environment.ts): The ID of the channel your bot will monitor.
   - [`MNEMONIC`](src/environment.ts): The wallet mnemonic for the bot's account.


To run the bot in the background:

```bash
make start
```

To check the logs:

```bash
make logs
```

To stop the service:

```bash
make stop
```
