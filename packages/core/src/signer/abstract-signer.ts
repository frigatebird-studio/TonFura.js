import { TypedDataDomain, TypedDataField } from "~core/types/typed-data";

export abstract class AbstractSigner {
  constructor() {}

  abstract signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, any>
  ): Promise<Buffer>;
}
