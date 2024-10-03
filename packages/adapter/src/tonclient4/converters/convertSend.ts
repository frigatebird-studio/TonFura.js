import { Send, SendMessageResponse } from '../types';

export function convertSendMessage(data: SendMessageResponse): Send {
  return {
    status: data.result? 1 : 0, // to check the status value
  }
}