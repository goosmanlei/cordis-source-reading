import { sampleJobs } from "./report.ts";

export async function jobsFromArgs() {
    const overrides = JSON.parse(process.argv[2] ?? "{}");
    const includeExcerpt = overrides.includeExcerpt ?? true;
    if (typeof includeExcerpt !== "boolean") throw new Error("includeExcerpt 必须是布尔值。");
    console.log(`input.includeExcerpt = ${includeExcerpt}（两份报告是否加入首段摘录）`);
    return sampleJobs(includeExcerpt);
}
