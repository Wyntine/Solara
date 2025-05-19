# Solara

**Notes**:

- This project is under active development, nothing is guaranteed to work as expected.
- This project uses Node.js >= 22 because of TypeScript type transformation
- This project requires [custom Node.js build](https://github.com/Wyntine/node-patch) for its hot reloading ability. You may not need it for your use case.

This is a very very very alpha Discord bot with special abilities. This project uses **pnpm** package manager. Documentation is not ready, please try your best to understand my spaghetti code...

## How to use?

First, lint the project to check for possible errors (I assume that you are developing this project. If not, kindly skip that step):

```sh
# It should give bunch of errors (ignore them 🤓)
pnpm lint
```

Then you can copy or rename **config.example.yml** to **config.yml** and fill the config to start the bot:

```sh
# Install the packages once
pnpm install

# Start the project
pnpm start
```
