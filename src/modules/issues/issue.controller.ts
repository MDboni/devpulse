import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";
import AppError from "../../utility/AppError";
import { issueService } from "./issue.service";
import type { IIssueListQuery } from "./issue.interface";

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const reporterId = req.user!.id;
  const issue = await issueService.createIssueIntoDB(req.body, reporterId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Issue created successfully",
    data: issue,
  });
});

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const query: IIssueListQuery = {
    sort: req.query.sort as IIssueListQuery["sort"],
    type: req.query.type as IIssueListQuery["type"],
    status: req.query.status as IIssueListQuery["status"],
  };

  const issues = await issueService.getAllIssuesFromDB(query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issues retrieved successfully",
    data: issues,
  });
});

const getSingleIssue = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const issue = await issueService.getSingleIssueFromDB(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issue retrieved successfully",
    data: issue,
  });
});

const updateIssue = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const requester = req.user;
  if (!requester) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized access.");
  }

  const updated = await issueService.updateIssueInDB(id, req.body, {
    id: requester.id,
    role: requester.role,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issue updated successfully",
    data: updated,
  });
});

const deleteIssue = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await issueService.deleteIssueFromDB(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Issue deleted successfully",
  });
});

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
