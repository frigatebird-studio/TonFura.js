import { z } from 'zod';
import { lastBlockCodec } from '../types';
import { convertHexShardToSignedNumberStr } from '../utils'

type MasterChainInfoResponse = {
  result: {
    first: {
      file_hash: string
      root_hash: string
    }
    last: {
      file_hash: string
      root_hash: string
      seqno: number
      shard: string
      workchain: number
    }
  }
}

type LastBlock = z.infer<typeof lastBlockCodec>;

export function convertLastBlock(data: MasterChainInfoResponse): LastBlock {
  return {
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
}