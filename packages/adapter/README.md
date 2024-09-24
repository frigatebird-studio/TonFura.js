# @tonxjs/adapter

TONX JS adapter is an easy integration tool with popular ton client library. 
- [@ton/ton](https://github.com/ton-org/ton) 
- [tonweb](https://github.com/toncenter/tonweb)
- [TonClient4](https://github.com/ton-org/ton/blob/master/src/client/TonClient4.ts)

## Usage

Before using it, you will need to get a key from TONX API.

### ton/core

```js
import { ToncoreAdapter } from "@tonxjs/adapter";

const client = new ToncoreAdapter({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});
```

### tonweb

```js
import { TonWebAdapter } from "@tonxjs/adapter";

const client = new TonWebAdapter({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});
```

### TonClient4

```js
import { TonClient4Adapter } from "@tonxjs/adapter";

const client = new TonClient4Adapter({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});
```

## Documentation & Resources

[TONX API](https://tonxapi.com/)

[Api document](https://docs.tonxapi.com/docs/welcome-to-tonxapi)
