// 01 · 观察辅助：只读视图身份；内部 Symbol 只用于本课固定版本的源码观察。
import { writeFile } from "node:fs/promises";
import type { Context } from "cordis";
import type { ReportService } from "../app/report-service.ts";

const originalSymbol = Symbol.for("cordis.original");
const rows: object[] = [];
let firstOriginal: ReportService | undefined;

export function observeView(ctx: Context, reportView: ReportService, again: ReportService): void {
    const original = Reflect.get(reportView, originalSymbol) as ReportService;
    const viewContext = Reflect.get(reportView, "ctx") as Context;
    const originalContext = Reflect.get(original, "ctx") as Context;
    firstOriginal ??= original;
    const row = {
        entryLabel: ctx.entryLabel,
        callerUid: ctx.fiber.uid,
        callerInject: Object.keys(ctx.fiber.inject),
        sameViewOnRepeatedRead: reportView === again,
        sameOriginalOnRepeatedRead: original === Reflect.get(again, originalSymbol),
        sameOriginalAcrossCallers: original === firstOriginal,
        viewContextIsCaller: viewContext === ctx,
        originalContextIsCaller: originalContext === ctx,
        originalContextLabel: originalContext.entryLabel,
        reportInstanceId: reportView.instanceId,
    };
    rows.push(row);
    console.log("\n视图观察（比较代理身份、共享实现和调用 Context）：");
    for (const [expression, value] of Object.entries(row)) {
        console.log(`${expression} = ${JSON.stringify(value)}`);
    }
}

export async function saveObservations(app: Context): Promise<void> {
    const storage = app.get("storage")!;
    const report = app.get("report")!;
    const result = {
        views: rows,
        reportInstanceId: report.instanceId,
        storageInstanceId: storage.instanceId,
        storageIds: storage.ids(),
    };
    await writeFile("runs/reportdesk/observations.json", JSON.stringify(result, null, 2) + "\n");
    console.log(`storage.ids() = ${JSON.stringify(result.storageIds)}（两个入口共用的存储结果）`);
}
