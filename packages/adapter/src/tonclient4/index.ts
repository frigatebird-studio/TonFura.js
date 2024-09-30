import { Address, TupleItem } from '@ton/core';
import { version } from "../../package.json";
import { getJsonRpcUrl, getRestUrl, sendRpcArray } from './utils'
import {
  lastBlockCodec,
  ShardsResponse,
  GetBlockTransactionsResponse,
  blockCodec,
  SeqnoSet,
  accountCodec,
  accountTransactionsCodec,
  runMethodCodec,
  sendCodec,
} from './types'
import {
  convertLastBlock,
  convertGetBlockTransactionsInputs,
  convertGetBlock,
  convertGetAccount,
  convertGetAccountTransactions,
  convertRunMethod,
  convertSendMessage,
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
    if (!block.success) {
      throw Error('Mailformed response');
    }
    if (!block.data.exist) {
      throw Error('Block is out of scope');
    }
    return block.data.block;
  }

  /**
     * Get block info by seqno
     * @param seqno block sequence number
     * @param address account address
     * @returns account info
     */
  async getAccount(seqno: number, address: Address) {
    const data = await this.sendRpc('getAddressInformation', {
      address: address.toString(),
    });
    const result = convertGetAccount(data);
    let account = accountCodec.safeParse(result);
    if (!account.success) {
      throw Error('Mailformed response');
    }
    return account.data;
  }

  /**
     * Load unparsed account transactions
     * @param address address
     * @param lt last transaction lt
     * @param hash last transaction hash
     * @returns unparsed transactions
     */
  async getAccountTransactions(address: Address, lt: bigint, hash: Buffer) {
    const params = {
      account: address.toString(),
      end_lt: Number(lt),
      // we don't know the start lt
      // start_lt: 46896908000041 
      sort: "DESC",
    }
    const data = await this.sendRpc('getTransactions', params);


    const result = convertGetAccountTransactions(data);
    let transactions = accountTransactionsCodec.safeParse(result);
    if (!transactions.success) {
      throw Error('Mailformed response');
    }

    return transactions.data;
  }

  /**
     * Execute run method
     * @param seqno block sequence number
     * @param address account address
     * @param name method name
     * @param args method arguments
     * @returns method result
     */
  async runMethod(seqno: number, address: Address, name: string, args?: TupleItem[]) {

    // todo: we don't support to use seqno to run get method
    const params = {
      address: address.toString(),
      method: name,
      stack: args || [],
    }
    const data = await this.sendRpc('runGetMethod', params);
    await new Promise((r) => setTimeout(r, 1000));
    const accountData = await this.getAccount(seqno, address);
    const res = convertRunMethod(data, accountData);
    let runMethod = runMethodCodec.safeParse(res);
    if (!runMethod.success) {
      throw Error('Mailformed response');
    }
    return runMethod.data;
  }

  /**
     * Send external message
     * @param message message boc
     * @returns message status
     */
  async sendMessage(message: Buffer) {
    const res = await this.sendRpc('sendMessage', { boc: message.toString('base64') });
    const data = convertSendMessage(res);
    let send = sendCodec.safeParse(data);
    if (!send.success) {
        throw Error('Mailformed response');
    }
    return { status: res.data.status };
}
}

export default TonClient4Adapter;