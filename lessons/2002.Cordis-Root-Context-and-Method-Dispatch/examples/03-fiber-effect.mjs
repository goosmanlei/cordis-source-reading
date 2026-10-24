// M2.2.5 · 示例 03 · Fiber.effect：group 自身资源、嵌套收集与逆序清理。
export default function inspectFiberEffect({ Context }) {
    const root = new Context();
    const fiber = root.fiber;
    // 业务数据由本例维护；effect 负责保存“怎样撤销这些修改”的函数。
    const resources = new Map();
    const cleanupOrder = [];
    const snapshots = [];

    function snapshot(description) {
        const stage = `${snapshots.length + 1} · ${description}`;
        // _disposables 中实际存函数，这里只提取它们的标签与运行时类型。
        // Context.effect 是源码 symbols.effect 对应的 Symbol，用于读取函数上的 meta。
        const state = {
            stage,
            resources: Object.fromEntries(resources),
            fiberDisposables: [...fiber._disposables].map((fn) => ({
                label: fn[Context.effect]?.label ?? "无 effect 标签",
                type: typeof fn,
            })),
            // getEffects() 只提供标签关系。复制它，防止后续修改改变之前的快照。
            effectTree: JSON.parse(JSON.stringify(fiber.getEffects())),
            cleanupOrder: [...cleanupOrder],
        };
        snapshots.push(state);
        console.log("\n" + stage);
        console.log("resources（业务登记表）：", JSON.stringify(state.resources));
        console.log("fiber._disposables（顶层清理函数）：", JSON.stringify(state.fiberDisposables));
        console.log("fiber.getEffects()（标签与嵌套关系）：", JSON.stringify(state.effectTree));
        console.log("cleanupOrder（已执行的业务清理顺序）：", JSON.stringify(state.cleanupOrder));
    }

    // 每调用一次，就建立一个内层 effect：立即登记资源，以后调用返回的入口来清理。
    function register(name) {
        return fiber.effect(() => {
            resources.set(name, "已登记");
            // effect 现在保存这个函数；resources.delete 要到清理阶段才执行。
            return () => {
                resources.delete(name);
                cleanupOrder.push(name);
                snapshot(`清理 ${name} 后`);
            };
        }, name);
    }

    snapshot("调用 effect 前");
    const disposeGroup = fiber.effect(function* () {
        // 外层也创建自己的业务资源，并先交出它的清理函数。
        // 这是普通清理函数，负责删除 group 自身；后面的 disposeGroup 管理整组。
        resources.set("group", "已登记");
        const cleanupGroupResource = () => {
            resources.delete("group");
            cleanupOrder.push("group");
            snapshot("清理 group 自身资源后");
        };
        // 先收集的后清理：等 A、B 都清理完，才执行 cleanupGroupResource。
        yield cleanupGroupResource;
        snapshot("group 自身资源已登记，清理函数已收集");

        // register 返回 A 的 wrapper，此时它暂存在 Fiber 顶层清理列表中。
        const disposeA = register("A");
        snapshot("A 已登记，尚未 yield 给外层");

        // _execute 接收 yield 的值，collect 将 A 的 wrapper 收入外层局部数组，
        // 同时从 Fiber 顶层移除它；随后 next() 继续运行到下一行。
        yield disposeA;
        snapshot("yield A 后，继续执行外层生成器");

        // B 走相同路径：先登记，再把清理入口交给外层。
        yield register("B");
    }, "group");

    // 同步生成器已走完，group、A、B 三份资源都存在；顶层只登记 group 的 wrapper。
    snapshot("外层 effect 返回后");
    const groupIsTopLevel = [...fiber._disposables][0] === disposeGroup;
    console.log("Fiber 顶层保存的函数 === disposeGroup：", groupIsTopLevel);

    // 先移除 group 的顶层登记，再清理 B、A，最后清理 group 自身的业务资源。
    disposeGroup();
    snapshot("disposeGroup() 返回后");

    // 同一个 wrapper 的有效标记已经关闭，不会再次执行这三个业务清理函数。
    disposeGroup();
    snapshot("再次调用 disposeGroup() 后");
    return { groupIsTopLevel, snapshots };
}
