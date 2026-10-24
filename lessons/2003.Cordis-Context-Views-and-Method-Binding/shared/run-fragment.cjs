// Notebook 分段运行的公共入口。初始化集中在这里；每次启动独立 Node 进程，
// 从本课一级目录加载本课源码。输出返回 Notebook，不写文件或清理既有 runs。
const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const taskRoot = resolve(__dirname, "..");
const localRequire = createRequire(resolve(taskRoot, "package.json"));
const loader = pathToFileURL(localRequire.resolve("tsx")).href;
const source = pathToFileURL(resolve(taskRoot, "materials/cordis/src/index.ts")).href;
const titles = {
    M1: "创建分支与原型关系",
    "M1-shadow": "extend 保留定义位置、派生使用位置",
    "M1-application": "shadow 保留服务依赖并跟随调用位置",
    M2: "视图的上下文与共享数据",
    M3: "取出方法后仍保留分支归属",
};

module.exports = function runFragment(section, callback) {
    if (!Object.hasOwn(titles, section) || typeof callback !== "function") {
        throw new TypeError("请传入已登记的片段名称和本段教学函数。");
    }
    const entry = `import * as cordis from ${JSON.stringify(source)};\nawait (${callback.toString()})(cordis);`;
    console.log("\n" + "=".repeat(60));
    console.log(`案例：${section === "M1-application" ? "02" : "01"} · ${section} 片段 · ${titles[section]}`);
    console.log("-".repeat(60));
    console.log("执行：独立 Node 进程 + 本课 tsx；加载 materials/cordis/src/index.ts");
    const result = spawnSync(process.execPath, ["--import", loader, "--input-type=module", "--eval", entry], {
        cwd: taskRoot,
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 1024 * 1024,
    });
    if (result.stdout) console.log(result.stdout.trimEnd());
    if (result.stderr) console.error(result.stderr.trimEnd());
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`分段示例执行失败（退出码 ${result.status}），请查看上方输出。`);
};
