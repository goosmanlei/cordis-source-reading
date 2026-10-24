// 示例 01 · 同一个 Registry、两个 Context 视图与提前取出的方法。
import { Context as LocalContext } from "../materials/cordis/src/index.ts";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** @param {{ Context?: typeof LocalContext }} [options] */
export default async function inspectContextViews({ Context = LocalContext } = {}) {
    const root = new Context();
    const branchA = root.extend({ label: "branch-A" });
    const branchB = root.extend({ label: "branch-B" });
    const original = Symbol.for("cordis.original");
    // root.registry 也经过访问代理；通过源码提供的 Symbol 取得其原对象。
    const rawRegistry = root.registry[original];
    const viewA = branchA.registry;
    const viewB = branchB.registry;
    const names = new Map([
        [root, "C0: root"],
        [branchA, "C1: branch-A"],
        [branchB, "C2: branch-B"],
    ]);
    const contextName = (ctx) => names.get(ctx) ?? "尚未命名的 Context";
    const snapshots = [];
    const calls = [];
    const fibers = [];

    function snapshot(stage, values) {
        // 这里只保存布尔值、数字和对象名称，不保存随后会变化的 Cordis 对象。
        const data = { stage, ...values };
        snapshots.push(data);
        console.log("\n01 · " + stage);
        for (const [expression, value] of Object.entries(values)) {
            console.log(expression + "：", JSON.stringify(value));
        }
    }

    function leaf(ctx, config) {
        // 先保存实际引用，等外层 await 得到 Fiber 后再核对是否同一个 ctx。
        calls.push({ ctx, label: ctx.label, message: config.message });
    }

    function registrationSnapshot(stage) {
        const runtime = rawRegistry.get(leaf);
        snapshot(stage, {
            "rawRegistry.ctx（原对象仍保存根 Context）": contextName(rawRegistry.ctx),
            "rawRegistry._internal.size（登记的插件函数数）": rawRegistry._internal.size,
            "runtime.fibers（同一个 leaf 的装载记录）": [...runtime.fibers].map((fiber) => ({
                uid: fiber.uid,
                parent: contextName(fiber.parent),
                ctx: contextName(fiber.ctx),
                ctxPrototypeIsParent: Object.getPrototypeOf(fiber.ctx) === fiber.parent,
            })),
            "leaf 实际收到的 ctx、分支属性与配置": calls.map((call) => ({
                ctx: contextName(call.ctx),
                label: call.label,
                message: call.message,
                isFiberContext: fibers.some((fiber) => fiber.ctx === call.ctx),
            })),
        });
    }

    snapshot("A · 只读取访问视图，尚未装载插件", {
        "Object.getPrototypeOf(branchA) === root（分支沿原型继承根）": Object.getPrototypeOf(branchA) === root,
        "viewA === viewB（访问代理是否同一对象）": viewA === viewB,
        "两视图的 original === rawRegistry（代理目标相同）": viewA[original] === rawRegistry && viewB[original] === rawRegistry,
        "rawRegistry.ctx（原对象字段）": contextName(rawRegistry.ctx),
        "viewA.ctx（A 视图读取结果）": contextName(viewA.ctx),
        "viewB.ctx（B 视图读取结果）": contextName(viewB.ctx),
        "两视图的 _internal === 原 Map（数据共享）": viewA._internal === rawRegistry._internal && viewB._internal === rawRegistry._internal,
        "viewA.plugin === rawRegistry.plugin（此时尚未 bind）": viewA.plugin === rawRegistry.plugin,
        "rawRegistry._internal.size（插件登记数）": rawRegistry._internal.size,
    });

    // 每次读取 branch.plugin，mixin getter 都会取得该分支的 Registry 视图并 bind。
    // 以下两个变量已经保存绑定后的函数；之后调用时不需要再写 branchA/branchB。
    const installA = branchA.plugin;
    const installB = branchB.plugin;
    snapshot("B · 两个方法均已取出，尚未调用", {
        "installA === rawRegistry.plugin（bind 返回新的函数）": installA === rawRegistry.plugin,
        "rawRegistry._internal.size（取方法尚未登记插件）": rawRegistry._internal.size,
    });

    try {
        // 特意先调用 B，再调用早已取出的 A：观察各函数保留的接收者。
        const fiberB = await installB(leaf, { message: "from-B" });
        fibers.push(fiberB);
        names.set(fiberB.ctx, "C3: plugin-B");
        registrationSnapshot("C · installB 调用完成");

        const fiberA = await installA(leaf, { message: "from-A" });
        fibers.push(fiberA);
        names.set(fiberA.ctx, "C4: plugin-A");
        registrationSnapshot("D · installA 调用完成");
        return snapshots;
    } finally {
        // 运行结束释放本例的两次装载。清理流程不是本例的阅读目标。
        for (const fiber of [...fibers].reverse()) await fiber.dispose();
    }
}

// 直接运行时执行案例；由 lesson.mjs 导入时仍由调用方执行，不重复运行。
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await inspectContextViews();
}
