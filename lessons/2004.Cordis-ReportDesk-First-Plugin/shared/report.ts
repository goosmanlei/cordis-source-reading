// ReportDesk 的确定性业务辅助函数。由课程准备，不是本课源码导读对象。
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ReportConfig {
    title: string;
    text: string;
    includeExcerpt: boolean;
}

const taskRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));

export async function sampleConfig(includeExcerpt = false): Promise<ReportConfig> {
    return {
        title: "便携台灯 · 内容报告",
        text: await readFile(new URL("../fixtures/product.txt", import.meta.url), "utf8"),
        includeExcerpt,
    };
}

export function renderReport(config: ReportConfig): string {
    const text = config.text.trim();
    const count = Array.from(text.replace(/\s/gu, "")).length;
    const firstParagraph = text.split(/\r?\n\s*\r?\n/u)[0] ?? "";
    const lines = [`# ${config.title}`, "", `正文长度（不含空白，标点计入）：${count} 个 Unicode 码点`];
    if (config.includeExcerpt) {
        lines.push("", "## 首段摘录", "", firstParagraph);
    }
    return lines.join("\n") + "\n";
}

export async function writeReport(markdown: string): Promise<void> {
    if (realpathSync(process.cwd()) !== taskRoot) {
        throw new Error("请从 2004.Cordis-ReportDesk-First-Plugin 一级目录运行。");
    }
    const directory = resolve(taskRoot, "runs/reportdesk");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "report.md"), markdown, "utf8");
    console.log("in writeReport: output file = " + resolve(directory, "report.md"));
    console.log("in writeReport: reportText = " + markdown);
}
