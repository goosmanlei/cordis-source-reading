// 01 · ReportDesk：本轮报告服务保存本次 apply 收到的配置。
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";
import "./storage-service.ts";
import "./report-events.ts";

export interface ReportConfig {
    excerptLength: number;
}

let nextInstanceId = 0;

declare module "cordis" {
    interface Context {
        report: ReportService;
    }
}

export class ReportService extends Service {
    readonly instanceId = ++nextInstanceId;

    constructor(ctx: Context, public readonly config: ReportConfig) {
        super(ctx, "report");
    }

    generate(id: string, input: ReportInput): string {
        const markdown = this.ctx.waterfall("report/format", input, () => {
            console.log(`inner：本轮服务 config.excerptLength = ${this.config.excerptLength}（摘录最多保留的 Unicode 码点数）`);
            return renderReport(input, this.config.excerptLength);
        });
        this.ctx.storage.save(id, markdown);
        return markdown;
    }
}

export const reportProvider = {
    name: "report-provider",
    inject: ["storage"],
    apply(ctx: Context, config: ReportConfig): () => void {
        const service = new ReportService(ctx, config);
        console.log(`reportProvider.apply：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（本轮新建的报告服务）`);
        return () => {
            console.log(`reportProvider 清理：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（结束这一轮 apply）`);
        };
    },
};
