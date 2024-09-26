export type MasterChainInfoResponse = {
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