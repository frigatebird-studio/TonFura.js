import TonClient4Adapter from './index';
import { version as packageVersion } from "../../package.json";
import { convertHexShardToSignedNumberStr } from './utils';
import { Address } from '@ton/core';

describe('TonClient4Adapter', () => {
  const network = 'testnet';
  const apiKey = 'test-api-key';
  let tonClient: TonClient4Adapter;

  beforeEach(() => {
    tonClient = new TonClient4Adapter({ network, apiKey });
  });

  it('should initialize with correct properties', () => {
    expect(tonClient.network).toBe(network);
    expect(tonClient.apiKey).toBe(apiKey);
    expect(tonClient.endpoint).toBe(`https://${network}-rpc.tonxapi.com/v2/json-rpc/${apiKey}`);
  });

  it('should return the correct version', () => {
    expect(tonClient.version()).toBe(packageVersion);
  });

  it('should fetch the last block correctly', async () => {
    const mockResponse = {
      result: {
        first: {
          file_hash: 'first-file-hash',
          root_hash: 'first-root-hash',
        },
        last: {
          file_hash: 'last-file-hash',
          root_hash: 'last-root-hash',
          seqno: 123,
          shard: '8000000000000000',
          workchain: -1,
        },
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const lastBlock = await tonClient.getLastBlock();

    expect(lastBlock).toEqual({
      init: {
        fileHash: 'first-file-hash',
        rootHash: 'first-root-hash',
      },
      last: {
        fileHash: 'last-file-hash',
        rootHash: 'last-root-hash',
        seqno: 123,
        shard: '-9223372036854775808',
        workchain: -1,
      },
      stateRootHash: '',
      now: expect.any(Number),
    });

    expect(global.fetch).toHaveBeenCalledWith(tonClient.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "getMasterchainInfo",
      }),
    });
  });

  it('should throw an error if the response is malformed', async () => {
    const mockResponse = {
      result: {
        first: {
          file_hash: 'first-file-hash',
          root_hash: 'first-root-hash',
        },
        last: {
          file_hash: 'last-file-hash',
          root_hash: 'last-root-hash',
          seqno: 123,
          shard: '8000000000000000',
          workchain: -1,
        },
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    // Modify the response to be malformed
    mockResponse.result.last.seqno = 'not-a-number' as any;

    await expect(tonClient.getLastBlock()).rejects.toThrow('Mailformed response:');
  });

  it('should fetch getBlock correctly', async () => {
    const seqno = 123;
    const mockShardsResponse = {
      ok: true,
      result: {
        shards: [
          {
            workchain: 0,
            shard: '2000000000000000',
            seqno: 40632776,
          },
        ],
      }
    };

    const mockBlockTransactionsResponse = {
      id: 0,
      jsonrpc: "2.0",
      result: {
        transactions: [],
        id: {
          workchain: -1,
          shard: "8000000000000000",
          seqno,
          root_hash: 'root-hash',
          file_hash: 'file-hash',
        }
      },
    };
    const mockBlockTransactionsResponse2 = {
      id: 0,
      jsonrpc: "2.0",
      result: {
        transactions: [],
        id: {
          workchain: 0,
          shard: "2000000000000000",
          seqno: 40632776,
          root_hash: 'root-hash',
          file_hash: 'file-hash',
        }
      },
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockShardsResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockBlockTransactionsResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockBlockTransactionsResponse2),
      });

    const block = await tonClient.getBlock(seqno);

    expect(block).toEqual({
      shards: [
        {
          workchain: mockBlockTransactionsResponse.result.id.workchain,
          shard: convertHexShardToSignedNumberStr(mockBlockTransactionsResponse.result.id.shard),
          seqno: mockBlockTransactionsResponse.result.id.seqno,
          rootHash: mockBlockTransactionsResponse.result.id.root_hash,
          fileHash: mockBlockTransactionsResponse.result.id.file_hash,
          transactions: [],
        },
        {
          workchain: mockBlockTransactionsResponse2.result.id.workchain,
          shard: convertHexShardToSignedNumberStr(mockBlockTransactionsResponse2.result.id.shard),
          seqno: mockBlockTransactionsResponse2.result.id.seqno,
          rootHash: mockBlockTransactionsResponse2.result.id.root_hash,
          fileHash: mockBlockTransactionsResponse2.result.id.file_hash,
          transactions: [],
        }
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(tonClient.getRestEndpoint('shards') + `?seqno=${seqno}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(global.fetch).toHaveBeenCalledWith(tonClient.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "getBlockTransactions",
        params: {
          workchain: -1,
          shard: '8000000000000000',
          seqno: 123,
        },
      }),
    });
  });

  it('should throw an error if block is out of scope', async () => {
    const seqno = 123;
    const mockShardsResponse = {
      ok: false,
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockShardsResponse),
      })
    ) as jest.Mock;

    await expect(tonClient.getBlock(seqno)).rejects.toThrow('Block is out of scope');
  });

  it('should fetch account information correctly', async () => {
    const seqno = 123;
    const address = Address.parse('EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt');
    const mockResponse = {
      "result": {
        "@type": "raw.fullAccountState",
        "balance": "2507362398469",
        "code": "te6cckECJgEACVwAART...long_code_here",
        "data": "te6cckECVgEAFgUABEN...long_data_here",
        "last_transaction_id": {
            "@type": "internal.transactionId",
            "lt": "49472270000045",
            "hash": "7Oyj8VbpCJl9EiqHDdV6NTPABphrObD0MWdeUP7m2ag="
        },
        "block_id": {
            "@type": "ton.blockIdExt",
            "workchain": -1,
            "shard": "8000000000000000",
            "seqno": 40656952,
            "root_hash": "15CcsNDcnxwTxjzc5ykdEpuXAKr5LMkVXBL3t2/KPcQ=",
            "file_hash": "bHAo3Qzp0N47FpMorbJ+XVJiDy5Ua3cA3BNEEtoPqD8="
        },
        "frozen_hash": "",
        "sync_utime": 1727347904,
        "@extra": "1727347933.783723:0:0.13673754836657925",
        "state": "active"
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const account = await tonClient.getAccount(seqno, address);

    expect(account).toEqual({
      account: {
        "state": {
          "type": "active",
          "code": "te6cckECJgEACVwAART...long_code_here",
          "data": "te6cckECVgEAFgUABEN...long_data_here",
        },
        "balance": {
          "coins": "2507362398469"
        },
        "last": {
          "lt": "49472270000045",
          "hash": "7Oyj8VbpCJl9EiqHDdV6NTPABphrObD0MWdeUP7m2ag="
        },
        storageStat: null
      },
      block: {
        "workchain": -1,
        "seqno": 40656952,
        "shard": "-9223372036854775808",
        "rootHash": "15CcsNDcnxwTxjzc5ykdEpuXAKr5LMkVXBL3t2/KPcQ=",
        "fileHash": "bHAo3Qzp0N47FpMorbJ+XVJiDy5Ua3cA3BNEEtoPqD8="
      }
    });

    expect(global.fetch).toHaveBeenCalledWith(tonClient.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: "2.0",
        method: "getAddressInformation",
        params: {
          address: address.toString(),
        },
      }),
    });
  });

  it('should throw an error if the account response is malformed', async () => {
    const seqno = 123;
    const address = Address.parse('EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt');
    const mockResponse = {
      "result": {
        "@type": "raw.fullAccountState",
        "balance": "2507362398469",
        "code": "te6cckECJgEACVwAART...long_code_here",
        "data": "te6cckECVgEAFgUABEN...long_data_here",
        "last_transaction_id": {
            "@type": "internal.transactionId",
            "lt": "49472270000045",
            "hash": "7Oyj8VbpCJl9EiqHDdV6NTPABphrObD0MWdeUP7m2ag="
        },
        "block_id": {
            "@type": "ton.blockIdExt",
            "workchain": -1,
            "shard": "8000000000000000",
            "seqno": 40656952,
            "root_hash": "15CcsNDcnxwTxjzc5ykdEpuXAKr5LMkVXBL3t2/KPcQ=",
            "file_hash": "bHAo3Qzp0N47FpMorbJ+XVJiDy5Ua3cA3BNEEtoPqD8="
        },
        "frozen_hash": "",
        "sync_utime": 1727347904,
        "@extra": "1727347933.783723:0:0.13673754836657925",
        "state": "active"
      },
    };
    mockResponse.result.state = 0 as any;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    await expect(tonClient.getAccount(seqno, address)).rejects.toThrow('Mailformed response');
  });

  it('should get config', async () => {
    const seqno = 123;
    const mockResponse = {
      id: 0,
      jsonrpc: "2.0",
      result: {
        config: {
          bytes: "value0asdasd3e",
        },
      },
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const config = await tonClient.getConfig(seqno);

    expect(config).toEqual({
      config: {
        cell: "value0asdasd3e",
        address: "", // todo we don't have such data
        globalBalance: {
          coins: "" // todo we don't have such data
        }
      }
    });

    // expect(global.fetch).toHaveBeenCalledWith(`${tonClient.getRestEndpoint("getConfigParam")}?seqno=${seqno}`, {
    expect(global.fetch).toHaveBeenCalledWith(`https://${network}-rpc.tonxapi.com/v2/api/getConfigParam/${apiKey}?seqno=${seqno}`, {
      method: 'GET',
      headers: {
      'Content-Type': 'application/json',
      },
    });

});
});

describe('convertHexShardToSignedNumberStr', () => {
  it('should convert hex shard to signed number string correctly', () => {
    const hexShard = '8000000000000000';
    const signedNumberStr = convertHexShardToSignedNumberStr(hexShard);
    expect(signedNumberStr).toBe('-9223372036854775808');
  });

  it('should handle positive hex shard correctly', () => {
    const hexShard = '0000000000000001';
    const signedNumberStr = convertHexShardToSignedNumberStr(hexShard);
    expect(signedNumberStr).toBe('1');
  });

  it('should handle zero hex shard correctly', () => {
    const hexShard = '0000000000000000';
    const signedNumberStr = convertHexShardToSignedNumberStr(hexShard);
    expect(signedNumberStr).toBe('0');
  });
});
