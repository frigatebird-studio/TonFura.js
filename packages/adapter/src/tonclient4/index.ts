import { version } from "../../package.json";
import { getJsonRpcUrl, getRestUrl } from './utils'
import { lastBlockCodec } from './types'
import { convertLastBlock, } from './converters'

type Network = "mainnet" | "testnet";

class TonClient4Adapter {
  endpoint: string
  network: Network
  apiKey: string

  constructor(
    network: Network,
    apiKey: string
  ) {
    this.network = network;
    this.apiKey = apiKey;
    this.endpoint = getJsonRpcUrl(network, apiKey);
  }

  version() {
    return version;
  }

  getRestEndpoint(path: string) {
    return getRestUrl(path, this.network, this.apiKey);
  }

  async sendRpc(method: string, params?: any) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method,
        params,
      }),
    })
    const data = await res.json();
    return data;
  }

  /**
     * Get Last Block
     * @returns last block info
     */
  async getLastBlock() {
    const data = await this.sendRpc('getMasterchainInfo');

    const result = convertLastBlock(data);
    let lastBlock = lastBlockCodec.safeParse(result);
    if (!lastBlock.success) {
      throw Error('Mailformed response: ' + lastBlock.error.format()._errors.join(', '));
    }
    return lastBlock.data;
  }
}

export default TonClient4Adapter;