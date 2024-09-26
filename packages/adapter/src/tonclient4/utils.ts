
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