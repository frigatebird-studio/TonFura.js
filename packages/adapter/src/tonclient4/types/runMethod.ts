import { z } from 'zod'
import { Cell, TupleReader } from '@ton/core';

const TupleItemNullSchema = z.object({
  type: z.literal('null')
});

const TupleItemIntSchema = z.object({
  type: z.literal('int'),
  value: z.bigint()
});

const TupleItemNaNSchema = z.object({
  type: z.literal('nan')
});

const TupleItemCellSchema = z.object({
  type: z.literal('cell'),
  cell: z.instanceof(Cell)
});

const TupleItemSliceSchema = z.object({
  type: z.literal('slice'),
  cell: z.instanceof(Cell)
});

const TupleItemBuilderSchema = z.object({
  type: z.literal('builder'),
  cell: z.instanceof(Cell)
});

// Lazily define TupleItemSchema
const TupleItemSchema: z.ZodTypeAny = z.union([
  TupleItemNullSchema,
  TupleItemIntSchema,
  TupleItemNaNSchema,
  TupleItemCellSchema,
  TupleItemSliceSchema,
  TupleItemBuilderSchema,
  z.lazy(() => TupleSchema) // Lazily reference TupleSchema
]);

// Define TupleSchema and use lazy reference to TupleItemSchema
const TupleSchema = z.object({
  type: z.literal('tuple'),
  items: z.array(z.lazy(() => TupleItemSchema)) // Lazily reference TupleItemSchema
});


export const runMethodCodec = z.object({
  exitCode: z.number(),

  result: z.array(TupleItemSchema),
  // resultRaw: z.union([z.string(), z.null()]),  
  resultRaw: z.undefined(), // todo we don't have such data
  reader: z.instanceof(TupleReader).optional(),
  block: z.object({
    workchain: z.number(),
    seqno: z.number(),
    shard: z.string(),
    rootHash: z.string(),
    fileHash: z.string()
  }),
  // shardBlock: z.object({
  //   workchain: z.number(),
  //   seqno: z.number(),
  //   shard: z.string(),
  //   rootHash: z.string(),
  //   fileHash: z.string()
  // })
  shardBlock: z.undefined(), // todo we don't have such data
});

export type RunMethod = z.infer<typeof runMethodCodec>;