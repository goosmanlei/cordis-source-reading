// 01 · ReportDesk：装上两层格式，随后只卸载页尾格式。
import { Context } from "cordis";
import { storageProvider } from "../../app/storage-service.ts";
import { reportProvider } from "../../app/report-service.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { quoteFormat, footerFormat } from "../../app/format-plugins.ts";
import { runBatch } from "../../shared/batch.ts";
import { jobsFromArgs } from "../../shared/entry.ts";
import { prepareReports } from "../../shared/report.ts";
import { observe, saveObservations } from "../../shared/observe.ts";

const jobs = await jobsFromArgs();
await prepareReports();
const app = new Context();
const storage = app.plugin(storageProvider);
const report = app.plugin(reportProvider);
const notification = app.plugin(notificationPlugin);
const statistics = app.plugin(statisticsPlugin);

try {
    await storage;
    await report;
    await notification;
    await statistics;
    await runBatch(app, jobs, "plain");
    observe(app, report, "plain");

    const quote = app.plugin(quoteFormat);
    await quote;
    const footer = app.plugin(footerFormat);
    await footer;
    try {
        await runBatch(app, jobs, "formatted");
        observe(app, report, "formatted");

        await footer.dispose();
        await runBatch(app, jobs, "without-footer");
        observe(app, report, "without-footer");
        await saveObservations();
    } finally {
        await footer.dispose();
        await quote.dispose();
    }
} finally {
    await report.dispose();
    await storage.dispose();
    await notification.dispose();
    await statistics.dispose();
}
