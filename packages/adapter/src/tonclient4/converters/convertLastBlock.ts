import { LastBlock, MasterChainInfoResponse } from '../types';
import { convertHexShardToSignedNumberStr } from '../utils'

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