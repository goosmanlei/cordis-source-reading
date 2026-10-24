// 01 · ReportDesk：把报告生成能力登记为 report 服务。
import { Context, Service } from "cordis";
import { renderReport } from "../shared/report.ts";
import type { ReportInput } from "../shared/report.ts";

declare module "cordis" {
    interface Context {
        report: ReportService;
    }
}

export class ReportService extends Service {
    constructor(ctx: Context) {
        super(ctx, "report");
    }

    generate(input: ReportInput): string {
        return renderReport(input);
    }
}

export function reportProvider(ctx: Context): void {
    const service = new ReportService(ctx);
    console.log(`reportProvider：已创建并登记 service.name = ${service.name}`);
}
