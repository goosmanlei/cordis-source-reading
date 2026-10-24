// 01 · ReportDesk：一个调用方通过 report 服务处理两份输入。
import type { Context } from "cordis";
import type { ReportJob } from "../shared/report.ts";
import { writeReport } from "../shared/report.ts";

export const reportBatch = {
    name: "report-batch",
    inject: ["report"],
    async apply(ctx: Context, config: { jobs: ReportJob[] }): Promise<void> {
        const report = ctx.report;
        console.log(`reportBatch：取得 report.name = ${report.name}（已声明的服务）`);
        for (const job of config.jobs) {
            console.log(`report.generate(job.input)：job.id = ${job.id}，title = ${job.input.title}`);
            const markdown = report.generate(job.input);
            await writeReport(job.id, markdown);
        }
    },
};
