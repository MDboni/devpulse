export type ROLES = "contributor" | "maintainer";

export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";
export type SortOrder = "newest" | "oldest";
