// 01 · 只读观察：记录实际进入 generate 的 this，与调用处保存的视图比较。
import { writeFile } from "node:fs/promises";
import type { Context } from "cordis";
import type { ReportService } from "../app/report-service.ts";
import { logDetail } from "./output.ts";

const originalKey = Symbol.for("cordis.original");
const shadowKey = Symbol.for("cordis.shadow");
const callers = new Map<string, { ctx: Context; view: ReportService }>();
const rows: Record<string, unknown>[] = [];
const observed = new Set<string>();
const serviceTargets: { report: ReportService; storage: object }[] = [];

export function rememberCaller(ctx: Context, view: ReportService): void {
    callers.set(ctx.entryLabel, { ctx, view });
}

export function observeMethod(methodThis: ReportService, reportId: string): void {
    const methodCtx = Reflect.get(methodThis, "ctx") as Context;
    if (observed.has(methodCtx.entryLabel)) return;
    observed.add(methodCtx.entryLabel);
    const caller = callers.get(methodCtx.entryLabel)!;
    const original = Reflect.get(methodThis, originalKey) as ReportService;
    const definitionCtx = Reflect.get(methodCtx, shadowKey) as Context;
    const storageView = methodCtx.storage;
    serviceTargets.push({ report: original, storage: Reflect.get(storageView, originalKey) });
    const row = {
        entryLabel: methodCtx.entryLabel,
        reportId,
        methodThisIsReportView: methodThis === caller.view,
        methodThisIsOriginal: methodThis === original,
        originalSameAsViewTarget: original === Reflect.get(caller.view, originalKey),
        methodCtxIsCaller: methodCtx === caller.ctx,
        methodCtxPrototypeIsCaller: Object.getPrototypeOf(methodCtx) === caller.ctx,
        methodCtxOwnsShadow: Object.hasOwn(methodCtx, shadowKey),
        definitionCtxIsOriginalCtx: definitionCtx === Reflect.get(original, "ctx"),
        methodCtxFiberUid: methodCtx.fiber.uid,
        callerFiberUid: caller.ctx.fiber.uid,
        definitionFiberUid: definitionCtx.fiber.uid,
        callerInject: Object.keys(caller.ctx.fiber.inject),
        definitionInject: Object.keys(definitionCtx.fiber.inject),
        callerHasStorageImpl: Object.hasOwn(caller.ctx.fiber.store ?? {}, "storage"),
        definitionHasStorageImpl: Object.hasOwn(definitionCtx.fiber.store ?? {}, "storage"),
        reportInstanceId: methodThis.instanceId,
        storageInstanceId: storageView.instanceId,
        originalContextLabel: (Reflect.get(original, "ctx") as Context).entryLabel,
    };
    rows.push(row);
    logDetail("\n方法调用观察（同一入口只记录第一次 generate；字段解释见 M3）：");
    for (const [expression, value] of Object.entries(row)) {
        logDetail(`${expression} = ${JSON.stringify(value)}`);
    }
}

export async function saveObservations(app: Context): Promise<void> {
    const report = app.get("report")!;
    const storage = app.get("storage")!;
    const [manual, scheduled] = serviceTargets;
    if (!manual || !scheduled || serviceTargets.length !== 2) {
        throw new Error("两入口对照需要 manual 和 scheduled 各完成一次方法观察。");
    }
    const sharedServices = {
        report: manual.report === scheduled.report,
        storage: manual.storage === scheduled.storage,
    };
    await writeFile("runs/reportdesk/observations.json", JSON.stringify({
        calls: rows,
        sharedServices,
        reportInstanceId: report.instanceId,
        storageInstanceId: storage.instanceId,
        storageIds: storage.ids(),
    }, null, 2) + "\n");
    console.log("\n两入口对照：每个入口取第一次 generate 中的实际值");
    console.table(Object.fromEntries(rows.map((row) => [String(row.entryLabel), {
        "this.ctx.entryLabel": row.entryLabel,
        "this.instanceId（report）": row.reportInstanceId,
        "this.ctx.storage.instanceId": row.storageInstanceId,
    }])));
    console.log(`同一底层对象（引用比较）：report = ${sharedServices.report}，storage = ${sharedServices.storage}`);
    console.log(`已保存 ${storage.ids().length} 份报告至 runs/reportdesk/；this 与 Context 的完整比较见 observations.json。`);
    logDetail(`storage.ids() = ${JSON.stringify(storage.ids())}（两个入口的四份报告）`);
}
