// 观察辅助：只读当前状态；不参与依赖判断或触发生命周期。
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
        reportInstanceId: service?.instanceId ?? null,
        storageIds: storage?.ids() ?? null,
    };
    snapshots.push(snapshot);
    console.log(`\n观察 phase = ${phase}（完成本阶段的等待后）`);
    console.log(`report.uid = ${snapshot.reportUid}（同一次报告插件装载的身份）`);
    console.log(`report.state = ${snapshot.reportState}（报告插件当前状态）`);
    console.log(`app.get("report")?.instanceId = ${snapshot.reportInstanceId ?? "不可用"}（当前报告服务实例）`);
    console.log(`storage.ids() = ${JSON.stringify(snapshot.storageIds)}（null 表示存储不可用；[] 表示新的空存储）`);
}

export async function saveObservations(): Promise<void> {
    await writeFile("runs/reportdesk/observations.json", JSON.stringify(snapshots, null, 2) + "\n");
}
