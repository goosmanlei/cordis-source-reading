// 示例 01 · M1.2.1 · 分支与原型；从本课目录通过 VS Code F5 或 node --import tsx 运行。
import * as cordis from "../materials/cordis/src/index.ts";
import { isDirectEntry } from "../shared/is-direct-entry.mjs";

export default function inspectBranches({ Context } = cordis) {
    const root = new Context();
    const branchA = root.extend({ label: "branch-A" });
    const branchB = root.extend({ label: "branch-B" });

    console.log("branchA.label（A 自己的标签）：", branchA.label);
    console.log("branchB.label（B 自己的标签）：", branchB.label);
    console.log("Object.hasOwn(branchA, 'label')（A 自己保存 label）：", Object.hasOwn(branchA, "label"));
    console.log("Object.hasOwn(root, 'label')（根没有被添加 label）：", Object.hasOwn(root, "label"));
    console.log("Object.getPrototypeOf(branchA) === root（A 的原型是 root）：", Object.getPrototypeOf(branchA) === root);
    console.log("Object.getPrototypeOf(branchB) === root（B 也继承同一个 root）：", Object.getPrototypeOf(branchB) === root);
}

if (isDirectEntry(import.meta.url)) {
    await inspectBranches();
}
