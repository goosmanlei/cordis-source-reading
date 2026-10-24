// 01 · ReportDesk：跟踪共享报告服务的方法调用与依赖上下文。
import { logDetail } from "../../shared/output.ts";
import { Context } from "cordis";
import { storageProvider } from "../../app/storage-service.ts";
import { reportProvider } from "../../app/report-service.ts";
import { reportBatch } from "../../app/report-batch.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { quoteFormat, footerFormat } from "../../app/format-plugins.ts";
import { prepareReports, sampleJobs } from "../../shared/report.ts";
import { saveObservations } from "../../shared/observe-call.ts";
import "../../app/call-context.ts";

const jobs = await sampleJobs();
await prepareReports();
const app = new Context();
app.entryLabel = "default";
const storage = app.plugin(storageProvider);
const report = app.plugin(reportProvider, { excerptLength: 8 });
const notification = app.plugin(notificationPlugin);
const statistics = app.plugin(statisticsPlugin);
const quote = app.plugin(quoteFormat);
const footer = app.plugin(footerFormat);
const manualCtx = app.extend({ entryLabel: "manual" });
const scheduledCtx = app.extend({ entryLabel: "scheduled" });
let manual: ReturnType<Context["plugin"]> | undefined;
let scheduled: ReturnType<Context["plugin"]> | undefined;

try {
    await storage;
    await report;
    await notification;
    await statistics;
    await quote;
    await footer;

    logDetail("\n" + "=".repeat(60));
    logDetail("入口：manual（模拟手动发起）");
    logDetail("-".repeat(60));
    manual = manualCtx.plugin(reportBatch, {
        jobs: jobs.map((job) => ({ ...job, id: `manual-${job.id}` })),
    });
    await manual;

    logDetail("\n" + "=".repeat(60));
    logDetail("入口：scheduled（模拟定时发起，只执行一次）");
    logDetail("-".repeat(60));
    scheduled = scheduledCtx.plugin(reportBatch, {
        jobs: jobs.map((job) => ({ ...job, id: `scheduled-${job.id}` })),
    });
    await scheduled;
    await saveObservations(app);
} finally {
    await scheduled?.dispose();
    await manual?.dispose();
    await report.dispose();
    await storage.dispose();
    await quote.dispose();
    await footer.dispose();
    await notification.dispose();
    await statistics.dispose();
}
