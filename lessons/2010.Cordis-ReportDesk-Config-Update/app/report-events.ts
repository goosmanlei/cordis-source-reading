import type { ReportInput } from "../shared/report.ts";

// 01 · ReportDesk：报告成功写入之后，对外公布的完成信息。
export interface ReportCompleted {
    id: string;
    title: string;
}

declare module "cordis" {
    interface Events {
        "report/format"(input: ReportInput, next: () => string): string;
        "report/completed"(report: ReportCompleted): void;
    }
}
