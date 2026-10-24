// 01 · ReportDesk：两个独立工作区，关闭 alpha 后 beta 继续保存。
import { Context } from "cordis";
import { workspacePlugin } from "../../app/workspace.ts";
import { reportBatch } from "../../app/report-batch.ts";
import { notificationPlugin } from "../../app/notification-plugin.ts";
import { statisticsPlugin } from "../../app/statistics-plugin.ts";
import { quoteFormat, footerFormat } from "../../app/format-plugins.ts";
import { prepareReports, sampleJobs } from "../../shared/report.ts";
import { originalService, snapshot, saveObservations } from "../../shared/observe-workspaces.ts";
import "../../app/workspace-context.ts";

const jobs = await sampleJobs();
await prepareReports();
const app = new Context();
// 本课共享一组格式与观察插件；普通完成事件仍在整棵应用中广播。
const sharedPlugins = [notificationPlugin, statisticsPlugin, quoteFormat, footerFormat]
    .map((plugin) => app.plugin(plugin));

const alphaCtx = app.isolate("report").isolate("storage").extend({ workspaceName: "alpha" });
const betaCtx = app.isolate("report").isolate("storage").extend({ workspaceName: "beta" });
const alpha = alphaCtx.plugin(workspacePlugin);
const beta = betaCtx.plugin(workspacePlugin);

try {
    for (const plugin of sharedPlugins) await plugin;
    await alpha;
    await beta;
    const betaReport = originalService(betaCtx, "report");
    const betaStorage = originalService(betaCtx, "storage");
    const independentServices = {
        report: originalService(alphaCtx, "report") !== betaReport,
        storage: originalService(alphaCtx, "storage") !== betaStorage,
    };

    // 使用组自己的 Context 安装调用方，使它也归本组管理。
    await alpha.ctx.plugin(reportBatch, { jobs: [jobs[0]!] });
    await beta.ctx.plugin(reportBatch, { jobs: [jobs[0]!] });
    const rows = [snapshot("各写一份", alphaCtx), snapshot("各写一份", betaCtx)];

    await alpha.dispose();
    rows.push(snapshot("关闭 alpha", alphaCtx), snapshot("关闭 alpha", betaCtx));

    await beta.ctx.plugin(reportBatch, { jobs: [jobs[1]!] });
    rows.push(snapshot("beta 再写一份", betaCtx));
    const betaServicesUnchanged = {
        report: originalService(betaCtx, "report") === betaReport,
        storage: originalService(betaCtx, "storage") === betaStorage,
    };
    await beta.dispose();
    await saveObservations({
        rows,
        independentServices,
        betaServicesUnchanged,
        cleanup: { alpha: !alphaCtx.get("report") && !alphaCtx.get("storage"), beta: !betaCtx.get("report") && !betaCtx.get("storage") },
    });
} finally {
    if (beta.uid !== null) await beta.dispose();
    if (alpha.uid !== null) await alpha.dispose();
    for (const plugin of sharedPlugins.reverse()) await plugin.dispose();
}
