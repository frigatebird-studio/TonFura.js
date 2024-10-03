import { Account, Changed } from '../types';

export function convertIsAccountChanged(beforeAccount: Account, afterAccount: Account): Changed {
  return {
    changed: beforeAccount.account.state.type !== afterAccount.account.state.type,
    block: {
      workchain: beforeAccount.block.workchain,
      seqno: beforeAccount.block.seqno,
      shard: beforeAccount.block.shard,
      rootHash: beforeAccount.block.rootHash,
      fileHash: beforeAccount.block.fileHash
    }
  }
}