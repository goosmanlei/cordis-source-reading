// 01 · ReportDesk：观察插件卸载与重装的完成参考。
import { Context } from "cordis";
import { reportProvider } from "../../app/report-service.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports } from "../../shared/report.ts";
import { runBatch } from "../../shared/batch.ts";

const jobs = await jobsFromArgs();
await prepareReports();
const app = new Context();
const provider = app.plugin(reportProvider);
let notification = app.plugin(notificationPlugin);
let statistics = app.plugin(statisticsPlugin);

try {
    await provider;
    await notification;
    await statistics;
    await runBatch(app, jobs, "before");

    await notification.dispose();
    await statistics.dispose();
    console.log("观察插件 = 已卸载（等待两个插件的清理完成）");
    await runBatch(app, jobs, "during");

    notification = app.plugin(notificationPlugin);
    statistics = app.plugin(statisticsPlugin);
    await notification;
    await statistics;
    console.log("观察插件 = 已重新装载（新的监听与计数）");
    await runBatch(app, jobs, "after");
} finally {
    await statistics.dispose();
    await notification.dispose();
    await provider.dispose();
}
