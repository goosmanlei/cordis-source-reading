// 只读观察；不会触发 update，也不参与配置或依赖判断。
import { Context, Fiber, FiberState } from "cordis";
import { writeFile } from "node:fs/promises";

const snapshots: object[] = [];
const stateNames: Record<FiberState, string> = {
    [FiberState.PENDING]: "PENDING",
    [FiberState.LOADING]: "LOADING",
    [FiberState.ACTIVE]: "ACTIVE",
    [FiberState.FAILED]: "FAILED",
    [FiberState.DISPOSED]: "DISPOSED",
    [FiberState.UNLOADING]: "UNLOADING",
};

export function observe(app: Context, report: Fiber, phase: string): void {
    const service = app.get("report");
    const storage = app.get("storage");
    const snapshot = {
        phase,
        reportUid: report.uid,
        reportState: stateNames[report.state],
        savedConfig: report.config,
        reportInstanceId: service?.instanceId ?? null,
        serviceConfig: service?.config ?? null,
        storageInstanceId: storage?.instanceId ?? null,
        storageIds: storage?.ids() ?? null,
    };
    snapshots.push(snapshot);
    console.log(`\n观察 phase = ${phase}（本阶段等待与报告生成已完成）`);
    console.log(`report.uid = ${snapshot.reportUid}；report.state = ${snapshot.reportState}（插件 Fiber 的身份与状态）`);
    console.log(`report.config = ${JSON.stringify(snapshot.savedConfig)}（Fiber 保存的配置）`);
    console.log(`app.get("report")?.instanceId = ${snapshot.reportInstanceId}；service.config = ${JSON.stringify(snapshot.serviceConfig)}（当前服务实例与本轮配置）`);
    console.log(`storage.instanceId = ${snapshot.storageInstanceId}；storage.ids() = ${JSON.stringify(snapshot.storageIds)}（存储实例与累计报告）`);
}

export async function saveObservations(): Promise<void> {
    await writeFile("runs/reportdesk/observations.json", JSON.stringify(snapshots, null, 2) + "\n");
}
