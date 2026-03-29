import { Todo } from '../../../prisma/generated/client.js';

export interface TodoUserTag extends Todo {
  user?: { username: string };
  todoTag: { tag: { tagName: string } }[];
}
