import { z } from 'zod';
import { version } from "../../package.json";
import { getJsonRpcUrl, getRestUrl } from './utils'

type Network = "mainnet" | "testnet";

function convertHexShardToSignedNumberStr(hexShard: string) {
  const shard = parseInt(hexShard, 16);
  const signedNum = shard > 0x7fffffff ? shard - 0x100000000 : shard;
  return signedNum.toString();
}

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

  /**
     * Get Last Block
     * @returns last block info
     */
  async getLastBlock() {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "getMasterchainInfo",
      }),
    })
    const data = await res.json();

    const result = {
      init: {
        fileHash: data.result.first.file_hash,
        rootHash: data.result.first.root_hash,
      },
      last: {
        fileHash: data.result.last.file_hash,
        rootHash: data.result.last.root_hash,
        seqno: data.result.last.seqno,
        shard: convertHexShardToSignedNumberStr(data.result.last.shard),
        workchain: data.result.last.workchain,

      },
      stateRootHash: '',
      now: Math.floor(Date.now() / 1000),
    }
    let lastBlock = lastBlockCodec.safeParse(result);
    if (!lastBlock.success) {
      throw Error('Mailformed response: ' + lastBlock.error.format()._errors.join(', '));
    }
    return lastBlock.data;
  }
}

export default TonClient4Adapter;

const lastBlockCodec = z.object({
  last: z.object({
    seqno: z.number(),
    shard: z.string(),
    workchain: z.number(),
    fileHash: z.string(),
    rootHash: z.string()
  }),
  init: z.object({
    fileHash: z.string(),
    rootHash: z.string()
  }),
  stateRootHash: z.string(),
  now: z.number()
});