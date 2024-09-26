import { RpcInputs } from './types';

function getDomain(network: string) {
    return `https://${network}-rpc.tonxapi.com`;
}

export function getJsonRpcUrl(network: string, apiKey: string) {
    return `${getDomain(network)}/v2/json-rpc/${apiKey}`
}

export function getRestUrl(path: string, network: string, apiKey: string) {
    return `${getDomain(network)}/v2/api/${path}/${apiKey}`
}

export function convertHexShardToSignedNumberStr(hexShard: string) {
    const num = BigInt(`0x${hexShard}`);

    const signedNum = num >= 2n ** 63n ? num - 2n ** 64n : num;
    return signedNum.toString();
}

export async function sendRpcArray<T, K>(sendRpc: (method: string, params?: any) => Promise<K>, rpcInputs: RpcInputs<T>) {
  let i = 0;
  const data = []
  while (i < rpcInputs.length) {
    const cur = rpcInputs[i];
    // prevent our api fail from TooManyRequest
    await new Promise((r) => { setTimeout(r, 1000) });
    const resData = await sendRpc(cur.method, cur.params);
    data.push(resData);
    i++;
  }

  return data;
}