import { z } from 'zod';
import { Address, ExternalAddress, Cell } from '@ton/core';

const accountStatusCodec = z.enum(['uninitialized', 'frozen', 'active', 'non-existing']);

const simpleLibraryCodec = z.object({
  public: z.boolean(),
  root: z.instanceof(Cell)
});

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

const tickTockCodec = z.object({
  tick: z.boolean(),
  tock: z.boolean()
});

const stateInitCodec = z.object({
  splitDepth: z.number().optional(),
  special: tickTockCodec.optional(),
  code: z.instanceof(Cell).optional(),
  data: z.instanceof(Cell).optional(),
  libraries: z.map(z.bigint(), simpleLibraryCodec).optional()
});

const messageCodec = z.object({
  info: commonMessageInfoCodec,
  // init: stateInitCodec.optional(), // todo we don't have init 
  init: z.null(),
  // body: z.instanceof(Cell), // todo we don't have body
  body: z.null()
});

const transactionCodec = z.object({
  address: z.bigint(),
  lt: z.bigint(),
  prevTransactionHash: z.bigint(),
  prevTransactionLt: z.bigint(),
  now: z.number(),
  outMessagesCount: z.number(),
  oldStatus: accountStatusCodec,
  endStatus: accountStatusCodec,
  inMessage: messageCodec.optional(),
  // outMessages: z.record(z.number(), messageCodec), // dictionary ??
  outMessages: z.null(), // dictionary ??
  totalFees: z.object({
    coins: z.bigint(),
    other: z.map(z.number(), z.bigint()).optional()
  }),
  stateUpdate: z.object({
    newHash: z.instanceof(Uint8Array),
    oldHash: z.instanceof(Uint8Array),
  }),
  description: z.object({
    type: z.string(),

  }),
  // raw: z.instanceof(Cell), // todo we don't have raw Cell
  raw: z.null(),
  hash: z.function().returns(z.instanceof(Uint8Array)),
});



export const accountTransactionsCodec = z.array(z.object({
  block: z.object({
    workchain: z.number(),
    seqno: z.number(),
    shard: z.string(),
    rootHash: z.string(),
    fileHash: z.string()
  }),
  tx: transactionCodec,
}));

export type AccountTransactions = z.infer<typeof accountTransactionsCodec>;

const blocksCodec = z.array(z.object({
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