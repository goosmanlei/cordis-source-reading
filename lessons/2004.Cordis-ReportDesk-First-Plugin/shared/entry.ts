// Notebook 与命令行参数适配，由课程准备；教学主体在 app/ 与 examples/。
import { sampleConfig } from "./report.ts";
import type { ReportConfig } from "./report.ts";

export async function configFromArgs(): Promise<ReportConfig> {
    const overrides: Partial<ReportConfig> = process.argv[2]?.startsWith("{")
        ? JSON.parse(process.argv[2])
        : { includeExcerpt: process.argv.includes("--with-excerpt") };
    return { ...await sampleConfig(), ...overrides };
}
