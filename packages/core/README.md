# Tonfura.js

A simple developer tool for Ton ecosystem which contains specialized function with [Tonfura](https://tonfura.com/) rpc provider.

## Features

- Tonfura rpc method
- Signed typed data

## Install

```bash
npm install @tonfurajs/core
```

If you want to use tonfura rich function to build up your dapp. You can [register](https://auth.tonfura.com/signup) an account and get a free api key.

There are some basic structures for sdk development.

## Example

```js
import { TonfuraJsonRpcProvider } from "@tonfurajs/core";

const client = new TonfuraJsonRpcProvider({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});

const res = await client.getConsensusBlock();

console.log(res);
```

## Documents

[Documentation](https://docs.tonfura.com/docs/welcome-to-tonfura)

## License

MIT
