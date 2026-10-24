// 示例 02 · M1.2.3 · shadow 的应用：服务保留自己的依赖，同时跟随调用位置。
import * as cordis from "../materials/cordis/src/index.ts";
import { isDirectEntry } from "../shared/is-direct-entry.mjs";

export default async function inspectShadowApplication({ Context, Service, symbols } = cordis) {
    const root = new Context();
    /** @type {any} 插件回调初始化，供后面的对象身份观察使用。 */
    let reportDefinitionCtx;
    /** @type {any} 原始服务引用，仅用于与访问视图比较。 */
    let originalReport;
    let storageFiber, reportFiber, callerA, callerB;

    // 只在内存中返回字符串，不访问磁盘或外部存储。
    function storagePlugin(ctx) {
        ctx.provide("storage", {
            save(text) { return `已保存：${text}`; },
        });
    }

    // Service 会登记服务，并声明 ctx 是需要包装的上下文字段。
    class ReportService extends Service {
        constructor(ctx) { super(ctx, "report"); }
        render(text) {
            const methodCtx = this.ctx;
            console.log("方法 ctx 的 shadow 是报告服务定义位置：",
                methodCtx[symbols.shadow] === reportDefinitionCtx);
            console.log("方法 ctx 的原型标签（使用位置）：",
                Object.getPrototypeOf(methodCtx).requestLabel);
            // storage 按定义位置的依赖声明解析；requestLabel 沿使用位置读取。
            return `${methodCtx.requestLabel} / ${methodCtx.storage.save(text)}`;
        }
    }
    function reportPlugin(ctx) {
        reportDefinitionCtx = ctx;
        originalReport = new ReportService(ctx);
    }
    reportPlugin.inject = ["storage"];

    function callerPlugin(ctx) {
        // 调用方只声明 report；直接读取 storage 故意触发错误，由本例捕获。
        try {
            ctx.storage;
            throw new Error("预期的 storage 依赖检查未发生");
        } catch (error) {
            if (!error.message.includes('cannot get property "storage" without inject')) throw error;
            console.log(`${ctx.requestLabel} 直接访问 storage（预期失败）：`, error.message);
        }
        console.log("通过 report.render 调用（应成功并带上本次标签）：",
            ctx.report.render("一份报告"));
        console.log("两次访问使用同一个原始 report 对象：",
            ctx.report[symbols.original] === originalReport);
    }
    callerPlugin.inject = ["report"];

    try {
        storageFiber = await root.plugin(storagePlugin);
        reportFiber = await root.plugin(reportPlugin);
        callerA = await root.extend({ requestLabel: "请求 A" }).plugin(callerPlugin);
        callerB = await root.extend({ requestLabel: "请求 B" }).plugin(callerPlugin);
        console.log("原始 report.ctx 仍是定义位置，未被调用方覆盖：",
            originalReport.ctx === reportDefinitionCtx);
        console.log("定义位置本身没有 requestLabel：",
            !("requestLabel" in reportDefinitionCtx));
    } finally {
        // 按使用者到提供者的顺序释放，重复运行不会留下插件实例。
        await callerB?.dispose();
        await callerA?.dispose();
        await reportFiber?.dispose();
        await storageFiber?.dispose();
    }
}

if (isDirectEntry(import.meta.url)) {
    await inspectShadowApplication();
}
