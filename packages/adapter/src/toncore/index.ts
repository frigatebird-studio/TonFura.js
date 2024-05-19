import axios from "axios";
import { TonClient, HttpApi } from "@ton/ton";
import { version } from "../../package.json";

const ProxiedHttp = new Proxy(HttpApi, {
  construct(target, args) {
    const instance = Reflect.construct(target, args);
    const doCallProxy = new Proxy(instance.doCall, {
      async apply(doCallTarget, thisArg, doCallArgs) {
        const modifiedMethod = "ton_" + doCallArgs[0];
        doCallArgs[0] = modifiedMethod;
        return Reflect.apply(doCallTarget, thisArg, doCallArgs);
      },
    });

    instance.doCall = doCallProxy;

    return instance;
  },
});

class ToncoreAdapter extends TonClient {
  #api: any;
  constructor({
    apiKey,
    network,
  }: {
    apiKey: string;
    network: "mainnet" | "testnet";
  }) {
    super({
      endpoint: "",
    });
    this.api = new ProxiedHttp(
      `https://${network}-rpc.tonfura.com/v1/json-rpc/${apiKey}`,
      {
        adapter: async (config) => {
          const adapter = axios.getAdapter("http");
          // @ts-expect-error
          config.headers = {
            ...config.headers.toJSON(),
            "x-source": "toncore-adapter",
            "x-adapter-version": version,
          };
          const r = await adapter(config);
          if (r.status !== 200) {
            throw r;
          }

          r.data = JSON.stringify({
            ...JSON.parse(r.data),
            ok: true,
          });
          return r;
        },
      }
    );
  }
}

export default ToncoreAdapter;
