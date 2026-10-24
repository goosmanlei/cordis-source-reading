// 01 · ReportDesk：依赖 storage，生成后保存；恢复时创建新的服务实例。
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";
import "./storage-service.ts";

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
        const markdown = renderReport(input);
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
