// 01 · ReportDesk：只关心完成通知的同步观察插件。
import { logDetail } from "../shared/output.ts";
import type { Context } from "cordis";
import type { ReportCompleted } from "./report-events.ts";

export function notificationPlugin(ctx: Context): void {
    ctx.on("report/completed", (report: ReportCompleted) => {
        logDetail(`通知：report.id = ${report.id}，report.title = ${report.title}（已生成并写入）`);
    });
}
