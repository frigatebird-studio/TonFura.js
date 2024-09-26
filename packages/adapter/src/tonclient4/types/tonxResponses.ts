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

export type ShardsResponse = {
  ok: boolean
  result: {
    shards: {
      '@type': string
      file_hash: string
      root_hash: string
      seqno: number
      shard: string
      workchain: number
    }[]
  }
}

export type GetBlockTransactionsResponse = {
  result: {
    '@type': string
    id: {
      '@type': string
      file_hash: string
      root_hash: string
      seqno: number
      shard: string
      workchain: number
    }
    incomplete: boolean
    req_count: number
    transactions: {
      '@type': string
      account: string
      hash: string
      lt: string
      mode: number
    }[]
  }
}