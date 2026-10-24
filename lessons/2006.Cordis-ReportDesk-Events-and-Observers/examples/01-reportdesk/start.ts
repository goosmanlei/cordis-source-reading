// 01 · ReportDesk：可编辑起点，修改同目录 observers.ts 后重新运行。
import { Context } from "cordis";
import { reportProvider } from "../../app/report-service.ts";
import { reportBatch } from "../../app/report-batch.ts";
import { notificationPlugin, statisticsPlugin } from "./observers.ts";
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports } from "../../shared/report.ts";

const jobs = await jobsFromArgs();
await prepareReports();
const app = new Context();
const provider = app.plugin(reportProvider);
const notification = app.plugin(notificationPlugin);
const statistics = app.plugin(statisticsPlugin);
try {
    await provider;
    await notification;
    await statistics;
    const batch = app.plugin(reportBatch, { jobs });
    try {
        await batch;
    } finally {
        await batch.dispose();
    }
} finally {
    await statistics.dispose();
    await notification.dispose();
    await provider.dispose();
}
