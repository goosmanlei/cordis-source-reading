// 示例 01 · M3.2.1 · 方法绑定与插件上下文；从本课目录通过 VS Code F5 或 node --import tsx 运行。
import * as cordis from "../materials/cordis/src/index.ts";
import { isDirectEntry } from "../shared/is-direct-entry.mjs";

export default async function inspectMethodBinding({ Context } = cordis) {
    const root = new Context();
    const branchA = root.extend({ label: "branch-A" });
    const branchB = root.extend({ label: "branch-B" });
    const calls = [];
    function leaf(ctx, config) {
        calls.push(ctx);
        console.log("leaf 收到的 label / message：", ctx.label, "/", config.message);
    }
    const installA = branchA.plugin;
    const installB = branchB.plugin;
    let fiberA, fiberB;
    try {
        fiberB = await installB(leaf, { message: "from-B" });
        fiberA = await installA(leaf, { message: "from-A" });
        console.log("fiberB.parent === branchB（B 的父分支）：", fiberB.parent === branchB);
        console.log("fiberA.parent === branchA（后调用 A，父分支仍是 A）：", fiberA.parent === branchA);
        console.log("fiberA.ctx === branchA（插件 ctx 是否就是父分支）：", fiberA.ctx === branchA);
        console.log("Object.getPrototypeOf(fiberA.ctx) === branchA（新 ctx 继承 A）：", Object.getPrototypeOf(fiberA.ctx) === branchA);
        console.log("两次回调收到各自的 fiber.ctx：", calls[0] === fiberB.ctx && calls[1] === fiberA.ctx);
    } finally {
        await fiberA?.dispose();
        await fiberB?.dispose();
    }
}

if (isDirectEntry(import.meta.url)) {
    await inspectMethodBinding();
}
