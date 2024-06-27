export type RunAction =
  | {
      method: 'getMasterchainInfo';
    }
  | {
      method: string;
      params: Record<string, any>;
    };

// type MasterChainInfo = {
//   workchain: number;
//   shard: number;
//   seqno: number;
// };

export class AbstractProvider {
  constructor() {}
  async _perform<T = any>(action: RunAction): Promise<T> {
    // TODO define error
    throw `${action.method} not implemented`;
  }
  async #perform<T = any>(action: RunAction): Promise<T> {
    const perform = this._perform(action);
    return await perform;
  }

  get provider(): this {
    return this;
  }

  async getMasterChainInfo(): Promise<any> {
    return await this.#perform({ method: 'getMasterchainInfo' });
  }
}
