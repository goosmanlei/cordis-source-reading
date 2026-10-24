// 同一应用内发起一批报告；沿用 2006 的一次性 reportBatch 插件。
import type { Context } from "cordis";
import { reportBatch } from "../app/report-batch.ts";
import type { ReportJob } from "./report.ts";

export async function runBatch(app: Context, jobs: ReportJob[], phase: string): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log(`批次 phase = ${phase}（本批仍处理台灯、水杯两份输入）`);
    console.log("-".repeat(60));
    const batchJobs = jobs.map((job) => ({ ...job, id: `${phase}-${job.id}` }));
    const batch = app.plugin(reportBatch, { jobs: batchJobs });
    try {
        await batch;
    } finally {
        await batch.dispose();
    }
}
