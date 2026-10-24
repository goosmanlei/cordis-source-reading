// 示例 01：Context 装入函数插件并传递配置
import { Context } from "cordis";
import { inspect } from "node:util";

interface GreetingConfig {
    label: string;
}

const root = new Context();
const config: GreetingConfig = { label: "第一个插件" };
let receivedContext: Context | undefined;

function greeting(ctx: Context, options: GreetingConfig): void {
    receivedContext = ctx;
    console.log("options.label（插件收到的配置） =", options.label);
    console.log("options === config（未配置转换器时保留原配置对象） =", options === config);
    console.log("ctx === root（插件上下文是否就是根对象） =", ctx === root);
    console.log("inspect(ctx)（插件上下文的显示名称） =", inspect(ctx));
    console.log("inspect(ctx.root)（插件上下文的显示名称） =", inspect(ctx.root));
}

console.log("inspect(root)（创建的根上下文） =", inspect(root));
const handle = root.plugin(greeting, config);
await handle;
console.log("receivedContext?.fiber === handle.ctx.fiber（上下文对应本次运行） =", receivedContext?.fiber === handle.ctx.fiber);
console.log("root.registry.has(greeting)（函数已登记） =", root.registry.has(greeting));
await handle.dispose();
