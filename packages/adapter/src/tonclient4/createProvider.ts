/**
 * Copyright (c) Whales Corp. 
 * All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * The MIT License (MIT)
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Address, beginCell, Cell, comment, Contract, ContractProvider, ContractState, external, openContract, OpenedContract, StateInit, storeMessage, toNano, Transaction, TupleReader } from "@ton/core";
import type { default as TonClient4Adapter } from "./index";

type Maybe<T> = T | null | undefined;

export function createProvider(client: TonClient4Adapter, block: number | null, address: Address, init: StateInit | null): ContractProvider {
  return {
      async getState(): Promise<ContractState> {

          // Resolve block
          let sq = block;
          if (sq === null) {
              let res = await client.getLastBlock();
              sq = res.last.seqno;
          }

          // Load state
          let state = await client.getAccount(sq, address);

          // Convert state
          let last = state.account.last ? { lt: BigInt(state.account.last.lt), hash: Buffer.from(state.account.last.hash, 'base64') } : null;
          let storage: {
              type: 'uninit';
          } | {
              type: 'active';
              code: Maybe<Buffer>;
              data: Maybe<Buffer>;
          } | {
              type: 'frozen';
              stateHash: Buffer;
          };
          if (state.account.state.type === 'active') {
              storage = {
                  type: 'active',
                  code: state.account.state.code ? Buffer.from(state.account.state.code, 'base64') : null,
                  data: state.account.state.data ? Buffer.from(state.account.state.data, 'base64') : null,
              };
          } else if (state.account.state.type === 'uninit') {
              storage = {
                  type: 'uninit',
              };
          } else if (state.account.state.type === 'frozen') {
              storage = {
                  type: 'frozen',
                  stateHash: Buffer.from(state.account.state.stateHash, 'base64'),
              };
          } else {
              throw Error('Unsupported state');
          }

          return {
              balance: BigInt(state.account.balance.coins),
              last: last,
              state: storage
          };
      },
      async get(name, args) {
          let sq = block;
          if (sq === null) {
              let res = await client.getLastBlock();
              sq = res.last.seqno;
          }
          let method = await client.runMethod(sq, address, name, args);
          if (method.exitCode !== 0 && method.exitCode !== 1) {
              throw Error('Exit code: ' + method.exitCode);
          }
          return {
              stack: new TupleReader(method.result),
          };
      },
      async external(message) {

          // Resolve last
          let last = await client.getLastBlock();

          // Resolve init
          let neededInit: StateInit | null = null;
          if (init && (await client.getAccount(last.last.seqno, address)).account.state.type !== 'active') {
              neededInit = init;
          }

          // Send with state init
          const ext = external({
              to: address,
              init: neededInit,
              body: message
          });
          let pkg = beginCell()
              .store(storeMessage(ext))
              .endCell()
              .toBoc();
          await client.sendMessage(pkg);
      },
      async internal(via, message) {

          // Resolve last
          let last = await client.getLastBlock();

          // Resolve init
          let neededInit: StateInit | null = null;
          if (init && (await client.getAccount(last.last.seqno, address)).account.state.type !== 'active') {
              neededInit = init;
          }

          // Resolve bounce
          let bounce = true;
          if (message.bounce !== null && message.bounce !== undefined) {
              bounce = message.bounce;
          }

          // Resolve value
          let value: bigint;
          if (typeof message.value === 'string') {
              value = toNano(message.value);
          } else {
              value = message.value;
          }

          // Resolve body
          let body: Cell | null = null;
          if (typeof message.body === 'string') {
              body = comment(message.body);
          } else if (message.body) {
              body = message.body;
          }

          // Send internal message
          await via.send({
              to: address,
              value,
              bounce,
              sendMode: message.sendMode,
              init: neededInit,
              body
          });
      },
      open<T extends Contract>(contract: T): OpenedContract<T> {
          return openContract<T>(contract, (args) => createProvider(client, block, args.address, args.init ?? null));
      },
      async getTransactions(address: Address, lt: bigint, hash: Buffer, limit?: number): Promise<Transaction[]> {

        let hashStr = hash.toString('base64');

        // Resolve last
        const useLimit = typeof limit === 'number';
          if (useLimit && limit <= 0) {
              return [];
          }

          // Load transactions
          let transactions: Transaction[] = [];
          do {
              const txs = await client.getAccountTransactions(address, lt, hash);

              const firstTx = txs[0].tx;
              const [firstLt, firstHash] = [firstTx.lt, firstTx.hashV2];
              const needSkipFirst = transactions.length > 0 && firstLt === lt && firstHash === hashStr;
              if (needSkipFirst) {
                  txs.shift();
              }

              if (txs.length === 0) {
                  break;
              }
              const lastTx = txs[txs.length - 1].tx;
              const [lastLt, lastHash] = [lastTx.lt, lastTx.hashV2];
              if (lastLt === lt && lastHash === hashStr) {
                  break;
              }

              transactions.push(...txs.map(tx => tx.tx) as any);
              lt = lastLt;
              hashStr = lastHash;
          } while (useLimit && transactions.length < limit);

          // Apply limit
          if (useLimit) {
              transactions = transactions.slice(0, limit);
          }

          // Return transactions
          return transactions;
      }
  }
}