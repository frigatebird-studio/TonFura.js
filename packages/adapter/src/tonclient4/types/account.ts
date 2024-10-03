import { z } from 'zod';

const storageStatCodec = z.object({
  lastPaid: z.number(),
  duePayment: z.union([z.null(), z.string()]),
  used: z.object({
      bits: z.number(),
      cells: z.number(),
      publicCells: z.number()
  })
});

export const accountCodec = z.object({
  account: z.object({
      state: z.union([
          z.object({ type: z.literal('uninit') }),
          z.object({ type: z.literal('active'), code: z.union([z.string(), z.null()]), data: z.union([z.string(), z.null()]) }),
          z.object({ type: z.literal('frozen'), stateHash: z.string() })
      ]),
      balance: z.object({
          coins: z.string()
      }),
      last: z.union([
          z.null(),
          z.object({
              lt: z.string(),
              hash: z.string()
          })
      ]),
      storageStat: z.union([z.null(), storageStatCodec])
  }),
  block: z.object({
      workchain: z.number(),
      seqno: z.number(),
      shard: z.string(),
      rootHash: z.string(),
      fileHash: z.string()
  })
});

export type Account = z.infer<typeof accountCodec>;
