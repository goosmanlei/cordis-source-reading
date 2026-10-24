// 01 · ReportDesk：完成参考，先装观察插件再处理报告。
import { Context } from "cordis";
import { reportProvider } from "../../app/report-service.ts";
import { reportBatch } from "../../app/report-batch.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
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
