// 00 · Notebook 运行同一份 TypeScript 文件；每次使用新进程，源码修改立即生效。
const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const taskRoot = resolve(__dirname, "..");
const localRequire = createRequire(resolve(taskRoot, "package.json"));
const loader = pathToFileURL(localRequire.resolve("tsx")).href;
const entries = {
    start: "examples/01-reportdesk/start.ts",
    service: "examples/01-reportdesk/main.ts",
};

exports.run = function run(stage = "service", overrides = {}) {
    if (!Object.hasOwn(entries, stage)) throw new Error("stage 只支持 start 或 service。");
    if (stage === "start" && Object.keys(overrides).length) throw new Error("起点脚本直接在文件中修改；配置覆盖用于 service。");
    console.log("\n" + "=".repeat(60));
    console.log(`案例：01 · ReportDesk · ${stage === "start" ? "建设起点" : "报告服务"}`);
    console.log("-".repeat(60));
    const extraArgs = stage === "service" ? [JSON.stringify(overrides)] : [];
    const displayedArgs = extraArgs.map((arg) => `'${arg.replaceAll("'", "'\\''")}'`);
    console.log(`执行：${["node", "--import", "tsx", entries[stage], ...displayedArgs].join(" ")}（cwd：本课目录）`);
    const args = ["--import", loader, resolve(taskRoot, entries[stage]), ...extraArgs];
    const result = spawnSync(process.execPath, args, {
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
