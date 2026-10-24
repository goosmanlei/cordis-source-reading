// 01 · ReportDesk：报告服务保存到内存，辅助导出快照后发出完成事件。
import type { Context } from "cordis";
import type { ReportJob } from "../shared/report.ts";
import type { ReportCompleted } from "./report-events.ts";
import { writeReport } from "../shared/report.ts";
import { observeView } from "../shared/observe-view.ts";

export const reportBatch = {
    name: "report-batch",
    inject: ["report"],
    async apply(ctx: Context, config: { jobs: ReportJob[] }): Promise<void> {
        const reportView = ctx.report;
        // 观察辅助与业务循环分开；两次读取产生的视图可以指向同一实现。
        observeView(ctx, reportView, ctx.report);
        for (const job of config.jobs) {
            const markdown = reportView.generate(job.id, job.input);
            await writeReport(job.id, markdown);
            const completed: ReportCompleted = { id: job.id, title: job.input.title };
            console.log(`ctx.emit：name = report/completed，completed.id = ${completed.id}（报告已写入）`);
            ctx.emit("report/completed", completed);
            console.log(`ctx.emit 已返回：completed.id = ${completed.id}`);
        }
    },
};
