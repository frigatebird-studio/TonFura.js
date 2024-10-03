import { z } from 'zod';
import { Address } from '@ton/core';

export const accountStatusCodec = z.enum(['uninitialized', 'frozen', 'active', 'non-existing']);

const commonMessageInfoCodec = z.union([
  z.object({
    type: z.literal('internal'),
    ihrDisabled: z.boolean(),
    bounce: z.boolean(),
    bounced: z.boolean(),
    src: z.instanceof(Address),
    dest: z.instanceof(Address),
    value: z.object({
      coins: z.bigint(),
      other: z.map(z.number(), z.bigint()).optional()
    }),
    ihrFee: z.bigint(),
    forwardFee: z.bigint(),
    createdLt: z.bigint(),
    createdAt: z.number()
  }),
  z.object({
    type: z.literal('external-in'),
    src: z.instanceof(Address).optional(),
    dest: z.instanceof(Address),
    importFee: z.bigint()
  }),
  z.object({
    type: z.literal('external-out'),
    src: z.instanceof(Address),
    dest: z.instanceof(Address).optional(),
    createdLt: z.bigint(),
    createdAt: z.number()
  })
]);

export type CommonMessageInfo = z.infer<typeof commonMessageInfoCodec>;

export const blocksCodec = z.array(z.object({
  workchain: z.number(),
  seqno: z.number(),
  shard: z.string(),
  rootHash: z.string(),
  fileHash: z.string()
}));

export const transactionsCodec = z.object({
  blocks: blocksCodec,
  boc: z.string()
});