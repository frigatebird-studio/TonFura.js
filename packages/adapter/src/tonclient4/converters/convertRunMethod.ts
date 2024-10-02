import { parseTuple, Cell, TupleReader } from '@ton/core';
import { RunMethod, RunGetMethodResponse, Account } from '../types';

export function convertRunMethod(data: RunGetMethodResponse, accountData: Account): RunMethod {
  const resultRaw = data.result.result_raw;
  let resultTuple = resultRaw ? parseTuple(Cell.fromBoc(Buffer.from(resultRaw, 'base64'))[0]) : [];
  const reader = resultRaw ? new TupleReader(resultTuple): undefined;
  return {
    exitCode: data.result.exit_code,
    // result: resultTuple, // todo we don't have such data
    resultRaw: null, // todo we don't have such data
    reader, // todo we don't have such data
    block: accountData.block,
    shardBlock: {
      workchain: -2, // todo we don't have such data
      seqno: 0, // todo we don't have such data
      shard: '0', // todo we don't have such data
      rootHash: '', // todo we don't have such data
      fileHash: '', // todo we don't have such data
    }, // todo we don't have such data
  }
}