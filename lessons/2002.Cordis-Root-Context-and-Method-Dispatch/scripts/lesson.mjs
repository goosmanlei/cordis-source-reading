// 本课运行辅助入口：从任务根执行，加载本课可修改的源码与 tsx，产物只写本课 runs。
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const taskRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
if (realpathSync(process.cwd()) !== taskRoot) throw new Error("请从 Cordis 2002 一级目录运行。");
const localRequire = createRequire(resolve(taskRoot, "package.json"));
let loader;
try {
    loader = pathToFileURL(localRequire.resolve("tsx")).href;
} catch {
    throw new Error("本课 tsx 依赖缺失，请在本课目录按 package-lock.json 恢复依赖，或执行 npm ci 后重试。");
}
const source = pathToFileURL(resolve(taskRoot, "materials/cordis/src/index.ts")).href;
const selected = process.argv.includes("--effect") ? {
    file: "03-fiber-effect.mjs",
    purpose: "fiber-effect",
    title: "03 · Fiber.effect 的登记与清理",
} : {
    file: "02-context-assembly.mjs",
    purpose: "context-assembly",
    title: "02 · 根 Context 装配与方法转发",
};
const example = pathToFileURL(resolve(taskRoot, "examples", selected.file)).href;
const callback = process.argv.includes("--stdin") ? readFileSync(0, "utf8").trim() : "";
if (process.argv.includes("--stdin") && !callback) throw new Error("Notebook 未传入运行函数。");
const runDir = resolve(taskRoot, "runs", selected.purpose);
rmSync(runDir, { recursive: true, force: true });
mkdirSync(runDir, { recursive: true });
const entry = resolve(runDir, "entry.mjs");
const invocation = callback ? `(${callback})(cordis)` : `(await import(${JSON.stringify(example)})).default(cordis)`;
writeFileSync(entry, `import * as cordis from ${JSON.stringify(source)};\nimport { writeFileSync } from 'node:fs';\nconst snapshot = await ${invocation};\nwriteFileSync(${JSON.stringify(resolve(runDir, 'snapshot.json'))}, JSON.stringify(snapshot, null, 4) + '\\n');\n`);
console.log("\n" + "=".repeat(60));
console.log("案例：" + selected.title);
console.log("-".repeat(60));
console.log("执行：独立 Node 进程 + 本课 tsx；源码入口为 materials/cordis/src/index.ts");
const result = spawnSync(process.execPath, ["--import", loader, entry], { cwd: taskRoot, encoding: "utf8" });
writeFileSync(resolve(runDir, "stdout.log"), result.stdout ?? "");
writeFileSync(resolve(runDir, "stderr.log"), result.stderr ?? "");
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
