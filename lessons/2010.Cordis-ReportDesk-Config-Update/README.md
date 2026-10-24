<!-- Generated from LearningTask.ipynb by scripts/render-lessons.py. -->

[运行此课 Notebook](LearningTask.ipynb) · [课程目录](../../README.md)

**Cordis 2010 · 运行中的配置更新**

[课程目录](../../README.md) · [环境与运行](../../SETUP.md)

# 本课导览

只更新一次摘录长度，区分配置、Fiber 身份、服务实例与累计存储。

本课先给具体代码和预期行为，再沿本课固定版本的源码解释原因。读到所选路径即可，不要求通读整个内核。

本课延续前课的 ReportDesk，所有文件与依赖独立保存在当前目录。先在本课目录安装依赖，再按 00 → 01 执行 Notebook，或使用 `npm run demo` 运行完成参考。

建议按 2–3 小时安排首次阅读、运行与回看；可分多次完成。

# 源码与阅读导航

固定 **Cordis 4.0.0-rc.10 / c261dd2c13d65b1994adb1cdc10d7dba61542523**；上游提交日期 2026-10-10 UTC，本次访问 2026-10-22。本地源码是本课运行时加载的可编辑文件；初始哈希与第一方链接见 [source-index.json](materials/source-index.json)。

| 资料类型与入口 | 指定范围与停止点 | 用途 |
|---|---|---|
| 本课应用：[main.ts](examples/01-reportdesk/main.ts)、[report-service.ts](app/report-service.ts) | M1 摘录；入口读到 after 完成，服务读到 apply 返回清理函数 | 看配置交给谁、影响哪一步 |
| 官方源码：[registry.ts](materials/cordis/src/registry.ts) | 193–212 行，读到 wrapped 返回 | 找到句柄背后的 Fiber |
| 官方源码：[events.ts](materials/cordis/src/events.ts) | 62–74 行；waterfall 按需复看 121–136 行 | 连接配置解析与 next/restart |
| 官方源码：[fiber.ts](materials/cordis/src/fiber.ts) | 依 M2 选段：update → restart → _refresh/_setEpoch → 清理与执行 → await；读到本次 ACTIVE | 解释同一 Fiber 上的实例更替 |
| 官方源码：[service.ts](materials/cordis/src/service.ts)、[reflect.ts](materials/cordis/src/reflect.ts) | 只看 M2.5 引用的登记与清理位置 | 确认旧服务怎样撤下 |
| 官方测试（选读）：[fiber.spec.ts](materials/cordis/fiber.spec.ts) | 198–216 行，止于 wrapped fiber 第三次 callback 断言 | 对照更新后再次执行并收到新配置 |

正文的源码围栏是阅读摘录，注明省略并统一展示缩进。需要运行的是 M1 的两个 Code cell。测试文件仅供阅读，本课没有安装完整上游测试工程。研究输入和选题依据在 [资料说明](materials/README.md)。

# 沿场景理解源码

先在本课目录执行 `npm ci` 和 `npm run check`。Notebook 使用 JavaScript（jslab），按 00 → 01 运行；终端使用 `npm run demo`，两者加载同一份本课源码。各阶段的观察说明紧邻代码。

运行生成的报告、状态快照和声明位于本课 `runs/`。重跑会替换同一用途的结果；需要比较时先另行保存。只修改本课文件即可，不依赖其他课程的安装目录。VS Code 请单独打开本课目录，再选择对应调试配置。

## M1 · 让报告配置生效

50 分钟。沿同一应用的一次更新，看新配置如何影响生成结果。完整代码已准备，先读三处业务代码，再运行一次。

### M1.1 区分每份输入与插件配置

`sampleJobs()` 从 fixtures 读出台灯、水杯两份输入，每份包含 `title`、`text`、`includeExcerpt: true`。这些是每次 `generate(id, input)` 的业务数据；本课新增的 `excerptLength` 属于报告插件的运行配置，两份报告共同使用它。

下面摘自 [main.ts](examples/01-reportdesk/main.ts)，省略导入、通知/格式装载和日志。`app` 是根 Context；`storageProvider` 提供内存存储，`reportProvider` 声明 `inject: ["storage"]`。`app.plugin` 返回插件装载句柄，`report` 保存这个句柄。`runBatch` 会逐份调用报告服务、写快照、发出完成事件；本批结束后卸载一次性的批处理插件。

```ts
const jobs = await sampleJobs();
const app = new Context();
const storage = app.plugin(storageProvider);
const initialConfig = { excerptLength: 20 };
const report = app.plugin(reportProvider, initialConfig);
await storage;
await report;
await runBatch(app, jobs, "before");

const nextConfig = { excerptLength: 8 };
await report.update(nextConfig);
await runBatch(app, jobs, "after");
```

`initialConfig` 与 `nextConfig` 是两个对象。`report.update(nextConfig)` 把后一份配置交给同一个插件装载记录；`await` 等本例更新过程完成，随后才创建 after 批次。这里没有第二次 `app.plugin(reportProvider)`，也没有在应用中手工改旧服务的字段。M2 再解释句柄与实际 Fiber 的关系。

### M1.2 配置进入这一轮 ReportService

[report-service.ts](app/report-service.ts) 声明 `ReportConfig`，只有一个数值字段 `excerptLength`。这是 TypeScript 类型约束，运行时不会自动校验输入。本课入口提供固定的正整数 20 和 8，插件未声明 `Config` 校验器。

插件入口接收 `(ctx, config)`，其中 ctx 是本报告插件的 Context，config 来自本轮装载或更新。下面是完整 apply；日志和返回的清理函数用于辨认每轮执行：

```ts
apply(ctx: Context, config: ReportConfig): () => void {
    const service = new ReportService(ctx, config);
    console.log(`reportProvider.apply：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（本轮新建的报告服务）`);
    return () => {
        console.log(`reportProvider 清理：instanceId = ${service.instanceId}，excerptLength = ${config.excerptLength}（结束这一轮 apply）`);
    };
}
```

构造器的 `public readonly config` 同时声明属性并保存传入值；readonly 是类型检查约束，不会冻结对象。`super(ctx, "report")` 把服务登记为本插件提供的 report。每次构造时 `instanceId` 加 1，便于观察重建。

```ts
constructor(ctx: Context, public readonly config: ReportConfig) {
    super(ctx, "report");
}
```

`generate` 沿用上一课的 `this.ctx.waterfall("report/format", input, terminal)`。唯一生成规则增量是终点调用 `renderReport(input, this.config.excerptLength)`。在 [report.ts](shared/report.ts) 中，首段经 `Array.from(firstParagraph).slice(0, excerptLength).join("")` 取前若干 Unicode 码点，再拼成 Markdown。空白和标点也占摘录长度；上限超过首段长度时保留整个首段。quote/footer 继续包裹最终正文，storage 保存包装结果。

因此每轮 apply 创建的服务都持有本轮 config；更新后重新执行 apply，才会出现使用长度 8 的新服务。

### M1.3 运行同一份入口

完整入口还会装载 quote、footer、通知与统计，并等待它们准备好。两批之间只更新 report；最终 finally 统一释放插件。

先运行 00。

```javascript
// 00 · ReportDesk：初始化本课 Notebook 入口。
var path = require("node:path");
var fs = require("node:fs");
var taskName = "2010.Cordis-ReportDesk-Config-Update";
var taskRoot = path.basename(process.cwd()) === taskName ? process.cwd() : path.join(process.cwd(), taskName);
if (!fs.existsSync(path.join(taskRoot, "package.json"))) throw new Error("请从仓库根或本课目录打开 Notebook。");
var reportdesk = require(path.join(taskRoot, "shared/notebook.cjs"));
console.log("本课目录：", taskRoot);
```

00 成功后执行 01。关注更新入口前后的两条 apply 日志，以及其间旧实例的清理；每批报告仍有引用和页尾。

```javascript
// 01 · ReportDesk：一次更新，观察配置、服务实例与累计存储。
reportdesk.run();
```

### M1.4 把输出对应回对象

以下是按固定代码推导的预期，用于读实际输出，不是预填的学习记录。

| 观察项 | before 完成 | after 完成 |
|---|---|---|
| `report.uid / report.state` | 2 / ACTIVE | 2 / ACTIVE |
| `report.config.excerptLength` | 20 | 8 |
| 当前 report 服务 `instanceId` | 1 | 2 |
| 当前服务 `config.excerptLength` | 20 | 8 |
| `storage.instanceId` | 1 | 1 |
| `storage.ids()` | before-lamp、before-bottle | 在前两项后增加 after-lamp、after-bottle |
| 完成统计 | 累计 2 | 累计 4 |

中间应看到旧实例 1 的清理，再出现实例 2 的 apply；程序最后的实例 2 清理属于 finally 退出。这里的数字由本例装载顺序决定，重要的是对应身份是否变化。实例编号与配置变化说明报告服务重新创建；同一 storage 仍持有旧报告。before 的 Markdown 不会被更新操作重新生成，after 使用新配置生成新的 id。

`runs/reportdesk/before-lamp.md` 与 `after-lamp.md` 可以直接比较；水杯是相同路径的第二份输入。`observations.json` 记录等待完成后的状态，所以表中的 ACTIVE → ACTIVE 不表示更新中间没有卸载和加载。

## M2 · 沿一次更新读到新一轮 apply

75 分钟。以 `report.update({ excerptLength: 8 })` 为唯一现场：更新时 report 已经 ACTIVE，storage 仍可用。先确定接收更新的对象，再跟配置、重启与等待。

### M2.1 report 句柄和实际 Fiber

M1 的 `report` 来自 `app.plugin(reportProvider, initialConfig)`。Registry 为 `reportProvider.apply` 保存一份运行描述 runtime，再创建负责本次装载的 Fiber。下面省略 callback 查找、校验和 runtime 缓存，保留创建与返回部分：

[registry.ts](materials/cordis/src/registry.ts)，207–212 行（阅读摘录，缩进统一为 4 空格）：

```ts
const fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack)
const wrapped = Object.create(fiber) as Fiber & PromiseLike<Fiber>
wrapped.then = (onFulfilled, onRejected) => {
    return fiber.await().then(onFulfilled, onRejected)
}
return wrapped
```

`wrapped` 是一个新对象，内部原型指向 fiber；本例入口变量 `report` 得到它。`wrapped.then` 让 `await report` 转去等待实际 `fiber.await()`；这与 2009 M3.6 的 `Object.create(base)` 相同，继承属性不等于复制属性。

Fiber 构造时执行 `this.ctx = this.context = parent.extend({ fiber: this })`（fiber.ts 135–136 行）：创建本插件 Context，并把它的 fiber 指回当前实际 Fiber。因此更新方法中的 `this.ctx.fiber` 能从包装句柄回到实际运行记录。下面用“实际 Fiber”指这一对象，避免把 report 句柄和状态存储混在一起。

| 本例对象 | 来源与职责 |
|---|---|
| `report` | app.plugin 返回的 wrapped；提供 update、await 等操作入口 |
| `report.ctx.fiber` | 实际 Fiber；保存 config、状态与本轮清理动作 |
| `runtime.callback` | 本例是 reportProvider.apply；重新执行时仍调用它 |
| `service` | 每次 apply 中 new ReportService 创建；其 config 用于生成报告 |
| 实际 Fiber 的 `_runner` | 构造时创建的执行记录；epoch 保存运行目标标识，execute 在启动一轮时调用插件入口 |
| 实际 Fiber 的 `_disposables` | 本轮需要结束时执行的清理函数列表；服务登记和 apply 返回值向它加入清理动作 |

Fiber 构造器的 `public config` 参数属性接收 initialConfig；这与 M1.2 的参数属性写法相同。后文的 update 会替换该字段。

更新会继续使用同一个实际 Fiber。真正变化的是它保存的配置，以及 apply 创建的服务实例。

### M2.2 update 先解析，再保存传入配置

以下是本版本完整 update。`this` 可以是 report 包装句柄，所以第一句取 `this.ctx.fiber`，后续字段写入都落到实际 Fiber。`loaded` 在本例为 true；INACTIVE 是源码用来表示未加载目标的字符串常量。

[fiber.ts](materials/cordis/src/fiber.ts)，486–506 行（阅读摘录，缩进统一为 4 空格）：

```ts
update(config: any, noSave = false): Awaitable<void> {
    const fiber = this.ctx.fiber
    fiber.assertActive()
    const loaded = fiber._runner.epoch !== INACTIVE
    const resolved = loaded ? fiber._resolve(config) : undefined
    if (!noSave) fiber.context.emit('internal/commit', fiber, config)
    fiber.config = config
    fiber._error = undefined
    const restart = () => fiber.restart()
    const result = loaded
        ? fiber.context.waterfall(fiber, 'internal/update', resolved, restart)
        : restart()
    // a listener may veto the restart, in which case there is nothing to await
    if (result === undefined) return
    const task = Promise.resolve(result)
    // the failure is already reported by the fiber, so mark it handled here:
    // a caller that drops the result cannot turn it into an unhandled
    // rejection, while `await update()` still observes it
    task.catch(() => {})
    return task
}
```

本例先把新配置交给 `_resolve(config)`，成功后发出 `internal/commit`，再赋给 `fiber.config`。commit 在这里是内部通知，本课没有给它注册持久化处理，不代表写入文件。清空 `_error` 后，代码准备 `restart` 闭包，并将它作为 internal/update 的最后一个参数；本次返回的 Promise 最后会交还 M1 的 await。

`_resolve` 的实现很短：

[fiber.ts](materials/cordis/src/fiber.ts)，229–231 行（阅读摘录，缩进统一为 4 空格）：

```ts
private _resolve(config: any) {
    return this.context.waterfall('internal/config', this, () => config)
}
```

终点 `() => config` 返回本次参数。根 EventsService 在构造时登记了配置回调：

[events.ts](materials/cordis/src/events.ts)，71–73 行（阅读摘录，缩进统一为 4 空格）：

```ts
this.on('internal/config', (fiber, next) => {
    return resolveConfig(fiber.runtime!, next())
})
```

回调先调用 next 取得配置，再交给 fiber.ts 的 `resolveConfig(runtime, config)`。该函数第一条判断为 `if (!runtime.Config) return config`（34–35 行）。本课 reportProvider 没有 Config，因此原样返回同一个对象，不做深复制、默认值合并或运行时校验。到这里就足以读本课路径。

### M2.3 internal/update 怎样走到 restart

上一节的调用为 `fiber.context.waterfall(fiber, "internal/update", resolved, restart)`。和上一课业务格式调用相比，这里在事件名前显式放入实际 fiber，因此 waterfall 的 `thisArg` 是该 Fiber；回调显式参数仍为 `(resolved, next)`。`resolved` 是长度 8 的配置，终点 restart 来自 update 内部的箭头闭包。

根 EventsService 已登记下面的全局回调；这是进入插件局部更新处理的转接入口：

[events.ts](materials/cordis/src/events.ts)，62–69 行（阅读摘录，缩进统一为 4 空格）：

```ts
this.on('internal/update', function (config, next) {
    const cbs = [...this._hooks['internal/update'] || []]
    const _next = () => {
        const cb = cbs.shift() ?? next
        return cb.call(this, config, _next)
    }
    return _next()
}, { global: true, prepend: true })
```

`this` 是前面显式传入的实际 Fiber；`this._hooks["internal/update"]` 是它自己的局部更新回调集合。本课 reportProvider 没有登记局部更新回调，所以 cbs 为空，`cbs.shift() ?? next` 取到参数 next。

这个 next 是 waterfall 为当前全局回调创建的继续函数。`cb.call(this, config, _next)` 调用它后，派发进入终点 restart；传入的额外参数不被无参的 next/restart 使用。restart 的箭头闭包捕获实际 fiber，执行 `fiber.restart()`。返回的等待结果沿 `_next → 全局回调 → waterfall → update` 回到调用方。

本课因此进入默认重启路径。局部更新回调也可以自行处理配置并结束返回；所以不能把“任意 update 都会重建服务”作为通用结论。

### M2.4 restart 改变执行版本，启动旧轮清理

[fiber.ts](materials/cordis/src/fiber.ts)，478–484 行（阅读摘录，缩进统一为 4 空格）：

```ts
async restart() {
    const fiber = this.ctx.fiber
    fiber.assertActive()
    fiber._revision++
    fiber._refresh()
    await fiber.await()
}
```

`assertActive()` 在这里检查 Fiber 尚未被永久 dispose；它不是断言 state 必须等于 ACTIVE。`_revision` 是实际 Fiber 的内部重启计数；加 1 后 `_refresh()` 为新的执行目标计算标识 epoch。`this.inject` 保存本插件声明的依赖；`this._store` 保存当前可用依赖的登记项。本例 `_store["storage"]` 中的 `impl.fiber` 指向提供 storage 的 Fiber，供下面组合依赖身份：

[fiber.ts](materials/cordis/src/fiber.ts)，389–400 行（阅读摘录，缩进统一为 4 空格）：

```ts
_refresh() {
    let epoch = `${this._revision}`
    for (const name of Object.keys(this.inject)) {
        const impl = this._store[name]
        if (!impl) {
            epoch = INACTIVE
            break
        }
        epoch += ':' + impl.fiber.uid
    }
    this._setEpoch(epoch)
}
```

本例只依赖 storage。初始 `_revision=0`，storage 所属 Fiber 的 uid=1，epoch 为 `"0:1"`；restart 后 revision=1，依赖身份仍为 1，新 epoch 为 `"1:1"`。这个字符串组合“重启计数与依赖身份”，用来判断运行目标是否变化；它不是时间戳，也不是 report 的 uid。

`_setEpoch` 保存新标识。当前没有尚未结束的 inertia，旧 epoch 又不是 INACTIVE，因此走下面的卸载分支（省略相等检查、错误及加载分支；完整实现见 fiber.ts 402–418 行）：

```ts
this._runner.epoch = epoch;
this._updateState(() => {
    this.inertia = this._unload();
    return FiberState.UNLOADING;
});
```

`inertia` 保存当前阶段正在进行的 Promise。这里开始结束旧轮执行，没有新建 Fiber，也没有调用 report.dispose 把 uid 置空。

### M2.5 旧轮清理后，回到同一个 apply

`_unload()`（[fiber.ts](materials/cordis/src/fiber.ts) 447–467 行）取出并清空 `_disposables`，等待这些清理函数完成，再清空本轮 store。这里的清理函数通过 Promise.all 等待，不能把清理列表的书写次序当成严格串行次序。

本课这一轮主要有两类清理：`new ReportService` 在 `super(ctx, "report")` 中登记服务时附带的撤下动作，以及 apply 返回的日志函数。前者来自 [service.ts](materials/cordis/src/service.ts) 33 行调用 provide，以及 [reflect.ts](materials/cordis/src/reflect.ts) 177–204 行的 effect；其返回函数删除旧 report 登记。后者只是记录“旧轮结束”，并不负责删除服务。下面是 provide 登记的返回函数；`key` 在本例是 report 服务登记使用的键，`this.store` 是 ReflectService 的共享服务登记表（不同于 Fiber 的本轮服务视图 store）。只在这里核对撤下动作，依赖通知的内部遍历沿用 2008 的接口行为。

```ts
return async () => {
    delete this.store[key];
    const fibers = this.notify([name]);
    await Promise.allSettled(fibers.map(fiber => fiber.await()));
    delete this.ctx.fiber.store![name];
};
```

以上摘自 reflect.ts 197–203 行，省略一条注释并调整缩进；先从共享表撤下，再等待受影响的依赖者完成状态变化，最后移除本 Fiber 的服务引用。

当前目标 epoch 已是 `"1:1"`，不是 INACTIVE，因此清理完成后进入这一段：

[fiber.ts](materials/cordis/src/fiber.ts)，459–467 行（阅读摘录，缩进统一为 4 空格）：

```ts
this.store = undefined
this._updateState(() => {
    if (this._runner.epoch === INACTIVE) {
        this.inertia = undefined
    } else {
        this.inertia = this._reload()
        return FiberState.LOADING
    }
})
```

`_reload()`（420–445 行）以 `this.store = { ...this._store }` 从依赖登记表浅复制出本轮服务视图；本轮自己提供的 report 之后也会登记在这个视图中。经过一次 await 后，若目标仍是本轮值，就执行 `await this._execute(this._runner)`。`_execute` 通过 `runner.execute.call(this)` 调用构造时保存的 execute，使其中的 this 是实际 Fiber。这个 execute 的普通函数插件路径等价于以下选段拼接（省略构造器插件分支；原文件 151–162 行）：

```ts
execute: function (this: Fiber) {
    const config = this._resolve(this.config);
    return runtime.callback(this.ctx, config);
}
```

`this: Fiber` 是 TypeScript 的 this 类型声明，不是一个运行实参。这里再次解析实际 Fiber 保存的配置；本例仍原样得到长度 8 的对象。runtime.callback 是同一个 reportProvider.apply，但这次收到新 config，创建实例 2。返回的清理函数又被 _execute 收集，留给这一轮结束时使用。

storage、quote、footer、通知和统计都是 app 下独立装载的其他插件，本次重启没有卸载它们。before 批处理已经释放；after 批处理在更新等待完成后才创建，因此直接读取新报告服务。

### M2.6 为什么 await update 后可以继续生成

在本次目标未变化、执行成功的情况下，_reload 最后把 inertia 清为 undefined，状态计算为 ACTIVE。restart 尾部的 `await fiber.await()` 一直等到当前阶段和可能接续的阶段都结束：

[fiber.ts](materials/cordis/src/fiber.ts)，470–476 行（阅读摘录，缩进统一为 4 空格）：

```ts
async await() {
    while (this.inertia) {
        await this.inertia
    }
    if (this._error) throw this._error
    return this
}
```

这是一个普通 async 方法，不是 JavaScript await 关键字本身。循环每次等待当前 inertia；旧轮卸载结束时可能已把 inertia 换成新轮加载的 Promise，因此还需要继续检查。成功完成后，restart 的 Promise 兑现，update 返回的等待也结束，M1 才运行 after 批次。

| 本次路径 | 实际 Fiber 上发生什么 | 应用含义 |
|---|---|---|
| update 解析成功 | config 指向 nextConfig | 保存下一轮所需配置 |
| restart / _setEpoch | revision 0 → 1；开始 UNLOADING | 结束旧轮，uid 保持 |
| _unload 完成 | 旧 report 登记撤下；开始 LOADING | 重新执行同一插件入口 |
| apply 再次执行 | 新服务 instanceId=2，配置长度 8 | 新报告使用新规则 |
| await 完成 | inertia 清空，状态 ACTIVE | after 批次可以继续 |

把这条路径放回业务：输入没有变化，格式监听仍在；一次更新替换了报告生成所用的服务实例，存储中的历史结果保留。

### M2.7 按需用断点连接这次调用

独立入口仍为 [examples/01-reportdesk/main.ts](examples/01-reportdesk/main.ts)。仓库根与本课各自的 launch.json 都提供 **Cordis 2010 · 01 · 报告配置更新**，指定本课 cwd 和 `--import tsx`。

可在 main.ts 的 `await report.update(nextConfig)` 处停下，再在本课 `materials/cordis/src/fiber.ts` 的 update 与 `app/report-service.ts` 的 apply 内设断点。前者查看传入 config 和 `this.ctx.fiber.config`，后者查看本轮 config 与新服务 instanceId。若只想读主路径，到第二次 apply 即可结束调试；直接运行 01 已能观察完整结果。

源码修改后重新启动会加载本课文件。

# 本课收束

update 解析并保存配置，通过更新处理触发 restart。旧轮资源释放后，同一个 Fiber 以新配置再次执行；报告服务实例变化，独立 storage 仍保存之前的结果。
