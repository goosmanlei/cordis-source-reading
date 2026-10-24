// 01 · ReportDesk：从本次插件装载开始累计收到的完成事件。
import type { Context } from "cordis";
import type { ReportCompleted } from "./report-events.ts";

export function statisticsPlugin(ctx: Context): void {
    let count = 0;
    ctx.on("report/completed", (report: ReportCompleted) => {
        count += 1;
        console.log(`统计：count = ${count}（本次装载以来的完成事件数），report.id = ${report.id}`);
    });
}
