import { z } from 'zod';

export const sendCodec = z.object({
  status: z.number()
});

export type Send = z.infer<typeof sendCodec>;