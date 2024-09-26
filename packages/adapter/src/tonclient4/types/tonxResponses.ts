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

export type GetAddressInformationResponse = {
  result: {
    balance: string
    code: string
    data: string
    last_transaction_id: {
      "@type": "internal.transactionId",
      lt: string,
      hash: string
    }
    block_id: {
      "@type": "ton.blockIdExt"
      workchain: number
      shard: string
      seqno: number
      root_hash: string
      file_hash: string
    }
    frozen_hash: string
    sync_utime: number
    state: "uninit" | "active" | "frozen"
  }
}