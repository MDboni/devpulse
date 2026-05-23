import type { ROLES } from "../../types/index";

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
  role?: ROLES;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IUserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: ROLES;
  created_at: Date;
  updated_at: Date;
}
