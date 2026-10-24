// 独立示例被直接运行时执行；被其他模块导入时只导出教学函数。
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function isDirectEntry(moduleUrl) {
    return Boolean(process.argv[1]) && moduleUrl === pathToFileURL(resolve(process.argv[1])).href;
}
