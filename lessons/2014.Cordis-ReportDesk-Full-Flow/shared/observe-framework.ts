// 01 · 只读快照：供对象图与数据图使用，业务代码不依赖这些内部字段。
import { writeFile } from "node:fs/promises";
import { Context, FiberState, symbols } from "cordis";
import { workspacePlugin } from "../app/workspace.ts";
import { reportProvider } from "../app/report-service.ts";
import { storageProvider } from "../app/storage-service.ts";
import { reportBatch } from "../app/report-batch.ts";
import { sourceLocation } from "./output.ts";

const stateNames: Record<number, string> = {
    [FiberState.PENDING]: "PENDING", [FiberState.LOADING]: "LOADING",
    [FiberState.ACTIVE]: "ACTIVE", [FiberState.FAILED]: "FAILED",
    [FiberState.DISPOSED]: "DISPOSED", [FiberState.UNLOADING]: "UNLOADING",
};

export function frameworkSnapshot(phase: string, app: Context, alphaCtx: Context, betaCtx: Context) {
    const runtimes = [workspacePlugin, storageProvider, reportProvider, reportBatch].map((plugin) => {
        const runtime = app.registry.get(plugin);
        return {
            plugin: plugin.name,
            fibers: runtime ? [...runtime.fibers].map((fiber) => ({
                uid: fiber.uid, workspace: fiber.ctx.workspaceName,
                state: stateNames[fiber.state], parentUid: fiber.parent.fiber.uid,
            })) : [],
        };
    });
    const entries = [alphaCtx, betaCtx].flatMap((ctx) => {
        return (["report", "storage"] as const).map((name) => {
            const key = ctx[symbols.isolate][name];
            const impl = key && app.reflect.store[key];
            return {
                keyAlias: `${name}${ctx.workspaceName === "alpha" ? "Alpha" : "Beta"}`,
                present: !!impl,
                instance: impl ? (impl.value as { instanceId: number }).instanceId : null,
                providerUid: impl?.fiber.uid ?? null,
                dependencies: impl ? Object.keys(impl.fiber.inject) : [],
                storageDependencyInstance: name === "report" && impl?.fiber.store?.storage
                    ? (impl.fiber.store.storage.value as { instanceId: number }).instanceId : null,
            };
        });
    });
    return {
        phase, source: sourceLocation(2), runtimes, entries,
        hooks: {
            format: app.events._hooks["report/format"]?.length ?? 0,
            completed: app.events._hooks["report/completed"]?.length ?? 0,
        },
        rootHasReport: !!app.get("report"), rootHasStorage: !!app.get("storage"),
    };
}

export async function saveFramework(snapshots: ReturnType<typeof frameworkSnapshot>[]): Promise<void> {
    await writeFile("runs/reportdesk/framework.json", JSON.stringify(snapshots, null, 2) + "\n");
    console.log("对象、登记项与监听快照：runs/reportdesk/framework.json（图解对应数据）");
}
