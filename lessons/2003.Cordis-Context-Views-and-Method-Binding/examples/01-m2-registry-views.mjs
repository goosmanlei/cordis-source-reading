// 示例 01 · M2.3.1 · 视图与共享数据；从本课目录通过 VS Code F5 或 node --import tsx 运行。
import * as cordis from "../materials/cordis/src/index.ts";
import { isDirectEntry } from "../shared/is-direct-entry.mjs";

export default function inspectRegistryViews({ Context, symbols } = cordis) {
    const root = new Context();
    const branchA = root.extend({ label: "branch-A" });
    const branchB = root.extend({ label: "branch-B" });
    const rawRegistry = root.registry[symbols.original];
    const viewA = branchA.registry;
    const viewB = branchB.registry;

    console.log("viewA.ctx === branchA（A 视图返回 A）：", viewA.ctx === branchA);
    console.log("viewB.ctx === branchB（B 视图返回 B）：", viewB.ctx === branchB);
    console.log("rawRegistry.ctx === root（原字段保持 root）：", rawRegistry.ctx === root);
    console.log("viewA 的目标 === viewB 的目标（同一个 Registry）：", viewA[symbols.original] === viewB[symbols.original]);
    console.log("viewA._internal === viewB._internal（同一张登记 Map）：", viewA._internal === viewB._internal);
    console.log("viewA.plugin === rawRegistry.plugin（仍是原函数，尚未 bind）：", viewA.plugin === rawRegistry.plugin);
    console.log("viewA === branchA.registry（再次读取是否复用原视图）：", viewA === branchA.registry);
}

if (isDirectEntry(import.meta.url)) {
    await inspectRegistryViews();
}
