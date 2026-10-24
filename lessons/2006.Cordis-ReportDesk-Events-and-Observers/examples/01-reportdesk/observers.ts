// 01 · 在两个插件中补入 M2 的监听代码。
import type { Context } from "cordis";
import type { ReportCompleted } from "../../app/report-events.ts";

export function notificationPlugin(ctx: Context): void {
    // 在这里登记 report/completed 的通知回调。
}

export function statisticsPlugin(ctx: Context): void {
    // 在这里声明 count，并登记对同一事件计数的回调。
}
