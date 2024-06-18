import axios from 'axios';
import type { AxiosInstance, CreateAxiosDefaults } from 'axios';

export type HttpFetchClientOptions = CreateAxiosDefaults;

export default class HttpFetchClient {
  client: AxiosInstance;
  constructor(options: HttpFetchClientOptions) {
    this.client = axios.create(options);
  }

  async send(payload: any): Promise<any> {
    const response = await this.client.post('/', payload);
    if (response.status !== 200) throw new Error('Request failed');
    return response.data.result;
  }
}
