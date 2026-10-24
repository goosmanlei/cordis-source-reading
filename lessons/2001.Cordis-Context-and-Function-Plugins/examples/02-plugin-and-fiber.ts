// 示例 02：同一个插件函数，两次独立装载
import { Context } from "cordis";

interface ReporterConfig {
    label: string;
}

const root = new Context();
const observed: Array<{ label: string; ctx: Context }> = [];

function reporter(ctx: Context, config: ReporterConfig): void {
    observed.push({ label: config.label, ctx });
    console.log("reporter 的配置与运行编号 =", { label: config.label, uid: ctx.fiber.uid });
}

const first = root.plugin(reporter, { label: "A" });
const second = root.plugin(reporter, { label: "B" });
await Promise.all([first, second]);

const runtime = root.registry.get(reporter);
console.log("root.registry.size（不同插件函数的登记数） =", root.registry.size);
console.log("runtime?.fibers.length（reporter 的装载次数） =", runtime?.fibers.length);
console.log("first.runtime === second.runtime（是否共用插件登记记录） =", first.runtime === second.runtime);
console.log("first.ctx === second.ctx（是否共用本次运行上下文） =", first.ctx === second.ctx);
console.log("first.uid !== second.uid（是否为不同运行编号） =", first.uid !== second.uid);
console.log("first.ctx.fiber.uid !== second.ctx.fiber.uid（是否为不同运行编号） =", first.ctx.fiber.uid !== second.ctx.fiber.uid);
console.log("observed.map(item => item.label)（两次收到的配置） =", observed.map((item) => item.label));
await first.dispose();
await second.dispose();
