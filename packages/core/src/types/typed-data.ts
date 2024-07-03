export type TypedDataDomain = {
  name: string;

  version: string;

  workchainId: number;

  verifierContract: string;
};

type LessThan<N extends number, A extends any[] = []> = N extends A["length"]
  ? A[number]
  : LessThan<N, [...A, A["length"]]>;
type RangeOf<F extends number, T extends number> = Exclude<
  T | LessThan<T>,
  LessThan<F>
>;

export type PrimitiveType =
  | `int${RangeOf<0, 256>}`
  | `uint${RangeOf<0, 256>}`
  | "slice";

export type TypedDataField = { name: string; type: string };
