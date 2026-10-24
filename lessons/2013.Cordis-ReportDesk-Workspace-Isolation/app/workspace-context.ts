// 01 · 工作区标签是应用信息；服务隔离另由 Context.isolate 建立。
import "cordis";
declare module "cordis" {
    interface Context {
        workspaceName: string;
    }
}
