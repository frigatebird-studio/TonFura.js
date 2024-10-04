import { z } from 'zod';
import { accountStatusCodec, blocksCodec } from './accountTransactions';

const parsedOperationItemCodec = z.union([
  z.object({ kind: z.literal('ton'), amount: z.string() }),
  z.object({ kind: z.literal('token'), amount: z.string() })
]);

const supportedMessageTypeCodec = z.union([
  z.literal('jetton::excesses'),
  z.literal('jetton::transfer'),
  z.literal('jetton::transfer_notification'),
  z.literal('deposit'),
  z.literal('deposit::ok'),
  z.literal('withdraw'),
  z.literal('withdraw::all'),
  z.literal('withdraw::delayed'),
  z.literal('withdraw::ok'),
  z.literal('airdrop')
]);

const txBodyCodec = z.union([
  z.object({ type: z.literal('comment'), comment: z.string() }),
  z.object({ type: z.literal('payload'), cell: z.string() }),
]);

const parsedAddressExternalCodec = z.object({
  bits: z.number(),
  data: z.string()
});

const opCodec = z.object({
  type: supportedMessageTypeCodec,
  options: z.optional(z.record(z.string()))
});

const parsedOperationCodec = z.object({
  address: z.string(),
  comment: z.optional(z.string()),
  items: z.array(parsedOperationItemCodec),
  op: z.optional(opCodec)
});

const parsedMessageInfoCodec = z.union([
  z.object({
      type: z.literal('internal'),
      value: z.string(),
      dest: z.string(),
      src: z.string(),
      bounced: z.boolean(),
      bounce: z.boolean(),
      ihrDisabled: z.boolean(),
      createdAt: z.number(),
      createdLt: z.string(),
      fwdFee: z.string(),
      ihrFee: z.string()
  }),
  z.object({
      type: z.literal('external-in'),
      dest: z.string(),
      src: z.union([parsedAddressExternalCodec, z.null()]),
      importFee: z.string()
  }),
  z.object({
      type: z.literal('external-out'),
      dest: z.union([parsedAddressExternalCodec, z.null()])
  })
]);

const parsedStateInitCodec = z.object({
  splitDepth: z.union([z.number(), z.null()]),
  code: z.union([z.string(), z.null()]),
  data: z.union([z.string(), z.null()]),
  special: z.union([z.object({ tick: z.boolean(), tock: z.boolean() }), z.null()])
});

const parsedMessageCodec = z.object({
  body: z.string(),
  info: parsedMessageInfoCodec,
  init: z.union([parsedStateInitCodec, z.null()])
});

const parsedTransactionCodec = z.object({
  address: z.string(),
  lt: z.string(),
  hash: z.string(),
  prevTransaction: z.object({
      lt: z.string(),
      hash: z.string()
  }),
  time: z.number(),
  outMessagesCount: z.number(),
  oldStatus: accountStatusCodec,
  newStatus: accountStatusCodec,
  fees: z.string(),
  update: z.object({
      oldHash: z.string(),
      newHash: z.string()
  }),
  inMessage: z.union([parsedMessageCodec, z.null()]),
  outMessages: z.array(parsedMessageCodec),
  parsed: z.object({
      seqno: z.union([z.number(), z.null()]),
      body: z.union([txBodyCodec, z.null()]),
      status: z.union([z.literal('success'), z.literal('failed'), z.literal('pending')]),
      dest: z.union([z.string(), z.null()]),
      kind: z.union([z.literal('out'), z.literal('in')]),
      amount: z.string(),
      resolvedAddress: z.string(),
      bounced: z.boolean(),
      mentioned: z.array(z.string())
  }),
  operation: parsedOperationCodec
});

export const parsedTransactionsCodec = z.object({
  blocks: blocksCodec,
  transactions: z.array(parsedTransactionCodec)
});

export type ParsedTransactions = z.infer<typeof parsedTransactionsCodec>