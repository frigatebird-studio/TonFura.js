import { z } from 'zod';

export const changedCodec = z.object({
  changed: z.boolean(),
  block: z.object({
      workchain: z.number(),
      seqno: z.number(),
      shard: z.string(),
      rootHash: z.string(),
      fileHash: z.string()
  })
});

export type Changed = z.infer<typeof changedCodec>;