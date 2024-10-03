import { RpcInputs, Network } from './types';

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

export function convertRawAddressToDecimalBigInt(address: string) {
    const addressStr = address.split(':').pop();
    if (!addressStr) {
        throw new Error('Invalid address format');
    }
    const decimalAddress = BigInt(`0x${addressStr}`);
    return decimalAddress;
}

export function decodeBase64ToDecimal(base64Str: string) {
    const buffer = Buffer.from(base64Str, 'base64');
    const hexStr = buffer.toString('hex');
    const decimalNumber = BigInt(`0x${hexStr}`);
    return decimalNumber;
}

export function decodeBase64ToUnit8Array(base64Str: string) {
    const binaryString = Buffer.from(base64Str, 'base64').toString('binary');
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function toUrlSafe(src: string) {
    while (src.indexOf('/') >= 0) {
        src = src.replace('/', '_');
    }
    while (src.indexOf('+') >= 0) {
        src = src.replace('+', '-');
    }
    while (src.indexOf('=') >= 0) {
        src = src.replace('=', '');
    }
    return src;
}

export function getTonhubDomain(network: Network) {
    if (network === 'mainnet') {
        return 'https://mainnet-v4.tonhubapi.com';
    } else if (network === 'testnet') {
        return 'https://testnet-v4.tonhubapi.com';
    } else {
        throw new Error('Invalid network');
    }
}