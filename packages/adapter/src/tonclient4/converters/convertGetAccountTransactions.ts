import { GetTransactionsResponse, AccountTransactions, Message, CommonMessageInfo } from '../types'
import { convertHexShardToSignedNumberStr, convertRawAddressToDecimalBigInt, decodeBase64ToDecimal, decodeBase64ToUnit8Array } from '../utils'
import { Address, ExternalAddress } from '@ton/core';

const getMessageType = (message: {
  ihr_disabled: boolean;
  createdLt?: BigInt;
}) => {
  let type = 'internal';
  if (!message.ihr_disabled) {
    if (message.createdLt) {
      type = 'external-out';
    } else {
      type = 'external-in';
    }
  }

  return type;
}


function getMessageInfo(message: Message): CommonMessageInfo {
  const type = getMessageType(message);

  if (type === 'internal') {
    return {
      type: 'internal',
      ihrDisabled: message.ihr_disabled,
      bounce: message.bounce,
      bounced: message.bounced,
      src: Address.parse(message.source),
      dest: Address.parse(message.destination),
      value: {
        coins: BigInt(message.value),
        other: undefined
      },
      ihrFee: BigInt(message.ihr_fee),
      forwardFee: BigInt(message.fwd_fee),
      createdLt: BigInt(message.created_lt),
      createdAt: Number(message.created_at)
    }
  }
  if (type === 'external-in') {
    return {
      type: "external-in",
      src: Address.parse(message.source),
      dest: Address.parse(message.destination),
      importFee: BigInt(message.import_fee)
    }
  }

  return {
    type: "external-out",
    src: Address.parse(message.source),
    dest: Address.parse(message.destination),
    createdLt: BigInt(message.created_lt),
    createdAt: Number(message.created_at)
  }

}

function getMessage(message: Message) {
  return {
    info: getMessageInfo(message),
    init: null, // todo we don't have init 
    body: null, // todo we don't have body
  }
}



export function convertGetAccountTransactions(data: GetTransactionsResponse): AccountTransactions {


  return data.result.map(transaction => {
    return {
      block: {
        workchain: transaction.block_ref.workchain,
        seqno: transaction.block_ref.seqno,
        shard: convertHexShardToSignedNumberStr(transaction.block_ref.shard),
        rootHash: "", // todo
        fileHash: "", // todo
      },
      tx: { // issue: we don't know what start lt to use 
        address: convertRawAddressToDecimalBigInt(transaction.account),
        lt: BigInt(transaction.lt),
        prevTransactionHash: decodeBase64ToDecimal(transaction.prev_trans_hash),
        prevTransactionLt: BigInt(transaction.prev_trans_lt),
        now: transaction.now,
        outMessagesCount: transaction.out_msgs.out_msgs?.length || 0,
        oldStatus: transaction.orig_status as any,
        endStatus: transaction.end_status as any,
        inMessage: getMessage(transaction.in_msg),
        outMessages: null, // todo should we build boc for dictionary?
        outMessagesV2: transaction.out_msgs.out_msgs?.map(getMessage),
        totalFees: {
          coins: BigInt(transaction.total_fees),
          other: undefined // todo we don't have other for other currencies
        },
        stateUpdate: {
          newHash: decodeBase64ToUnit8Array(transaction.account_state_hash_after),
          oldHash: decodeBase64ToUnit8Array(transaction.account_state_hash_before),
        },
        description: transaction.description, // todo description seems different
        raw: null, // todo we don't have raw Cell
        hash: () => decodeBase64ToUnit8Array(transaction.hash), // to check? we don't have raw so we cannot do () => raw.hash()
        hashV2: transaction.hash,
      }
    }
  })
}