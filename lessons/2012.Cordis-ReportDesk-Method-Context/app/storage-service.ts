// 01 · ReportDesk：本次装载拥有一份独立的内存存储。
import { logDetail } from "../shared/output.ts";
import { Context, Service } from "cordis";

declare module "cordis" {
    interface Context {
        storage: StorageService;
    }
}

let nextStorageInstanceId = 0;

export class StorageService extends Service {
    readonly instanceId = ++nextStorageInstanceId;
    private records = new Map<string, string>();

    constructor(ctx: Context) {
        super(ctx, "storage");
    }

    save(id: string, markdown: string): void {
        this.records.set(id, markdown);
        logDetail(`storage.save：id = ${id}（本次内存存储已保存）`);
    }

    ids(): string[] {
        return [...this.records.keys()];
    }
}

export function storageProvider(ctx: Context): void {
    new StorageService(ctx);
    logDetail("storageProvider：创建并登记一个新的内存 storage");
}
