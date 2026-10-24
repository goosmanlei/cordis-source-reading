// 01 · ReportDesk：报告服务保存到内存，辅助导出快照后发出完成事件。
import { logDetail } from "../shared/output.ts";
import type { Context } from "cordis";
import type { ReportJob } from "../shared/report.ts";
import type { ReportCompleted } from "./report-events.ts";
import { writeReport } from "../shared/report.ts";
import { rememberCaller } from "../shared/observe-call.ts";

export const reportBatch = {
    name: "report-batch",
    inject: ["report"],
    async apply(ctx: Context, config: { jobs: ReportJob[] }): Promise<void> {
        const reportView = ctx.report;
        // 只读保存调用方和视图，供方法入口比较对象身份。
        rememberCaller(ctx, reportView);
        for (const job of config.jobs) {
            const markdown = reportView.generate(job.id, job.input);
            await writeReport(job.id, markdown);
            const completed: ReportCompleted = { id: job.id, title: job.input.title };
            logDetail(`ctx.emit：name = report/completed，completed.id = ${completed.id}（报告已写入）`);
            ctx.emit("report/completed", completed);
            logDetail(`ctx.emit 已返回：completed.id = ${completed.id}`);
        }
    },
};
