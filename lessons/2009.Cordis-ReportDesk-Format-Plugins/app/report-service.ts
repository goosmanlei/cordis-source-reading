// 01 · ReportDesk：让格式插件包装生成结果，再交给 storage 保存。
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";
import "./storage-service.ts";
import "./report-events.ts";

let nextInstanceId = 0;

declare module "cordis" {
    interface Context {
        report: ReportService;
    }
}

export class ReportService extends Service {
    readonly instanceId = ++nextInstanceId;

    constructor(ctx: Context) {
        super(ctx, "report");
    }

    generate(id: string, input: ReportInput): string {
        const markdown = this.ctx.waterfall("report/format", input, () => {
            console.log("inner：调用 renderReport(input)，生成原始正文");
            return renderReport(input);
        });
        this.ctx.storage.save(id, markdown);
        return markdown;
    }
}

export const reportProvider = {
    name: "report-provider",
    inject: ["storage"],
    apply(ctx: Context): void {
        const service = new ReportService(ctx);
        console.log(`reportProvider.apply：report.instanceId = ${service.instanceId}（本进程第几次创建报告服务）`);
    },
};
