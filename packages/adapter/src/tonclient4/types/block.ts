import { z } from 'zod';

export const blockCodec = z.union([z.object({
  exist: z.literal(false)
}), z.object({
  exist: z.literal(true),
  block: z.object({
    shards: z.array(z.object({
      workchain: z.number(),
      seqno: z.number(),
      shard: z.string(),
      rootHash: z.string(),
      fileHash: z.string(),
      transactions: z.array(z.object({
        account: z.string(),
        hash: z.string(),
        lt: z.string()
      }))
    }))
  })
})]);

export type Block = z.infer<typeof blockCodec>;