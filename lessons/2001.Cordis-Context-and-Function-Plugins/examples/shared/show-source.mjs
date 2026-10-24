import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function showSource(path, start, stop) {
    const lines = readFileSync(path, "utf8").split("\n");
    console.log(`源码：${path}，第 ${start}–${stop} 行（固定上游原文件）`);
    console.log(lines.slice(start - 1, stop).map((line, index) => `${String(start + index).padStart(3)} | ${line}`).join("\n"));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const ranges = process.argv.slice(2);
    if (!ranges.length || ranges.length % 3 !== 0) {
        throw new Error("用法：node examples/shared/show-source.mjs <源码路径> <起始行> <结束行> [更多范围…]");
    }
    for (let index = 0; index < ranges.length; index += 3) {
        const start = Number(ranges[index + 1]);
        const stop = Number(ranges[index + 2]);
        if (!Number.isInteger(start) || !Number.isInteger(stop) || start < 1 || stop < start) {
            throw new Error("源码行号须为正整数，结束行不能小于起始行。");
        }
        showSource(ranges[index], start, stop);
    }
}
