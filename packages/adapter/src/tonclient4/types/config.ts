import { z } from 'zod';

export const configCodec = z.object({
  config: z.object({
      cell: z.string(),
      address: z.string(), // todo we don't have such data
      globalBalance: z.object({ // todo we don't have such data
          coins: z.string() 
      })
  })
});

export type Config = z.infer<typeof configCodec>;