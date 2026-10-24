// 沿用 2004 的确定性报告规则；读写文件由课程准备。
import { logDetail } from "./output.ts";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ReportInput {
    title: string;
    text: string;
    includeExcerpt: boolean;
}

export interface ReportJob {
    id: string;
    input: ReportInput;
}

const taskRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
const reportDirectory = resolve(taskRoot, "runs/reportdesk");

function checkCwd(): void {
    if (realpathSync(process.cwd()) !== taskRoot) {
        throw new Error("请从 2014.Cordis-ReportDesk-Full-Flow 一级目录运行。");
    }
}

export async function prepareReports(): Promise<void> {
    checkCwd();
    await rm(reportDirectory, { recursive: true, force: true });
    await mkdir(reportDirectory, { recursive: true });
}

export async function sampleJobs(includeExcerpt = true): Promise<ReportJob[]> {
    return [
        {
            id: "lamp",
            input: {
                title: "便携台灯 · 内容报告",
                text: await readFile(new URL("../fixtures/lamp.txt", import.meta.url), "utf8"),
                includeExcerpt,
            },
        },
        {
            id: "bottle",
            input: {
                title: "旅行水杯 · 内容报告",
                text: await readFile(new URL("../fixtures/bottle.txt", import.meta.url), "utf8"),
                includeExcerpt,
            },
        },
    ];
}

export function renderReport(input: ReportInput, excerptLength: number): string {
    const text = input.text.trim();
    const count = Array.from(text.replace(/\s/gu, "")).length;
    const firstParagraph = text.split(/\r?\n\s*\r?\n/u)[0] ?? "";
    const lines = [`# ${input.title}`, "", `正文长度（不含空白，标点计入）：${count} 个 Unicode 码点`];
    if (input.includeExcerpt) {
        const excerpt = Array.from(firstParagraph).slice(0, excerptLength).join("");
        lines.push("", "## 首段摘录", "", excerpt);
    }
    return lines.join("\n") + "\n";
}

export async function writeReport(id: string, markdown: string): Promise<void> {
    checkCwd();
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error("报告 id 只使用小写字母、数字或连字符。");
    await writeFile(resolve(reportDirectory, `${id}.md`), markdown, "utf8");
    logDetail(`输出文件 = runs/reportdesk/${id}.md（本次输入的报告）`);
    logDetail("报告正文：\n" + markdown);
}
