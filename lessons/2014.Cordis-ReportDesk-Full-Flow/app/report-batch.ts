// 01 · 调用方只依赖 report；保存仍由 report 自己声明的 storage 完成。
import type { Context } from "cordis";
import type { ReportJob } from "../shared/report.ts";
import { writeReport } from "../shared/report.ts";
import "./report-service.ts";
import "./report-events.ts";

export const reportBatch = {
    name: "report-batch",
    inject: ["report"],
    async apply(ctx: Context, config: { jobs: ReportJob[] }): Promise<void> {
        const reportView = ctx.report;
        for (const job of config.jobs) {
            const markdown = reportView.generate(job.id, job.input);
            const fileId = `${ctx.workspaceName}-${job.id}`;
            await writeReport(fileId, markdown);
            ctx.emit("report/completed", { id: fileId, title: job.input.title });
        }
    },
};
