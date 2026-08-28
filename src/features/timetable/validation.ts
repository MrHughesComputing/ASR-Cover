import { validationIssues, importSummary } from "@/db/seed-data";

export type ValidationIssue = {
  code: string;
  severity: "INFO" | "WARNING" | "ACTION_REQUIRED";
  message: string;
};

export function getFirstRunValidation(): ValidationIssue[] {
  const summary = importSummary as Record<string, unknown>;
  const issues: ValidationIssue[] = validationIssues.slice(0, 80).map((issue, index) => ({
    code: `${issue.type}-${index}`,
    severity: issue.severity === "ERROR" ? "ACTION_REQUIRED" : "WARNING",
    message: issue.message,
  }));

  issues.unshift({
    code: "import-summary",
    severity: Number(summary.validationErrors ?? 0) > 0 ? "ACTION_REQUIRED" : "INFO",
    message: `${summary.namedStaffImported ?? 0} named staff imported; ${summary.unclassifiedPeriods ?? 0} periods require admin classification.`,
  });

  return issues;
}
