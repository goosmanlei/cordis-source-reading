// M3.3.2 · 示例 02 · 根 Context 装配与方法转发：一个场景，两张对象快照。
export default async function inspectAssembly({ Context }) {
    const root = new Context();
    const original = Symbol.for("cordis.original");
    // 调试用：拿到真正保存数据的管理对象，避开访问时生成的代理视图。
    const registry = root.registry[original];
    const reflect = root.reflect[original];
    const before = {
        root: "C0",
        rootPointsToSelf: root.root === root,
        rootFiber: { id: "F0", uid: root.fiber.uid, runtime: root.fiber.runtime },
        registryEntries: registry.size,
        pluginEntry: reflect.props.plugin.type,
        rootDisposables: root.fiber._disposables.length,
        eventNames: Object.keys(root.events._hooks),
        loggerExporters: root.logger.exporters.size,
    };
    console.log("02 · A：new Context() 完成后的数据（尚未装入插件）");
    console.log(JSON.stringify(before, null, 4));

    // C1 是派生入口：同一个根、同一个根 Fiber，增加一个便于观察的 label。
    const branch = root.extend({ label: "branch-A" });
    /** @type {any} 由 leaf 回调记录本次收到的 Context。 */
    let receivedContext;
    let receivedConfig;
    const leaf = (ctx, config) => {
        receivedContext = ctx;
        receivedConfig = config;
    };
    // 跟踪重点：入口从 C1 发起，因此新 Fiber 的 parent 应为 C1。
    const fiber = await branch.plugin(leaf, { message: "hello" });
    if (!receivedContext) throw new Error("leaf 尚未执行，无法生成插件上下文快照。");
    const runtime = registry.get(leaf);
    const contexts = new Map([[root, "C0：root"], [branch, "C1：branch"], [fiber.ctx, "C2：插件上下文"]]);
    const label = (ctx) => contexts.get(ctx) ?? "未标记的对象";
    const after = {
        registryShared: branch.registry[original] === registry,
        registryStoredCtx: label(registry.ctx),
        registryViewCtx: label(branch.registry.ctx),
        fiberParent: label(fiber.parent),
        fiberCtx: label(fiber.ctx),
        callbackCtx: label(receivedContext),
        pluginRoot: label(receivedContext.root),
        inheritedLabel: receivedContext.label,
        config: receivedConfig,
        registryEntries: registry.size,
        runtimeFibers: [...runtime.fibers].map((item) => ({ uid: item.uid, isThisFiber: item === fiber })),
    };
    console.log("\n02 · B：一次 branch.plugin() 完成后的引用与登记数据");
    console.log(JSON.stringify(after, null, 4));
    // 运行入口为独立进程；这里释放本例插件，快照记录的是释放前状态。
    await fiber.dispose();
    return { before, after };
}
