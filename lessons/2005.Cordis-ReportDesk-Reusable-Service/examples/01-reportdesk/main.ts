// 01 · ReportDesk：完成参考，同一报告服务连续处理两份输入。
import { Context } from "cordis";
import { reportProvider } from "../../app/report-service.ts";
import { reportBatch } from "../../app/report-batch.ts";
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports } from "../../shared/report.ts";

const jobs = await jobsFromArgs();
await prepareReports();
const app = new Context();
const provider = app.plugin(reportProvider);
try {
    await provider;
    const batch = app.plugin(reportBatch, { jobs });
    try {
        await batch;
    } finally {
        await batch.dispose();
    }
} finally {
    await provider.dispose();
}
