import { Todo } from '@prisma/client';

export interface TodoUserTag extends Todo {
  user?: { username: string };
  todoTag: { tag: { tagName: string } }[];
}
