// 01 · 独立运行入口：把运行临时目录固定在本课内。
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const taskRoot = fileURLToPath(new URL("../", import.meta.url));
const tmp = fileURLToPath(new URL("../runs/runtime/tmp/", import.meta.url));
mkdirSync(tmp, { recursive: true });
const result = spawnSync(process.execPath, ["--import", "tsx", "examples/01-reportdesk/main.ts"], {
    cwd: taskRoot,
    env: { ...process.env, TMPDIR: tmp, TSX_DISABLE_CACHE: "1" },
    stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
