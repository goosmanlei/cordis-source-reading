// 观察辅助：只在应用入口用显式 get 查询可用服务，不参与业务依赖注入。
import { writeFile } from "node:fs/promises";
import type { Context } from "cordis";
import "../app/report-service.ts";
import { sourceLocation } from "./output.ts";

const original = Symbol.for("cordis.original");
export function originalService(ctx: Context, name: "report" | "storage"): unknown {
    const service = ctx.get(name);
    return service && Reflect.get(service, original);
}

export function snapshot(phase: string, ctx: Context) {
    const report = ctx.get("report");
    const storage = ctx.get("storage");
    return {
        phase,
        source: sourceLocation(2), // 跳过 snapshot，指向 main.ts 中本次采集的调用处。
        workspace: ctx.workspaceName,
        reportInstance: report?.instanceId ?? null,
        storageInstance: storage?.instanceId ?? null,
        ids: storage?.ids() ?? [],
    };
}

export async function saveObservations(data: {
    rows: ReturnType<typeof snapshot>[];
    independentServices: { report: boolean; storage: boolean };
    betaServicesUnchanged: { report: boolean; storage: boolean };
    cleanup: { alpha: boolean; beta: boolean };
}): Promise<void> {
    await writeFile("runs/reportdesk/observations.json", JSON.stringify(data, null, 2) + "\n");
    console.log(`汇总打印位置：${sourceLocation()} · saveObservations()`);
    console.table(data.rows.map((row) => ({
        "阶段": row.phase,
        "工作区": row.workspace,
        "report 实例": row.reportInstance ?? "已撤下",
        "storage 实例": row.storageInstance ?? "已撤下",
        "storage.ids()": row.ids.join(", ") || "—",
        "采集位置": row.source,
    })));
    console.log(`两组底层对象不同：report = ${data.independentServices.report}，storage = ${data.independentServices.storage}`);
    console.log(`关闭 alpha 后，beta 原对象继续使用：report = ${data.betaServicesUnchanged.report}，storage = ${data.betaServicesUnchanged.storage}`);
    console.log("三份报告及完整观察已写入 runs/reportdesk/；最后关闭 beta 并完成清理。");
}
