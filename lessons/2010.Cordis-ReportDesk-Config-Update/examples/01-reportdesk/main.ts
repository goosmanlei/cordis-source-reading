// 01 · ReportDesk：同一插件 Fiber 更新一次摘录长度。
import { Context } from "cordis";
import { storageProvider } from "../../app/storage-service.ts";
import { reportProvider } from "../../app/report-service.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { quoteFormat, footerFormat } from "../../app/format-plugins.ts";
import { runBatch } from "../../shared/batch.ts";
import { prepareReports, sampleJobs } from "../../shared/report.ts";
import { observe, saveObservations } from "../../shared/observe.ts";

const jobs = await sampleJobs();
await prepareReports();
const app = new Context();
const storage = app.plugin(storageProvider);
const initialConfig = { excerptLength: 20 };
const report = app.plugin(reportProvider, initialConfig);
const notification = app.plugin(notificationPlugin);
const statistics = app.plugin(statisticsPlugin);
const quote = app.plugin(quoteFormat);
const footer = app.plugin(footerFormat);

try {
    await storage;
    await report;
    await notification;
    await statistics;
    await quote;
    await footer;

    await runBatch(app, jobs, "before");
    observe(app, report, "before");

    const nextConfig = { excerptLength: 8 };
    console.log("\n更新入口：await report.update({ excerptLength: 8 })");
    await report.update(nextConfig);

    await runBatch(app, jobs, "after");
    observe(app, report, "after");
    await saveObservations();
} finally {
    await report.dispose();
    await storage.dispose();
    await quote.dispose();
    await footer.dispose();
    await notification.dispose();
    await statistics.dispose();
}
