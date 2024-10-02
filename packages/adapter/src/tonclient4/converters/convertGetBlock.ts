import { Address } from '@ton/core';
import { GetBlockTransactionsResponse, Block, ShardsResponse, RpcInputs, SeqnoSet } from '../types';
import { convertHexShardToSignedNumberStr } from '../utils'

export function convertGetBlockTransactionsInputs(seqno: number, data: ShardsResponse): RpcInputs<SeqnoSet> {
  if (!data.ok) {
    return []
  }

  return [
    {
      method: "getBlockTransactions",
      params: {
        workchain: -1,
        shard: "8000000000000000",
        seqno,
      } 
    },    
    ...data.result.shards.map(({ workchain, shard, seqno }) => ({
      method: "getBlockTransactions",
      params: {
        workchain,
        shard,
        seqno,
      }
    })),
  ]
}

export function convertGetBlock(transactionsData: GetBlockTransactionsResponse[]): Block {
  if (transactionsData.length === 0) {
    return {
      exist: false
    }
  }
  return {
    exist: true,
    block: {
      shards: transactionsData.map(data => {
        const id = data.result.id;
        const transactions = data.result.transactions.map(t => ({
          account: Address.parse(t.account).toString(),
          hash: t.hash,
          lt: t.lt,
        }));

        return {
          workchain: id.workchain,
          shard: convertHexShardToSignedNumberStr(id.shard),
          seqno: id.seqno,
          rootHash: id.root_hash,
          fileHash: id.file_hash,
          transactions
        }
      })
    }
  }
}