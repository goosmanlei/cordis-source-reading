// 00 · Notebook 使用与 npm run demo 相同的独立入口。
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const taskRoot = resolve(__dirname, "..");
exports.run = function run() {
    console.log("\n" + "=".repeat(60));
    console.log("案例：01 · ReportDesk · 完整流程与对象图解");
    console.log("-".repeat(60));
    console.log("执行：node shared/run-demo.mjs（cwd：本课目录）");
    const result = spawnSync(process.execPath, ["shared/run-demo.mjs"], {
        cwd: taskRoot, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024,
    });
    if (result.stdout) console.log(result.stdout.trimEnd());
    if (result.stderr) console.error(result.stderr.trimEnd());
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`ReportDesk 退出码 ${result.status}`);
};
