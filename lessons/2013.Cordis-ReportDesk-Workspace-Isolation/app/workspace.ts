// 01 · 插件组：同一份插件代码在两个工作区各执行一次。
import type { Context } from "cordis";
import { storageProvider } from "./storage-service.ts";
import { reportProvider } from "./report-service.ts";

export async function workspacePlugin(ctx: Context): Promise<void> {
    const storage = ctx.plugin(storageProvider);
    await storage;
    const report = ctx.plugin(reportProvider, { excerptLength: 8 });
    await report;
    // 子插件已登记到本组 Fiber 的资源列表；关闭组时由 Cordis 释放。
}
