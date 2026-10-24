// 01 · ReportDesk：撤下和恢复 storage，报告插件保留同一个句柄。
import { Context } from "cordis";
import { storageProvider } from "../../app/storage-service.ts";
import { reportProvider } from "../../app/report-service.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { runBatch } from "../../shared/batch.ts";
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports } from "../../shared/report.ts";
import { observe, saveObservations } from "../../shared/observe.ts";

const jobs = await jobsFromArgs();
await prepareReports();
const app = new Context();
let storage = app.plugin(storageProvider);
const report = app.plugin(reportProvider);
const notification = app.plugin(notificationPlugin);
const statistics = app.plugin(statisticsPlugin);

try {
    await storage;
    await report;
    await notification;
    await statistics;
    await runBatch(app, jobs, "before");
    observe(app, report, "before");

    // 只卸载存储。report 未 dispose，依赖变化由 Cordis 处理。
    await storage.dispose();
    await report;
    observe(app, report, "during");
    await runBatch(app, jobs, "during");

    // 恢复存储后，等待同一个 report 的当前生命周期工作完成。
    storage = app.plugin(storageProvider);
    await storage;
    await report;
    observe(app, report, "restored");
    await runBatch(app, jobs, "after");
    observe(app, report, "after");
    await saveObservations();
} finally {
    await report.dispose();
    await storage.dispose();
    await notification.dispose();
    await statistics.dispose();
}
