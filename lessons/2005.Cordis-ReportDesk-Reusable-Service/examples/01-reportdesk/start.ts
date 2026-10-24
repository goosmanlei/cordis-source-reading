// 01 · ReportDesk：建设起点，先直接调用，再按 Notebook M2 改成服务装配。
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports, renderReport, writeReport } from "../../shared/report.ts";

const jobs = await jobsFromArgs();
await prepareReports();
for (const job of jobs) {
    console.log(`直接调用 renderReport(job.input)：job.id = ${job.id}`);
    const markdown = renderReport(job.input);
    await writeReport(job.id, markdown);
}
