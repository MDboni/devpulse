import type { IssueStatus, IssueType, SortOrder } from "../../types/index";

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: IssueType;
}

export interface IUpdateIssuePayload {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
}

export interface IIssueRow {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IIssueListQuery {
  sort?: SortOrder;
  type?: IssueType;
  status?: IssueStatus;
}
