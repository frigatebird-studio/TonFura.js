import TonClient4Adapter from './index';
import { version as packageVersion } from "../../package.json";

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
          shard: '0x80000000',
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
        shard: '-2147483648',
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
          shard: '0x80000000',
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
});