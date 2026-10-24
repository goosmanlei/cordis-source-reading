import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { getCallSites } from "node:util";

const taskRoot = fileURLToPath(new URL("../", import.meta.url));

// 按源映射取实际 TypeScript 位置；调用方是本函数外的第 1 层。
export function sourceLocation(callerDepth = 1): string {
    const caller = getCallSites(callerDepth + 1, { sourceMap: true })[callerDepth]!;
    const file = caller.scriptName.startsWith("file:") ? fileURLToPath(caller.scriptName) : caller.scriptName;
    return `${relative(taskRoot, file)}:${caller.lineNumber}`;
}

// 本课默认展示工作区对照；旧流程日志可用 REPORTDESK_VERBOSE=1 查看。
export function logDetail(message: string): void {
    if (process.env.REPORTDESK_VERBOSE === "1") console.log(message);
}
