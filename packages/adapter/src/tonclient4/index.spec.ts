import TonClient4Adapter from './index';
import { version as packageVersion } from "../../package.json";
import { convertHexShardToSignedNumberStr } from './utils';

describe('TonClient4Adapter', () => {
  const network = 'testnet';
  const apiKey = 'test-api-key';
  let tonClient: TonClient4Adapter;

  beforeEach(() => {
    tonClient = new TonClient4Adapter(network, apiKey);
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

