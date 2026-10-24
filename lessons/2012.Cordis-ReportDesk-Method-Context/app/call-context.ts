// 01 · ReportDesk：由调用入口放到 Context 上的来源标签。
import "cordis";

declare module "cordis" {
    interface Context {
        entryLabel: string;
    }
}
