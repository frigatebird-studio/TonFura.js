
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
    const shard = parseInt(hexShard, 16);
    const signedNum = shard > 0x7fffffff ? shard - 0x100000000 : shard;
    return signedNum.toString();
}