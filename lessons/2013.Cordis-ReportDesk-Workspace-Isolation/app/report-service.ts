// 01 · ReportDesk：每个工作区安装自己的报告服务与存储依赖。
import { logDetail } from "../shared/output.ts";
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";
import "./storage-service.ts";
import "./report-events.ts";
import "./workspace-context.ts";

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
        const workspaceName = this.ctx.workspaceName;
        logDetail(`generate：workspaceName = ${workspaceName}，instanceId = ${this.instanceId}（当前工作区与报告服务实例）`);
        const markdown = this.ctx.waterfall("report/format", input, () => {
            return `工作区：${workspaceName}\n\n` + renderReport(input, this.config.excerptLength);
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
