# @tonfura/adapter

Tonfura adapter is an easy integration tool with popular ton client library. ([@ton/ton](https://github.com/ton-org/ton) and [tonweb](https://github.com/toncenter/tonweb))

## Usage

Before using it, you will need to get a key from Tonfura.

### ton/core

```js
import { ToncoreAdapter } from "@tonfura/adapter";

const client = new ToncoreAdapter({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});
```

### tonweb

```js
import { TonWebAdapter } from "@tonfura/adapter";

const client = new TonWebAdapter({
  network: "mainnet",
  apiKey: "YOUR_API_KEY",
});
```

## Documentation & Resources

[Tonfura](https://tonfura.com/)

[Api document](https://docs.tonfura.com/docs/welcome-to-tonfura)
