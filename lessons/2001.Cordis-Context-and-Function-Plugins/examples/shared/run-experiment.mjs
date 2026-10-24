import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Notebook 只提交实验函数；本入口负责隔离运行和保存本次输出。
const taskRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
if (realpathSync(process.cwd()) !== taskRoot) {
    throw new Error("请从 Cordis 2001 课程目录运行实验。");
}
const number = process.argv[2];
if (!["01", "02", "03"].includes(number)) {
    throw new Error("实验编号须为 01、02 或 03。");
}
const callback = readFileSync(0, "utf8");
if (!callback.trim()) throw new Error("缺少 Notebook 实验函数。");
const runDir = resolve(taskRoot, "runs", `notebook-experiment-${number}`);
rmSync(runDir, { recursive: true, force: true });
mkdirSync(runDir, { recursive: true });
const entry = resolve(runDir, "experiment.mjs");
writeFileSync(entry, `// 实验 ${number}：来自 Notebook 当前代码\nimport * as cordis from "cordis";\nawait (${callback})(cordis);\n`);
const result = spawnSync(process.execPath, ["--import", "tsx", entry], {
    cwd: taskRoot,
    encoding: "utf8",
});
writeFileSync(resolve(runDir, "stdout.log"), result.stdout ?? "");
writeFileSync(resolve(runDir, "stderr.log"), result.stderr ?? "");
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
