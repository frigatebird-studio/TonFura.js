import { version } from "../../package.json";
import { getJsonRpcUrl, getRestUrl, sendRpcArray } from './utils'
import { lastBlockCodec, ShardsResponse, GetBlockTransactionsResponse, blockCodec, SeqnoSet } from './types'
import {
  convertLastBlock,
  convertGetBlockTransactionsInputs,
  convertGetBlock,
} from './converters'

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

  async sendRest(path: string, method: 'GET' | 'POST' | 'UPDATE' | 'DELETE', params: any) {
    let url = this.getRestEndpoint(path);
    if (method === 'GET' && params) {
      url += '?' + new URLSearchParams(params).toString();
    }
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(params) : undefined,
    });
    return response.json();
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

  /**
     * Get block info
     * @param seqno block sequence number
     * @returns block info
     */
  async getBlock(seqno: number) {
    const data: ShardsResponse = await this.sendRest('shards', 'GET', { seqno })
    const inputs = convertGetBlockTransactionsInputs(seqno, data);
    const transactionsData = await sendRpcArray<SeqnoSet, GetBlockTransactionsResponse>(this.sendRpc.bind(this), inputs);
    const result = convertGetBlock(transactionsData);

    
    let block = blockCodec.safeParse(result);
    console.log('result \n\n', JSON.stringify(result, null, 2), '\n\n', block.error?.format()._errors.join(', '));
    if (!block.success) {
      throw Error('Mailformed response');
    }
    if (!block.data.exist) {
      throw Error('Block is out of scope');
    }
    return block.data.block;
  }
}

export default TonClient4Adapter;