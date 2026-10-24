// 01 · ReportDesk：补齐观察插件的卸载与重新装载。
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

    // TODO 1：卸载 notification 和 statistics，并等待清理完成。

    await runBatch(app, jobs, "during");

    // TODO 2：重新装载两个插件，更新句柄并等待就绪。

    await runBatch(app, jobs, "after");
} finally {
    await statistics.dispose();
    await notification.dispose();
    await provider.dispose();
}
