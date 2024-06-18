import { AbstractProvider } from './abstract-provider';
import type { RunAction } from './abstract-provider';
import HttpFetchClient from '~core/utils/http-fetch-client';
import { Network } from '~core/types/network';

export type JsonRpcApiProviderOptions = {
  network: Network;
  baseURL?: string;
  httpFetchClient?: HttpFetchClient;
};
export class JsonRpcProvider extends AbstractProvider {
  #httpFetchClient: HttpFetchClient;
  #nextId = 1;
  #network: Network;
  constructor() {
    super();
  }

  init(options: JsonRpcApiProviderOptions) {
    if (options.httpFetchClient) {
      this.#httpFetchClient = options.httpFetchClient;
    } else {
      this.#httpFetchClient = new HttpFetchClient({
        baseURL: options.baseURL,
      });
    }
    this.#network = options.network;
    this.#nextId = 1;
  }

  async _send(payload: any): Promise<any> {
    const response = await this.#httpFetchClient.send(payload);
    return response;
  }

  send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
    return this._send({ method, params, id: this.#nextId++, jsonrpc: '2.0' });
  }

  getRpcRequest(
    action: RunAction
  ): null | { method: string; params: Array<any> | Record<string, any> } {
    switch (action.method) {
      case 'getMasterchainInfo':
        return {
          method: 'getMasterchainInfo',
          params: [],
        };
      default:
        return null;
    }
  }

  async _perform(action: RunAction): Promise<any> {
    const request = this.getRpcRequest(action);
    if (request) {
      return await this.send(request.method, request.params);
    }
    return super._perform(action);
  }
}
