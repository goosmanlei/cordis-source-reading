// 00 · 声明生成。只处理本课生成目录，不改源码或 Notebook。
import { spawnSync } from "node:child_process";
import { mkdirSync, lstatSync, readlinkSync, realpathSync, symlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const taskRoot = fileURLToPath(new URL("../", import.meta.url));
mkdirSync(new URL("../runs/runtime/tmp/", import.meta.url), { recursive: true });
const typesLink = fileURLToPath(new URL("../materials/cordis/types", import.meta.url));
try {
    const current = lstatSync(typesLink);
    if (!current.isSymbolicLink() || readlinkSync(typesLink) !== "../../runs/cordis-types") {
        throw new Error("types 已存在且不是本课生成目录入口，请保留现有内容后检查。");
    }
} catch (error) {
    if (error.code !== "ENOENT") throw error;
    symlinkSync("../../runs/cordis-types", typesLink);
}
const result = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "materials/cordis/tsconfig.json"], {
    cwd: realpathSync(taskRoot),
    stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
