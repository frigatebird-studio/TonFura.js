import { z } from 'zod'
import { TupleReader } from '@ton/core';

export const runMethodCodec = z.object({
  exitCode: z.number(),

  resultRaw: z.union([z.string(), z.null()]),  
  reader: z.instanceof(TupleReader).optional(),
  block: z.object({
    workchain: z.number(),
    seqno: z.number(),
    shard: z.string(),
    rootHash: z.string(),
    fileHash: z.string()
  }),
  shardBlock: z.object({
    workchain: z.number(),
    seqno: z.number(),
    shard: z.string(),
    rootHash: z.string(),
    fileHash: z.string()
  })
});

export type RunMethod = z.infer<typeof runMethodCodec>;