export type RpcInputs<T> = {
  method: string,
  params: T
}[]

export type SeqnoSet = {
  workchain: number,
  shard: string,
  seqno: number,
}