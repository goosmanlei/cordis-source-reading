// 示例 01 · M1.2.2 · shadow 与 extend；从本课目录通过 VS Code F5 或 node --import tsx 运行。
import * as cordis from "../materials/cordis/src/index.ts";
import { isDirectEntry } from "../shared/is-direct-entry.mjs";

export default function inspectShadowExtend({ Context, symbols, getTraceable } = cordis) {
    const root = new Context();
    const definitionCtx = root.extend({ label: "定义位置" });
    const useCtx = root.extend({ label: "原使用位置" });

    // 第一次：useCtx 原来没有 shadow，本次只是把标记作为 meta 复制进去。
    const shadowCtx = useCtx.extend({ [symbols.shadow]: definitionCtx });
    console.log("第一次：shadowCtx 自身保存 shadow：", Object.hasOwn(shadowCtx, symbols.shadow)); //
    console.log("第一次：shadow 的值就是 definitionCtx：", shadowCtx[symbols.shadow] === definitionCtx);
    console.log("第一次：shadowCtx 的原型是 useCtx：", Object.getPrototypeOf(shadowCtx) === useCtx);

    // 第二次：this 已有 shadow，第一行就能取到 definitionCtx，最后会多返回一层对象。
    console.log("第二次起点：getTraceable(shadowCtx, shadowCtx) === useCtx：", getTraceable(shadowCtx, shadowCtx) === useCtx);

    const extended = shadowCtx.extend({ label: "新使用位置" });
    const extendedUseCtx = Object.getPrototypeOf(extended); // 对应 extend 内部的 self。
    console.log('Object.getPrototypeOf(extended) === shadowCtx: ', Object.getPrototypeOf(extended) === shadowCtx);
    console.log("第二次：extended 自身仍保存同一个 definitionCtx：", Object.hasOwn(extended, symbols.shadow) && extended[symbols.shadow] === definitionCtx);
    console.log("第二次：extendedUseCtx 的原型是 useCtx：", Object.getPrototypeOf(extendedUseCtx) === useCtx);
    console.log("第二次：label 自己保存在 extendedUseCtx 上：", Object.hasOwn(extendedUseCtx, "label"));
    console.log("第二次：extended 自己没有 label，而是继承它：", !Object.hasOwn(extended, "label"));
    console.log("读取 extended.label（沿原型取得新值）：", extended.label);
    console.log("原来的 useCtx.label（未被覆盖）：", useCtx.label);
}

if (isDirectEntry(import.meta.url)) {
    await inspectShadowExtend();
}
