import { Account, AccountLite } from '../types'

export function convertGetAccountLite(data: Account): AccountLite {
  let result: AccountLite;
  const state = data.account.state 
  if(state.type === 'active') {
    result = {
      account: {
        ...data.account,
        state: {
          type: state.type,
          codeHash: state.code || '',
          dataHash: state.data || '',
        },        
      }

    }
  } else {
    result = {
      account: {
        ...data.account,
        state
      }
    }
  }

  return result;
}