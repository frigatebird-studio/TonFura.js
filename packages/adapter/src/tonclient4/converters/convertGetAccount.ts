import { GetAddressInformationResponse, Account } from '../types'
import { convertHexShardToSignedNumberStr } from '../utils'

export function convertGetAccount(data: GetAddressInformationResponse): Account {
  let state = {
    type: 'uninit'
  } as Account['account']['state']
  if(data.result.state !== 'uninit') {
    if(data.result.state === 'active') {
      state = {
        type: data.result.state,
        code: data.result.code,
        data: data.result.data
      }
    } else {
      state = {
        type: data.result.state,
        stateHash: data.result.frozen_hash
      }
    }
  }

  return {
    account: {
      state,
      balance: {
        coins: data.result.balance
      },
      last: {
        lt: data.result.last_transaction_id.lt,
        hash: data.result.last_transaction_id.hash
      },
      storageStat: null
    },
    block: {
      workchain: data.result.block_id.workchain,
      seqno: data.result.block_id.seqno,
      shard: convertHexShardToSignedNumberStr(data.result.block_id.shard),
      rootHash: data.result.block_id.root_hash,
      fileHash: data.result.block_id.file_hash
    }
  }
}