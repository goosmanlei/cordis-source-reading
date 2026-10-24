// 01 · ReportDesk：跟踪方法调用中的 this、来源标签和存储依赖。
import { logDetail } from "../shared/output.ts";
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";
import "./storage-service.ts";
import "./report-events.ts";
import "./call-context.ts";
import { observeMethod } from "../shared/observe-call.ts";

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
        observeMethod(this, id); // 只读观察，报告生成仍从下一行开始。
        const entryLabel = this.ctx.entryLabel;
        logDetail(`generate：entryLabel = ${entryLabel}，instanceId = ${this.instanceId}（当前调用入口与共享服务实例）`);
        const markdown = this.ctx.waterfall("report/format", input, () => {
            return `来源入口：${entryLabel}\n\n` + renderReport(input, this.config.excerptLength);
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
        logDetail(`reportProvider.apply：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（本轮新建的报告服务）`);
        return () => {
            logDetail(`reportProvider 清理：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（结束这一轮 apply）`);
        };
    },
};
