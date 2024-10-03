import { z } from 'zod';

export const lastBlockCodec = z.object({
  last: z.object({
    seqno: z.number(),
    shard: z.string(),
    workchain: z.number(),
    fileHash: z.string(),
    rootHash: z.string()
  }),
  init: z.object({
    fileHash: z.string(),
    rootHash: z.string()
  }),
  stateRootHash: z.string(),
  now: z.number()
});

export type LastBlock = z.infer<typeof lastBlockCodec>;