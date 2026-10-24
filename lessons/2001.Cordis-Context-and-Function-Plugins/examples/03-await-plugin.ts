// 示例 03：等待异步插件完成，识别可等待的装载对象
import { Context, Fiber } from "cordis";

const root = new Context();
const events: string[] = [];

async function asyncPlugin(ctx: Context, config: { label: string }): Promise<void> {
    events.push("3 插件开始：" + config.label);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    events.push("4 插件内部 await 后继续");
}

events.push("1 调用 root.plugin 前");
const handle = root.plugin(asyncPlugin, { label: "异步初始化" });
events.push("2 调用 root.plugin 后，调用方继续");
console.log("handle instanceof Promise（是否为原生 Promise） =", handle instanceof Promise);
console.log("typeof handle.then（是否提供等待入口） =", typeof handle.then);
console.log("handle instanceof Fiber（是否也具有插件运行对象能力） =", handle instanceof Fiber);

const fiber = await handle;
events.push("5 await handle 完成");
console.log("events（函数调用与异步完成的先后） =", events);
console.log("fiber instanceof Fiber（await 得到的结果类型） =", fiber instanceof Fiber);
console.log("fiber === handle（包装对象和完成值是否同一对象） =", fiber === handle);
console.log("fiber === handle.ctx.fiber（完成值对应真实运行对象） =", fiber === handle.ctx.fiber);
await handle.dispose();
