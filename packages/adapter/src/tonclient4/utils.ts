export function getJsonRpcUrl(network: string, apiKey: string) {
    return `https://${network}-rpc.tonxapi.com/v2/json-rpc/${apiKey}`
}

export function getRestUrl(path: string, network: string, apiKey: string) {
    return `https://${network}-rpc.tonxapi.com/v2/api/${path}/${apiKey}`
}