import { StatusCodes } from "http-status-codes";
import { pool } from "../../db/index";
import AppError from "../../utility/AppError";
import type { ROLES } from "../../types/index";
import type {
  ICreateIssuePayload,
  IIssueListQuery,
  IIssueRow,
  IUpdateIssuePayload,
} from "./issue.interface";

const VALID_TYPES = ["bug", "feature_request"] as const;
const VALID_STATUSES = ["open", "in_progress", "resolved"] as const;
const VALID_SORTS = ["newest", "oldest"] as const;

const createIssueIntoDB = async (
  payload: ICreateIssuePayload,
  reporterId: number,
) => {
  const { title, description, type } = payload;

  if (!title || !description || !type) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "title, description, and type are required.",
    );
  }
  if (title.length > 150) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "title must be 150 characters or fewer.",
    );
  }
  if (description.length < 20) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "description must be at least 20 characters long.",
    );
  }
  if (!VALID_TYPES.includes(type)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "type must be either 'bug' or 'feature_request'.",
    );
  }

  const result = await pool.query<IIssueRow>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, reporterId],
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (query: IIssueListQuery) => {
  const { sort = "newest", type, status } = query;

  if (sort && !VALID_SORTS.includes(sort)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "sort must be either 'newest' or 'oldest'.",
    );
  }
  if (type && !VALID_TYPES.includes(type)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "type must be either 'bug' or 'feature_request'.",
    );
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "status must be one of 'open', 'in_progress', 'resolved'.",
    );
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const issuesResult = await pool.query<IIssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${where}
     ORDER BY created_at ${order}`,
    values,
  );

  const issues = issuesResult.rows;

  if (issues.length === 0) return [];

  const reporterIds = Array.from(new Set(issues.map((i) => i.reporter_id)));
  const placeholders = reporterIds.map((_, idx) => `$${idx + 1}`).join(",");

  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds,
  );

  const userMap = new Map<number, { id: number; name: string; role: ROLES }>();
  for (const row of usersResult.rows) {
    userMap.set(row.id, row);
  }

  return issues.map((issue) => {
    const { reporter_id, ...rest } = issue;
    return {
      ...rest,
      reporter: userMap.get(reporter_id) ?? {
        id: reporter_id,
        name: "Unknown",
        role: "contributor",
      },
    };
  });
};

const getSingleIssueFromDB = async (id: number) => {
  if (!Number.isFinite(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue id.");
  }

  const issueResult = await pool.query<IIssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id=$1`,
    [id],
  );

  const issue = issueResult.rows[0];
  if (!issue) {
    throw new AppError(StatusCodes.NOT_FOUND, "Issue not found.");
  }

  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id],
  );

  const reporter = userResult.rows[0] ?? {
    id: issue.reporter_id,
    name: "Unknown",
    role: "contributor",
  };

  const { reporter_id, ...rest } = issue;
  return { ...rest, reporter };
};

const updateIssueInDB = async (
  id: number,
  payload: IUpdateIssuePayload,
  requester: { id: number; role: ROLES },
) => {
  if (!Number.isFinite(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue id.");
  }

  const existingResult = await pool.query<IIssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id=$1`,
    [id],
  );
  const existing = existingResult.rows[0];
  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Issue not found.");
  }

  const isMaintainer = requester.role === "maintainer";
  const isOwner = existing.reporter_id === requester.id;

  if (!isMaintainer) {
    if (!isOwner) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You can only update your own issues.",
      );
    }
    if (existing.status !== "open") {
      throw new AppError(
        StatusCodes.CONFLICT,
        "You can only update issues that are still 'open'.",
      );
    }
    if (payload.status && payload.status !== existing.status) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Only maintainers can change issue status.",
      );
    }
  }

  const { title, description, type, status } = payload;

  if (title !== undefined && (title.length === 0 || title.length > 150)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "title must be 1-150 characters.",
    );
  }
  if (description !== undefined && description.length < 20) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "description must be at least 20 characters long.",
    );
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "type must be either 'bug' or 'feature_request'.",
    );
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "status must be one of 'open', 'in_progress', 'resolved'.",
    );
  }

  const result = await pool.query<IIssueRow>(
    `UPDATE issues
     SET title       = COALESCE($1, title),
         description = COALESCE($2, description),
         type        = COALESCE($3, type),
         status      = COALESCE($4, status),
         updated_at  = CURRENT_TIMESTAMP
     WHERE id=$5
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [
      title ?? null,
      description ?? null,
      type ?? null,
      status ?? null,
      id,
    ],
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (id: number) => {
  if (!Number.isFinite(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid issue id.");
  }

  const result = await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);

  if (result.rowCount === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "Issue not found.");
  }
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};
