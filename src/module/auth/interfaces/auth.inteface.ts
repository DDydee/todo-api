import { Request } from 'express';

export interface CookieRequest extends Request {
  cookies: { [key: string]: string | undefined };
  user: Payload;
}

export interface Payload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}
