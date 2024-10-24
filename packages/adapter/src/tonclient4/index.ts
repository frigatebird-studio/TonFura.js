import { Address, Contract, openContract, StateInit, TupleItem, Transaction, Cell, loadTransaction, serializeTuple, parseTuple, TupleReader  } from "@ton/core";
import { version } from "../../package.json";
import { getJsonRpcUrl, getRestUrl, getTonhubDomain, toUrlSafe } from './utils'
import {
  lastBlockCodec,
  blockCodec,
  accountCodec,
  runMethodCodec,
  sendCodec,
  configCodec,
  transactionsCodec,
  Network,
  accountLiteCodec,
  changedCodec,
  parsedTransactionsCodec,
  ParsedTransactions,
} from './types'
import {
  convertLastBlock,
  convertSendMessage,
  convertGetAccountLite,
  convertIsAccountChanged,
} from './converters'

import { createProvider } from './createProvider';

class TonClient4Adapter {
  endpoint: string
  network: Network
  apiKey: string

  constructor({
    apiKey,
    network,
  }: {
    apiKey: string;
    network: "mainnet" | "testnet";
  }) {
    this.apiKey = apiKey;
    this.network = network;
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

  async sendTonhubRequest(path: string, method: 'GET' | 'POST' | 'UPDATE' | 'DELETE', params?: any) {
    const endpoint = getTonhubDomain(this.network);
    let url = `${endpoint}${path}`
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
    /*
    * We can use our tonx api after the shards api has been fixed TON-2746
    */
    const result = await this.sendTonhubRequest('/block/' + seqno, 'GET');


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
     * Get block info by unix timestamp
     * @param ts unix timestamp
     * @returns block info
     */
  async getBlockByUtime(ts: number) {
    // tonx shard api doesn't support get by utime
    const result = await this.sendTonhubRequest('/block/utime/' + ts, 'GET');
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
    /*
    * To support the tonclient4 interface get account by seqNo, we need to support it from our tonx api response in future
    */
    const result = await this.sendTonhubRequest('/block/' + seqno + '/' + address.toString({ urlSafe: true }), 'GET');

    let account = accountCodec.safeParse(result);
    if (!account.success) {
      throw Error('Mailformed response');
    }
    return account.data;
  }

  /**
     * Get account lite info (without code and data)
     * @param seqno block sequence number
     * @param address account address
     * @returns account lite info
     */
  async getAccountLite(seqno: number, address: Address) {
    const data = await this.getAccount(seqno, address);
    const result = convertGetAccountLite(data);

    let account = accountLiteCodec.safeParse(result);
    if (!account.success) {
        throw Error('Mailformed response');
    }

    return account.data;
  }

  /**
     * Check if contract is deployed
     * @param address addres to check
     * @returns true if contract is in active state
     */
  async isContractDeployed(seqno: number, address: Address) {
    let account = await this.getAccountLite(seqno, address);

    return account.account.state.type === 'active';
  }

  /**
     * Check if account was updated since
     * @param seqno block sequence number
     * @param address account address
     * @param lt account last transaction lt
     * @returns account change info
     */
  async isAccountChanged(seqno: number, address: Address, lt: bigint) {
    const lastBlock = await this.getLastBlock();
    const beforeAccount = await this.getAccount(seqno, address);
    const afterAccount = await this.getAccount(lastBlock.last.seqno, address);
    const result = convertIsAccountChanged(beforeAccount, afterAccount);

    const changed = changedCodec.safeParse(result);
    if (!changed.success) {
        throw Error('Mailformed response');
    }
    return changed.data;
  }

  /**
     * Load unparsed account transactions
     * @param address address
     * @param lt last transaction lt
     * @param hash last transaction hash
     * @returns unparsed transactions
     */
  async getAccountTransactions(address: Address, lt: bigint, hash: Buffer) {

    const path = '/account/' + address.toString({ urlSafe: true }) + '/tx/' + lt.toString(10) + '/' + toUrlSafe(hash.toString('base64'));
    const tonhubData = await this.sendTonhubRequest(path, 'GET');

    /*
    * To support the tonclient4 interface (raw: Cell, outMessages: Dictionary, etc...), we need to build their boc format from our tonx api response in future
    */
    let transactions = transactionsCodec.safeParse(tonhubData);

    if (!transactions.success) {
      throw Error('Mailformed response');
    }

    const data = transactions.data;
    let tx: {
      block: {
          workchain: number;
          seqno: number;
          shard: string;
          rootHash: string;
          fileHash: string;
      },
      tx: Transaction
    }[] = [];
    let cells = Cell.fromBoc(Buffer.from(data.boc, 'base64'));
    for (let i = 0; i < data.blocks.length; i++) {
        tx.push({
            block: data.blocks[i],
            tx: loadTransaction(cells[i].beginParse())
        });
    }
    return tx;
  }

  /**
     * Load parsed account transactions
     * @param address address
     * @param lt last transaction lt
     * @param hash last transaction hash
     * @param count number of transactions to load
     * @returns parsed transactions
     */
  async getAccountTransactionsParsed(address: Address, lt: bigint, hash: Buffer, count: number = 20) {
    const path = '/account/' + address.toString({ urlSafe: true }) + '/tx/parsed/' + lt.toString(10) + '/' + toUrlSafe(hash.toString('base64')) + '?' + new URLSearchParams({ count: count.toString() }).toString();

    const tonhubData = await this.sendTonhubRequest(path, 'GET');

    /*
    * To support the tonclient4 interface, we need to provide missing data in our tonx api response in future
    */
    const parsedTransactionsRes = parsedTransactionsCodec.safeParse(tonhubData);

    if (!parsedTransactionsRes.success) {
        throw Error('Mailformed response');
    }

    return parsedTransactionsRes.data as ParsedTransactions;
}

  /**
     * Get network config
     * @param seqno block sequence number
     * @param ids optional config ids
     * @returns network config
     */
  async getConfig(seqno: number, ids?: number[]) {
    let tail = '';
    if (ids && ids.length > 0) {
        tail = '/' + [...ids].sort().join(',');
    }
    const result = await this.sendTonhubRequest('/block/' + seqno + '/config' + tail, 'GET');

    /*
    * To support the tonclient4 interface (address, globalBalance), we need to support format from our tonx api response in future
    */

    const config = configCodec.safeParse(result);
    if (!config.success) {
        throw Error('Mailformed response');
    }
    return config.data;
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
    /*
    * To support the tonclient4 interface, we need to support returning boc format from our tonx api response in future
    */
    const tail = args && args.length > 0 ? '/' + toUrlSafe(serializeTuple(args).toBoc({ idx: false, crc32: false }).toString('base64')) : '';
    const path = '/block/' + seqno + '/' + address.toString({ urlSafe: true }) + '/run/' + encodeURIComponent(name) + tail;
    const res = await this.sendTonhubRequest(path, 'GET');

    const runMethod = runMethodCodec.safeParse(res);
    if (!runMethod.success) {
      throw Error('Mailformed response');
    }
    const resultTuple = runMethod.data.resultRaw ? parseTuple(Cell.fromBoc(Buffer.from(runMethod.data.resultRaw, 'base64'))[0]) : [];
    return {
      exitCode: runMethod.data.exitCode,
      result: resultTuple,
      resultRaw: runMethod.data.resultRaw,
      block: runMethod.data.block,
      shardBlock: runMethod.data.shardBlock,
      reader: new TupleReader(resultTuple),
    };
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

  /**
     * Open smart contract
     * @param contract contract
     * @returns opened contract
     */
  open<T extends Contract>(contract: T) {

    return openContract<T>(contract, (args) => createProvider(this, null, args.address, args.init));
  }

  /**
   * Open smart contract
   * @param block block number
   * @param contract contract
   * @returns opened contract
   */
  openAt<T extends Contract>(block: number, contract: T) {
    return openContract<T>(contract, (args) => createProvider(this, block, args.address, args.init));
  }

  /**
   * Create provider
   * @param address address
   * @param init optional init data
   * @returns provider
   */
  provider(address: Address, init?: StateInit | null) {
    return createProvider(this, null, address, init ?? null);
  }

  /**
   * Create provider at specified block number
   * @param block block number
   * @param address address
   * @param init optional init data
   * @returns provider
   */
  providerAt(block: number, address: Address, init?: StateInit | null) {
    return createProvider(this, block, address, init ?? null);
  }
}



export default TonClient4Adapter;
