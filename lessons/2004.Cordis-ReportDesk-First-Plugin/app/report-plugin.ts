// 01 · ReportDesk：函数插件负责生成并保存这一份报告。
import type { Context } from "cordis";
import { renderReport, writeReport } from "../shared/report.ts";
import type { ReportConfig } from "../shared/report.ts";

export async function reportPlugin(_ctx: Context, config: ReportConfig): Promise<void> {
    // _ctx 是框架传入的本次插件上下文；本例业务只使用 config。
    console.log(`in reportPlugin: config:ReportConfig = ${JSON.stringify(config)}`);
    const markdown = renderReport(config);
    await writeReport(markdown);
    // 完成后不返回报告字符串：报告已经写入文件。
    // Cordis 会处理插件的返回值；本例返回 Promise<void>。
}
