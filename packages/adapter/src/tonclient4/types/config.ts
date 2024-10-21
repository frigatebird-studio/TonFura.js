import { z } from 'zod';

export const configCodec = z.object({
  config: z.object({
      cell: z.string(),
      address: z.string(), 
      globalBalance: z.object({
          coins: z.string() 
      })
  })
});

export type Config = z.infer<typeof configCodec>;