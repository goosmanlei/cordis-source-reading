// 00 · Notebook 运行同一份 TypeScript 文件；每次使用新进程，源码修改立即生效。
const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const taskRoot = resolve(__dirname, "..");
const localRequire = createRequire(resolve(taskRoot, "package.json"));
const loader = pathToFileURL(localRequire.resolve("tsx")).href;
exports.run = function run() {
    const entry = "examples/01-reportdesk/main.ts";
    console.log("\n" + "=".repeat(60));
    console.log("案例：01 · ReportDesk · 共享服务与调用视图");
    console.log("-".repeat(60));
    console.log(`执行：node --import tsx ${entry}（cwd：本课目录）`);
    const result = spawnSync(process.execPath, ["--import", loader, resolve(taskRoot, entry)], {
        cwd: taskRoot,
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 1024 * 1024,
    });
    if (result.stdout) console.log(result.stdout.trimEnd());
    if (result.stderr) console.error(result.stderr.trimEnd());
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`ReportDesk 退出码 ${result.status}；请查看上方信息。`);
};
