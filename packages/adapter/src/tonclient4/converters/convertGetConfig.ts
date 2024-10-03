import { GetConfigParamResponse, Config } from '../types';

export function convertGetConfig(data: GetConfigParamResponse): Config {
  return {
    config: {
      cell: data.result.config.bytes,
      address: "", // todo we don't have such data
      globalBalance: {
        coins: "" // todo we don't have such data
      }
    }
  }
}