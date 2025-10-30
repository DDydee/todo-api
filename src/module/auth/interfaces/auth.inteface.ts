export interface CookieRequest extends Request {
  cookies: { [key: string]: string | undefined };
}

export interface Payload {
  sub: number;
  email: string;
  role: string;
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
