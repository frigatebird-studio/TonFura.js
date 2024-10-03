import { parseTuple, Cell, TupleReader } from '@ton/core';
import { RunMethod, RunGetMethodResponse, Account } from '../types';

export function convertRunMethod(data: RunGetMethodResponse, accountData: Account): RunMethod {
  const resultRaw = data.result.result_raw;
  let resultTuple = resultRaw ? parseTuple(Cell.fromBoc(Buffer.from(resultRaw, 'base64'))[0]) : [];
  const reader = resultRaw ? new TupleReader(resultTuple): undefined;
  return {
    exitCode: data.result.exit_code,
    result: resultTuple, // todo we don't have such data
    resultV2: data.result.stack,
    resultRaw: undefined, // todo we don't have such data
    reader, // todo we don't have such data
    block: accountData.block,
    shardBlock: undefined, // todo we don't have such data
  }
}