import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const cases = [
    ["01", "Context 与函数插件", "examples/01-function-plugin.ts"],
    ["02", "插件登记与两次独立装载", "examples/02-plugin-and-fiber.ts"],
    ["03", "等待异步插件完成", "examples/03-await-plugin.ts"],
];
const taskRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
if (realpathSync(process.cwd()) !== taskRoot) {
    throw new Error("请从 2001.Cordis-Context-and-Function-Plugins 一级目录运行本课示例。");
}
const selected = process.argv[2] ?? "demo";
const entries = selected === "demo" ? cases : cases.filter(([number]) => number === selected);
if (!entries.length) throw new Error("使用 demo、01、02 或 03。");
rmSync("runs/plugin-examples", { recursive: true, force: true });
mkdirSync("runs/plugin-examples", { recursive: true });
for (const [number, title, file] of entries) {
    console.log("\n" + "=".repeat(64));
    console.log(`案例：${number} · ${title}`);
    console.log("-".repeat(64));
    console.log(`执行命令：node --import tsx ${file}（cwd：本课一级目录）`);
    const result = spawnSync(process.execPath, ["--import", "tsx", file], { encoding: "utf8", cwd: process.cwd() });
    writeFileSync(`runs/plugin-examples/${number}-stdout.log`, result.stdout ?? "");
    writeFileSync(`runs/plugin-examples/${number}-stderr.log`, result.stderr ?? "");
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}
