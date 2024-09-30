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

export type Message = {
  hash: string;
  source: string;
  source_friendly: string;
  destination: string;
  destination_friendly: string;
  value: string;
  fwd_fee: string;
  ihr_fee: string;
  created_lt: string;
  created_at: string;
  opcode: string;
  ihr_disabled: boolean;
  bounce: boolean;
  bounced: boolean;
  import_fee: string;
  message_content: {
    hash: string;
    body: string;
    decoded: any;
  };
  init_state: {
    hash: string;
    body: string;
  };
};

type AccountState = {
  hash: string;
  account: string;
  balance: string;
  account_status: string;
  frozen_hash: string;
  code_hash: string;
  data_hash: string;
};

type Transaction = {
  account: string;
  account_friendly: string;
  hash: string;
  lt: number;
  now: number;
  orig_status: string;
  end_status: string;
  total_fees: number;
  account_state_hash_before: string;
  account_state_hash_after: string;
  prev_trans_hash: string;
  prev_trans_lt: number;
  description: {
    type: string;
    action: {
      valid: boolean;
      success: boolean;
      no_funds: boolean;
      result_code: number;
      tot_actions: number;
      msgs_created: number;
      spec_actions: number;
      tot_msg_size: {
        bits: string;
      };
      status_change: string;
      total_fwd_fees: string;
      skipped_actions: number;
      action_list_hash: string;
      total_action_fees: string;
    };
    bounce: {
      type: string;
    };
    aborted: boolean;
    credit_ph: {
      credit: string;
      due_fees_collected: string;
    };
    destroyed: boolean;
    compute_ph: {
      mode: number;
      type: string;
      success: boolean;
      gas_fees: string;
      gas_used: string;
      vm_steps: number;
      exit_code: number;
      gas_limit: string;
      gas_credit: string;
      msg_state_used: boolean;
      account_activated: boolean;
      vm_init_state_hash: string;
      vm_final_state_hash: string;
    };
    storage_ph: {
      status_change: string;
      storage_fees_collected: string;
    };
    credit_first: boolean;
  };
  block_ref: {
    workchain: number;
    shard: string;
    seqno: number;
  };
  in_msg: Message;
  out_msgs: {
    out_msgs?: Message[];
  };
  account_state_before: AccountState;
  account_state_after: AccountState;
  trace_id?: string;
};

export type GetTransactionsResponse = {
  result: Transaction[]
}

export type RunGetMethodResponse = {
  result: {
    "@type": string
    gas_used: number
    stack: [string, string][]
    exit_code: number
    "@extra": string
    result_raw?: string // todo we don't have result_raw yet for run_get_method
  }
}

export type SendMessageResponse = {
  result: {
    "@extra": string
    "@type": string 
  }
}