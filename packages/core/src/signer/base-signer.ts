import { AbstractSigner } from "./abstract-signer";
import { KeyPair, sign, sha256 } from "@ton/crypto";
import { beginCell } from "@ton/core";
import {
  TypedDataDomain,
  TypedDataField,
  PrimitiveType,
} from "~core/types/typed-data";

const primitiveTypes: PrimitiveType[] = [
  "slice",
  ...Array.from({ length: 256 }, (_, i) => i + 1).map(
    (i) => `int${i}` as PrimitiveType
  ),
  ...Array.from({ length: 256 }, (_, i) => i + 1).map(
    (i) => `uint${i}` as PrimitiveType
  ),
];

const isPrimitiveType = (type: string): type is PrimitiveType => {
  return primitiveTypes.includes(type as PrimitiveType);
};

// Auxiliary function
const stringTo32BitInt = async (str: string) => {
  const hashString = (await sha256(str)).toString("hex", 0, 4);
  return BigInt(`0x${hashString}`);
};

const bufferToBigInt = (buf: Buffer) => {
  return BigInt(`0x${buf.toString("hex")}`);
};

const linearize = (
  primaryType: string,
  typesMap: Record<
    string,
    {
      type: string;
      value: TypedDataField[];
    }
  >,
  found: string[] = []
) => {
  if (found.includes(primaryType)) {
    return found;
  } else if (typesMap[primaryType] === undefined) {
    return found;
  }

  found.push(primaryType);

  for (const property of typesMap[primaryType].value) {
    for (const child of linearize(property.type, typesMap, found)) {
      if (!found.includes(child)) {
        found.push(child);
      }
    }
  }

  return found;
};

class TypedDataEncoder {
  #typesMap: Record<
    string,
    {
      type: string;
      value: TypedDataField[];
    }
  > = {};
  #primaryType = "";
  constructor({ types }: { types: Record<string, TypedDataField[]> }) {
    const hasParent = new Set();
    for (const [type, fields] of Object.entries(types)) {
      const params = [];
      for (const field of fields) {
        params.push(`${field.type} ${field.name}`);
        if (isPrimitiveType(field.type)) {
          continue;
        }
        hasParent.add(field.type);
      }
      this.#typesMap[type] = {
        type: `${type}(${params.join(",")})`,
        value: fields,
      };
    }

    for (const type of Object.keys(this.#typesMap)) {
      if (!hasParent.has(type)) {
        this.#primaryType = type;
        break;
      }
    }
  }

  #encodeType(primaryType: string) {
    const c3LinearResult = linearize(primaryType, this.#typesMap);

    return c3LinearResult
      .map((eachType) => this.#typesMap[eachType].type)
      .join("");
  }

  async #buildDomainSeparatorHash(domain: TypedDataDomain): Promise<Buffer> {
    return beginCell()
      .storeUint(
        bufferToBigInt(
          await sha256(
            "TEPXXDomain(uint32 name,uint32 version,int8 workchainId,uint256 verifierContract)"
          )
        ),
        256
      )
      .storeUint(await stringTo32BitInt(domain.name), 32)
      .storeUint(await stringTo32BitInt(domain.version), 32)
      .storeInt(domain.workchainId, 8)
      .storeUint(BigInt(domain.verifierContract), 256)
      .endCell()
      .hash();
  }

  async #hash(data: Record<string, any>, type: string): Promise<Buffer> {
    const { value } = this.#typesMap[type];

    const typeHash = await sha256(this.#encodeType(type));
    const c = beginCell();
    c.storeUint(bufferToBigInt(typeHash), 256);

    for (const field of value) {
      switch (true) {
        case field.type.startsWith("int"): {
          const bits = parseInt(field.type.replace("int", ""));
          c.storeInt(BigInt(data[field.name]), bits);
          break;
        }
        case field.type.startsWith("uint"): {
          const bits = parseInt(field.type.replace("uint", ""));
          c.storeUint(BigInt(data[field.name]), bits);
          break;
        }
        case field.type === "slice": {
          c.storeSlice(data[field.name]);
          break;
        }
        default: {
          if (!(field.type in this.#typesMap)) {
            throw new Error(`Unknown type ${field.type}`);
          }
          c.storeUint(
            bufferToBigInt(await this.#hash(data[field.name], field.type)),
            256
          );
          break;
        }
      }
    }

    return c.endCell().hash();
  }

  async hash(domain: TypedDataDomain, value: Record<string, any>) {
    const [domainSeparatorHash, structHash] = await Promise.all([
      this.#buildDomainSeparatorHash(domain),
      this.#hash(value, this.#primaryType),
    ]);

    const hashedData = beginCell()
      .storeUint(0xffff, 16)
      .storeUint(bufferToBigInt(domainSeparatorHash), 256)
      .storeUint(bufferToBigInt(structHash), 256)
      .endCell()
      .hash();

    return hashedData;
  }
}

export class BaseSigner extends AbstractSigner {
  #keyPair: KeyPair;
  constructor({ keyPair }: { keyPair: KeyPair }) {
    super();
    this.#keyPair = keyPair;
  }

  signMessage(message: string | Buffer) {
    return typeof message === "string"
      ? sign(Buffer.from(message), this.#keyPair.secretKey)
      : sign(message, this.#keyPair.secretKey);
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>
  ): Promise<Buffer> {
    const hash = await new TypedDataEncoder({ types }).hash(domain, value);
    return this.signMessage(hash);
  }
}
