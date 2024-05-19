import TonWeb from "tonweb";
import { version } from "../../package.json";

//@ts-ignore
class TonWebWrappedHttpProvider extends TonWeb.HttpProvider {
  constructor(props: ConstructorParameters<typeof TonWeb.HttpProvider>[0]) {
    super(props);
  }
  override sendImpl = async (apiUrl: string, request: any) => {
    return fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-source": "tonweb-adapter",
        "x-adapter-version": version,
      },
      body: JSON.stringify({
        ...request,
        method: "ton_" + request.method,
      }),
    })
      .then((response) => response.json())
      .then(({ result, error }) => result || Promise.reject(error));
  };
}

class TonWebAdapter extends TonWeb {
  constructor({
    network,
    apiKey,
  }: {
    network: "mainnet" | "testnet";
    apiKey: string;
  }) {
    super(
      //@ts-ignore
      new TonWebWrappedHttpProvider(
        `https://${network}-rpc.tonfura.com/v1/json-rpc/${apiKey}`
      )
    );
  }
}
export default TonWebAdapter;
