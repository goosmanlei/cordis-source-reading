// 01 · ReportDesk 建设起点：直接调用业务函数；可在这个文件中跟着 M1 改写。
import { renderReport, sampleConfig, writeReport } from "../../shared/report.ts";

const config = await sampleConfig(false);
const markdown = renderReport(config);
await writeReport(markdown);
