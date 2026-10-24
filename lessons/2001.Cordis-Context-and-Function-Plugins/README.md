<!-- Generated from LearningTask.ipynb by scripts/render-lessons.py. -->

[运行此课 Notebook](LearningTask.ipynb) · [课程目录](../../README.md)

**Cordis 2001 · Context 与函数插件的装载路径**

[课程目录](../../README.md) · [环境与运行](../../SETUP.md)

# 本课导览

用函数插件认识 Context、配置、Runtime、Fiber，以及 await 装载句柄的含义。

本课先给具体代码和预期行为，再沿本课固定版本的源码解释原因。读到所选路径即可，不要求通读整个内核。

依次观察三个实验：01 中插件 Context 与父级的关系；02 中函数身份与 Runtime 复用；03 中异步初始化与等待结果。先执行初始化 00，再执行或修改 01–03。

建议按 2–3 小时安排首次阅读、运行与回看；可分多次完成。

# 阅读导航

本课运行 **`cordis@4.0.0-rc.10` 的本地源码**，依赖指向 [materials/cordis](materials/cordis/package.json)；分模块源码位于 `materials/cordis/src/`，可直接阅读和调试分模块实现。源码固定为上游提交 [`f8ea3cd50f1a5724e8e715995bcde131c9c12b2c`](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c)，提交日期 2026-09-08，2026-10-09 重新核验。上游 [核心 README](materials/cordis/README.md) 提醒 API 仍在变化；本课结论以此版本和独立示例为范围。

下面的源码与测试保留上游原始内容，统一放在 `materials/cordis/`；正文直接提供精选源码摘录与注释，也可点击本地文件阅读完整实现。摘录中的“讲解”注释为课程说明，省略处明确标出；原文件保持原始内容。逐文件原始 URL 与 SHA-256 在 [source-index.json](materials/source-index.json)。**主要讲解在本 Notebook**，阅读导航只帮助定位。

| 资料 / 类型 | 指定范围与停止点 | 用途 |
|---|---|---|
| [本课示例索引](examples/README.md)，自编可运行示例 | 先运行 Notebook 的 01–03 实验；独立文件用于继续调试 | 建立对象关系与可观察顺序 |
| [context.ts](materials/cordis/src/context.ts)，上游源码 | `constructor` 36–49；`extend` 55–63；另看显示名称 51–53 | 根对象怎样创建、插件上下文怎样派生 |
| [registry.ts](materials/cordis/src/registry.ts)，上游源码 | 函数插件与 Runtime 82–99；类型辅助 102–122；`resolve` 144–151；`plugin` 193–214 | 区分签名、登记记录、每次装载和返回包装 |
| [reflect.ts](materials/cordis/src/reflect.ts)，上游源码 | 构造器 140–150；`mixin` 241–267，读到 getter 绑定方法停止 | 为什么 `root.plugin` 可以转到注册服务 |
| [fiber.ts](materials/cordis/src/fiber.ts)，上游源码 | 构造器 122–178；`_execute` 229–249；`_setEpoch` 399–415、`_reload` 417–437、`await` 462–469 | 插件参数、执行位置和异步完成 |
| [plugin.spec.ts](materials/cordis/tests/plugin.spec.ts)，上游测试 | `apply functional plugin` 8–16；`context inspect` 50–76 只跟 root 与命名函数 foo | 对照框架作者检验的行为 |

其他类插件、对象插件、依赖注入分支可在以后遇到时再读。本课跟随函数分支即可；这些文件不是完整仓库，本次没有运行上游整套 Vitest 测试。

**环境兼容说明**：上游源码的相对导入没有扩展名，且包含枚举等 TypeScript 语法，运行入口使用 `node --import tsx` 加载原始模块。`npm run check` 先从本地源码生成声明文件与源码映射到 `runs/cordis-types/`，再严格检查示例；编辑器可据此跳到原始 `.ts` 文件。生成声明使用 `noCheck`，不表示上游内部实现通过本课的严格检查。源码改动后重跑 `npm run check` 更新类型与跳转信息。本课 `moduleResolution: "Bundler"` 用于解析无扩展名声明，`verbatimModuleSyntax: false` 兼容上游混合的值与类型导入。想核对这一配置时，选读 [TypeScript 官方说明](https://www.typescriptlang.org/tsconfig/moduleResolution.html) 中 `bundler` 对无扩展名路径的支持，读到这点即可。官方页面更新时间未确认，访问日期 2026-10-09。

# 源码导读与运行

先在本课目录执行 `npm ci`、`npm run check`。Notebook 使用 JavaScript（jslab）内核，00 准备 runCordis；01–03 把各自的函数交给独立 Node 进程，并加载本课 Cordis。源码摘录用于阅读，Code cell 用于运行。

终端可执行 `npm run demo` 依次运行三个独立文件；单独运行见 [examples/README.md](examples/README.md)。结果保存在本课 runs 中；重跑同一实验前保存希望保留的对比结果。

```javascript
// 示例 00：核对任务运行目录、依赖版本与静态类型检查
{
    const fs = require("node:fs");
    const path = require("node:path");
    const cp = require("node:child_process");
    if (path.basename(process.cwd()) !== "2001.Cordis-Context-and-Function-Plugins") {
        throw new Error("请在本课目录打开 Notebook；当前 cwd：" + process.cwd());
    }
    console.log("cwd（本课运行目录） =", process.cwd());
    console.log("Node（执行 TS 文件的运行时） =", process.version);
    console.log("cordis（实际已安装包版本） =", JSON.parse(fs.readFileSync("node_modules/cordis/package.json", "utf8")).version);
    console.log("TypeScript（项目静态检查版本） =", cp.execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--version"], { encoding: "utf8" }).trim());
    console.log("cordis（本地源码入口） =", fs.realpathSync("node_modules/cordis/src/index.ts"));
    cp.execFileSync("npm", ["run", "check"], { encoding: "utf8", cwd: process.cwd() });
    console.log("类型检查：通过（静态类型结果，与下面的运行值分开）");
}

// 示例 00：把实验函数交给独立进程，后续单元只写实验内容。
var runCordis = function (number, experiment) {
    const cp = require("node:child_process");
    console.log(cp.execFileSync(process.execPath, ["examples/shared/run-experiment.mjs", number], {
        input: experiment.toString(),
        cwd: process.cwd(),
        encoding: "utf8",
    }));
};
```

## 01：一个 Context 装入一个函数插件

约 40 分钟。`greeting(ctx, options)` 是由 Cordis 调用的函数插件：`ctx` 是本次装载使用的上下文，`options` 是传入的配置。`root.plugin(...)` 返回本次装载的操作入口 `handle`；`await handle` 等初始化结束，末尾的 `dispose()` 用于收尾。

先保持 `useDerivedParent = false` 运行。此时从根 Context 装载插件。随后改为 `true` 再运行：`root.extend()` 先派生出一个新的父级 Context，再由它装载插件。

观察 `parent === root`、`ctx === parent` 和 `ctx.root === root`。这三项分别回答“从哪个父级装载”“插件是否复用父级对象”“是否仍属于同一个根”。也可以修改 `config.label`，观察配置值的传递。

```javascript
// 实验 01：改变插件父级，观察 Context 派生与配置传递
runCordis("01", async ({ Context }) => {
    const useDerivedParent = false; // 改为 true，再比较三项对象身份。
    const root = new Context();
    const parent = useDerivedParent ? root.extend() : root;
    const config = { label: "第一个插件" };
    let receivedFiber;

    function greeting(ctx, options) {
        receivedFiber = ctx.fiber;
        console.log("options.label（收到的配置值） =", options.label);
        console.log("options === config（是否同一配置对象） =", options === config);
        console.log("ctx === parent（插件是否直接复用父级） =", ctx === parent);
        console.log("ctx.root === root（是否仍指向同一个根） =", ctx.root === root);
    }

    console.log("parent === root（装载父级是否为根） =", parent === root);
    const handle = parent.plugin(greeting, config);
    await handle;
    console.log("ctx.fiber === handle.ctx.fiber（是否对应本次装载） =", receivedFiber === handle.ctx.fiber);
    await handle.dispose();
});
```

### 对照输出中的具体对象

默认配置下，`parent === root` 为 `true`，`ctx === parent` 为 `false`，`ctx.root === root` 为 `true`。改用派生父级后，第一项变成 `false`，后两项仍分别是 `false`、`true`：每次装载会创建插件自己的 Context，派生链上的根仍是同一个对象。

`options === config` 为 `true`，说明本例没有配置转换器时传递了同一个配置对象。`ctx.fiber === handle.ctx.fiber` 为 `true`，将插件收到的 Context 与这次装载关联起来。**Fiber** 在这里表示一次插件装载的运行对象；根 Context 也有自己的 Fiber，不与插件的 Fiber 混为一谈。

### 沿源码找到参数从哪里来

先看 Context 怎样保存根对象和派生新对象，再看 Fiber 怎样把自己的 Context 和配置交给插件函数。下面只摘录这条路径需要的语句，“讲解”注释帮助对照实验中的变量。

**Context 的构造器保存根对象。**

来源：[context.ts](materials/cordis/src/context.ts)，原文件第 39–42 行。

```typescript
// 讲解：self 是返回给调用方的根 Context 代理。
const self = new Proxy<this>(this, ReflectService.handler)
// 讲解：root 字段保存这一个根对象。
this.root = self
this.baseUrl = undefined
// 讲解：根 Context 也有自己的 Fiber。
this.fiber = new Fiber(self, {}, Object.create(null), null, () => [])
```

**`Context.extend()` 派生新对象。**

来源：[context.ts](materials/cordis/src/context.ts)，原文件第 55–63 行。

```typescript
extend(meta = {}): this {
    const shadow = Reflect.getOwnPropertyDescriptor(this, symbols.shadow)?.value
    // 讲解：新对象沿原型链复用父级能力，身份与父级不同。
    const self = Object.create(getTraceable(this, this))
    for (const prop of Reflect.ownKeys(meta)) {
        // 讲解：把本次派生新增的属性定义到新对象上。
        Object.defineProperty(self, prop, Reflect.getOwnPropertyDescriptor(meta, prop)!)
    }
    if (!shadow) return self
    return Object.assign(Object.create(self), { [symbols.shadow]: shadow })
}
```

**`Fiber` 的构造器为一次插件装载准备 Context 和配置。**

下面分别摘出两个位置的语句：

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 134–135 行。

```typescript
// 讲解：分配本次装载的编号。
this.uid = parent.registry.counter
// 讲解：parent 是装载父级；新增的 fiber 指回当前 Fiber。
this.ctx = this.context = parent.extend({ fiber: this })
```

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 173–174 行。

```typescript
// 讲解：本例未设置配置转换器，resolveConfig 保留原配置对象。
this.config = resolveConfig(runtime, config)
// 讲解：刷新状态，安排后续执行。
this._refresh()
```

**真正调用普通函数插件时**，执行器使用构造器中保存的 `_runner.execute`。其中函数分支的调用如下；它发生在后续调度中：

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 158 行。

```typescript
// 讲解：把本次装载的 Context 和配置交给插件函数。
return runtime.callback(this.ctx, this.config)
```

派生 Context 沿原型链找到同一个 `root`，同时通过自己的 `fiber` 区分这次装载。实验 03 再跟踪框架何时调用这里的执行器。

### 对应上游测试

上游 `apply functional plugin` 是验证函数插件装载行为的单元测试。`mock.fn()` 记录框架是否调用了插件及其参数；这里阅读断言，不需要运行整套测试。

测试检查调用次数与配置内容；本课实验的 `===` 进一步观察对象身份。

来源：[plugin.spec.ts](materials/cordis/tests/plugin.spec.ts)，原文件第 8–16 行。

```typescript
it('apply functional plugin', async () => {
    const root = new Context()
    // 讲解：记录调用，不额外实现插件业务。
    const callback = mock.fn()
    const options = { foo: 'bar' }
    // 讲解：等装载完成后再检查记录。
    await root.plugin(callback, options)

    // 讲解：插件只执行一次。
    expect(callback.mock.calls).to.have.length(1)
    // 讲解：deep.equal 比较配置内容，不证明引用相同。
    expect(callback.mock.calls[0].arguments[1]).to.deep.equal(options)
})
```

## 02：把类型声明、运行转发与装载对象接起来

约 45 分钟。**Runtime** 是注册服务为一个插件函数保存的登记记录，持有函数、显示名称和已装载的 Fiber 列表。

先保持 `reuseSameFunction = true`：两次装载共用同一个 `reporter` 函数。再改为 `false`，让 `makeReporter()` 再创建一个函数。两个函数的名字和函数体相同，但对象身份不同。

比较登记数、Runtime 身份、第一个函数的装载数，以及两个插件 Context 的身份。由这个变化判断：框架按函数对象登记，还是按函数名字登记。

```javascript
// 实验 02：改变函数身份，观察 Runtime 复用与 Fiber 数量
runCordis("02", async ({ Context }) => {
    const reuseSameFunction = true; // 改为 false：新建代码、名字相同的函数。
    const root = new Context();
    function makeReporter() {
        return function reporter(ctx, config) {
            console.log("本次配置与 Fiber 编号 =", { label: config.label, uid: ctx.fiber.uid });
        };
    }
    const firstPlugin = makeReporter();
    const secondPlugin = reuseSameFunction ? firstPlugin : makeReporter();
    const first = root.plugin(firstPlugin, { label: "A" });
    const second = root.plugin(secondPlugin, { label: "B" });
    await Promise.all([first, second]);

    console.log("firstPlugin === secondPlugin（是否同一个函数） =", firstPlugin === secondPlugin);
    console.log("两个函数名 =", [firstPlugin.name, secondPlugin.name]);
    console.log("root.registry.size（不同插件函数的登记数） =", root.registry.size);
    console.log("first.runtime === second.runtime（是否共用登记记录） =", first.runtime === second.runtime);
    console.log("第一个函数的装载数 =", root.registry.get(firstPlugin).fibers.length);
    console.log("first.ctx === second.ctx（是否共用插件上下文） =", first.ctx === second.ctx); // 每次registry的时候都会产生新的Fiber对象，每个新的Fiber对象内部都会用parentContext.extend({faiber: this})拓展新的context
    console.log("first.uid !== second.uid（是否有独立运行编号） =", first.uid !== second.uid);
    await first.dispose();
    await second.dispose();
});
```

### 一个登记记录、两次装载

| 观察项 | 复用同一函数：`true` | 创建同名新函数：`false` |
|---|---|---|
| `firstPlugin === secondPlugin` | `true` | `false` |
| `root.registry.size` | 1 | 2 |
| `first.runtime === second.runtime` | `true` | `false` |
| 第一个函数的装载数 | 2 | 1 |
| `first.ctx === second.ctx` | `false` | `false` |
| `first.uid !== second.uid` | `true` | `true` |

两个函数都叫 `reporter`，改变身份就会改变登记数。配置 A/B 决定本次传入的值；函数对象身份决定是否复用 Runtime。每次调用 `plugin` 都创建 Fiber，因此插件 Context 和运行编号始终独立。

下面的 `callback` 就是用作登记键的函数。

**`RegistryService.resolve()` 确定登记用的函数对象。**

来源：[registry.ts](materials/cordis/src/registry.ts)，原文件第 144–150 行。

```typescript
resolve(plugin: Plugin): Function | undefined {
    // plugin.apply may throw
    try {
        // 讲解：函数插件直接解析为它自身。
        if (typeof plugin === 'function') return plugin
        if (isApplicable(plugin)) return plugin.apply
    } catch {}
}
```

**`RegistryService.plugin()` 先查登记记录，再创建本次装载对象。**

来源：[registry.ts](materials/cordis/src/registry.ts)，原文件第 195、199–207 行。

```typescript
// 讲解：本课传入函数插件，callback 就是该函数。
const callback = this.resolve(plugin)
// ……省略有效性与状态检查……
// 讲解：Map 的键是函数对象，不是函数名字。
let runtime = this._internal.get(callback)
// 讲解：同一个函数已登记时复用已有 Runtime。
if (!runtime) {
    let name = plugin.name
    if (name === 'apply') name = undefined
    // 讲解：name 用于显示，fibers 记录该函数的各次装载。
    runtime = { name, callback, fibers: new DisposableList(), Config: plugin.Config }
    this._internal.set(callback, runtime)
}

// 讲解：每次调用仍新建 Fiber，配置属于本次装载。
const fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack)
```

### 类型声明告诉编译器什么

现在回到同一文件的声明区域。`Plugin.Function<T>` 的调用签名是 `(ctx: Context, config: T): any`，本例的 `T` 对应配置形状。`declare module './context'` 扩充 Context 接口，让编译器知道它可以调用 `plugin`；**这段声明不会生成运行时方法**。

声明中的 `plugin<P extends Plugin>(plugin: P, ...args: Spread<GetPluginConfig<P>>): Fiber & PromiseLike<Fiber>` 可以沿本例逐步读：

- `P` 是本次传入函数的类型；`extends Plugin` 限制传入项符合允许的插件形状。
- `GetPluginParameters<P>` 的函数分支用 `infer R` 取出第一个 Context 参数之后的参数列表；本例得到配置参数列表。
- 没有配置转换器时，`GetPluginConfig<P>` 取该列表第一个元素；`Spread<T>` 再判断配置类型是否允许 `undefined`，决定配置实参是必填还是可选。
- `Fiber & PromiseLike<Fiber>` 中的交叉类型表示返回值**同时具有** Fiber 的操作能力和可等待的 `then` 能力；这不是在二者之间任选一种。`PromiseLike` 描述类型层面的等待接口，不保证值是原生 `Promise`。

下面直接摘录类型声明。只跟函数插件的条件类型分支即可；其他插件形状以后遇到再读。注意这部分解释是编译期类型，不是对变量运行时 `typeof` 的推断。

**`Plugin` 命名空间中的函数插件接口。**

来源：[registry.ts](materials/cordis/src/registry.ts)，原文件第 82–84 行。

```typescript
export interface Function<T = any> extends Base<T> {
    // 讲解：第一个参数固定为 Context，T 描述配置类型。
    (ctx: Context, config: T): any
}
```

**从函数签名取得配置类型，再扩充 `Context.plugin` 的声明。**

来源：[registry.ts](materials/cordis/src/registry.ts)，原文件第 102–123 行。

```typescript
// 讲解：配置允许 undefined 时，实参可省略；否则必须传入。
type Spread<T> = undefined extends T ? [config?: T] : [config: T]

type GetPluginParameters<P> =
    // 讲解：本课走函数分支：取出 Context 之后的参数元组 R。
    | P extends (ctx: Context, ...args: infer R) => any
    ? R
    : P extends new (ctx: Context, ...args: infer R) => any
    ? R
    : P extends { apply(ctx: Context, ...args: infer R): any }
    ? R
    : never

type GetPluginConfig<P> =
    | P extends Plugin.Transform<infer S, any>
    ? S
    // 讲解：没有转换器时，从参数元组取出配置类型。
    : GetPluginParameters<P>[0]

// 讲解：为 ./context 中已有的 Context 类型增加成员。
declare module './context' {
    export interface Context {
        inject(deps: Inject, callback: Plugin.Function<void>): Fiber & PromiseLike<Fiber>
        // 讲解：这里声明调用参数和返回值，不含运行时方法体。
        plugin<P extends Plugin>(plugin: P, ...args: Spread<GetPluginConfig<P>>): Fiber & PromiseLike<Fiber>
    }
}
```

### 运行时方法实际从哪里来

打开 `Context` 类主体会发现 `plugin` 没有普通方法体。实际路线是：创建 Context 时初始化 `ReflectService`；它的构造器调用 `this.mixin('registry', ['inject', 'plugin'])`，为 Context 提供转发入口。

`mixin` 在这里表示把服务上的属性或方法转到 Context。源码为这些名字注册访问器；读 `plugin` 时，getter 取得当前 Context 的 `registry` 服务、从服务取得方法，并绑定对应接收对象。因此 `root.plugin(...)` 进入的是 `RegistryService.plugin(...)`，且仍能保留调用所属上下文。

本段只读构造器的这一行，以及 `mixin` 中 `ctx[source]`、`Reflect.get`、`value.bind` 的路线。属性访问由 Context 的代理和反射服务协作处理；先建立“Context 入口 → 服务方法”的关系，不必将每个代理分支都展开。

**两条路线合起来**：模块扩充让 TypeScript 接受调用；运行时转发让调用实际执行。只删除或增加类型声明，都不会凭空创建相应的运行行为。

**`ReflectService` 构造器先注册转发入口。**

来源：[reflect.ts](materials/cordis/src/reflect.ts)，原文件第 148 行。

```typescript
// 讲解：从 registry 服务转发 inject 和 plugin。
this.mixin('registry', ['inject', 'plugin'])
```

**`mixin()` 为名字注册访问器，getter 取出并绑定服务方法。**

下面只省略属性写入的 setter，保留读取路线：

来源：[reflect.ts](materials/cordis/src/reflect.ts)，原文件第 241–258、264–267 行。

```typescript
mixin(source: any, mixins: string[] | Dict<string>) {
    const self = this
    return this.ctx.fiber.effect(function* () {
        const entries = Array.isArray(mixins) ? mixins.map(key => [key, key]) : Object.entries(mixins)
        const getTarget = (ctx: Context, error: Error) => {
            // TODO enhance error message
            // 讲解：此例取当前 Context 上的 registry 服务。
            return ctx[source]
        }
        for (const [key, value] of entries) {
            yield self.accessor(value, {
                get(receiver, error) {
                    // 讲解：读取 root.plugin 时，先取得所属的注册服务。
                    const service = getTarget(this, error)
                    if (isNullable(service)) return service
                    const mixin = receiver ? withProps(receiver, service) : service
                    // 讲解：从服务取出对应方法。
                    const value = Reflect.get(service, key, mixin)
                    if (typeof value !== 'function') return value
                    // 讲解：绑定接收对象，使 RegistryService.plugin 中的 this 对应调用上下文。
                    return value.bind(mixin ?? service)
                },
                // ……省略 setter，原文件第 259–263 行……
            })
        }
    }, `ctx.mixin(${JSON.stringify(source)})`)
}
```

类型声明让编译器认识 `plugin`，getter 与 `bind` 让调用实际到达注册服务。

## 03：等待异步插件完成，再用源码与测试收束

约 40 分钟。插件中的 `await` 和调用方的 `await handle` 位于不同位置：前者暂停插件的初始化函数，后者让调用方等待装载过程。

先保持 `waitBeforeInspect = true`，等待后再打印事件；随后改为 `false`，在 `root.plugin(...)` 返回后立即观察一次。末尾仍会等待完成并清理插件，因此这次修改只改变观察时刻。

比较第一次打印时有哪些事件，再看补充等待后的完整列表。同时观察 `handle` 的等待方法和 `fiber` 的对象身份，判断插件函数的完成值与框架的装载完成值怎样关联。

```javascript
// 实验 03：改变观察前是否等待，观察异步初始化进度
runCordis("03", async ({ Context, Fiber }) => {
    const waitBeforeInspect = true; // 改为 false：先观察，再等待收尾。
    const delayMs = 20;
    const root = new Context();
    const events = [];
    async function asyncPlugin() {
        events.push("3 插件开始");
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        events.push("4 插件内部 await 后继续");
    }

    events.push("1 调用 root.plugin 前");
    const handle = root.plugin(asyncPlugin);
    events.push("2 调用 root.plugin 后，调用方继续");
    let fiber;
    if (waitBeforeInspect) {
        fiber = await handle;
        events.push("5 await handle 完成");
    }
    console.log("events（当前观察时刻的事件） =", [...events]);
    console.log("handle instanceof Promise（是否原生 Promise） =", handle instanceof Promise);
    console.log("typeof handle.then（是否提供等待方法） =", typeof handle.then);
    console.log("handle instanceof Fiber（是否具有 Fiber 原型） =", handle instanceof Fiber);

    // 即使先观察，也等待初始化完成，以便清理本次插件。
    if (!waitBeforeInspect) {
        fiber = await handle;
        events.push("5 补充等待完成");
        console.log("events（补充等待后的完整事件） =", events);
    }
    console.log("fiber instanceof Fiber（完成值的类型） =", fiber instanceof Fiber);
    console.log("fiber === handle（完成值是否为包装对象） =", fiber === handle);
    console.log("fiber === handle.ctx.fiber（完成值是否为真实运行对象） =", fiber === handle.ctx.fiber);
    await handle.dispose();
});
```

### 可等待不等于原生 Promise

已验证输出：`handle instanceof Promise` 为 `false`，`typeof handle.then` 为 `"function"`，`handle instanceof Fiber` 为 `true`；`fiber instanceof Fiber` 为 `true`，`fiber === handle` 为 `false`，`fiber === handle.ctx.fiber` 为 `true`。

带有可调用 `then` 方法、能参与 Promise 等待过程的对象通常叫 **thenable**。`await` 能处理这样的对象；所以可以等待 `handle`，即使它不是原生 Promise。具体实现没有靠猜测：`RegistryService.plugin` 先创建 `fiber`，再用 `Object.create(fiber)` 创建包装对象 `wrapped`，最后给它增加 `then`，转到 `fiber.await().then(...)`。

包装对象继承 Fiber 的能力，所以能调用 `dispose()` 等操作；`await` 完成后得到的却是 `fiber.await()` 返回的原 Fiber。源码明确 `return this`，它不是插件内部 Promise 的 `undefined` 完成值。

阅读下面的返回与等待链摘录。这里使用框架认可的 `void` / `Promise<void>` 插件返回方式；不要为了测试返回值而直接改成随意的字符串，插件返回内容还会被框架当作执行结果处理。

**`RegistryService.plugin()` 返回可等待的包装对象。**

来源：[registry.ts](materials/cordis/src/registry.ts)，原文件第 208–212 行。

```typescript
// 讲解：wrapped 继承真实 fiber 的属性和方法，但身份是另一个对象。
const wrapped = Object.create(fiber) as Fiber & PromiseLike<Fiber>
// 讲解：显式增加 then，使包装对象可被 await。
wrapped.then = (onFulfilled, onRejected) => {
    // 讲解：等待转给真实 Fiber 的 await()。
    return fiber.await().then(onFulfilled, onRejected)
}
return wrapped
```

**`Fiber.await()` 等待装载稳定，返回真实 Fiber。**

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 462–468 行。

```typescript
async await() {
    // 讲解：只要还有装载或卸载过程，就继续等待。
    while (this.inertia) {
        await this.inertia
    }
    // 讲解：有已记录错误时，等待会失败。
    if (this._error) throw this._error
    // 讲解：成功完成值为真实 Fiber 本身。
    return this
}
```

### 为什么调用方的第二条记录先出现

`waitBeforeInspect = true` 时，第一次打印包含 1、2、3、4、5。改为 `false` 后，第一次只看到 1、2，补充等待后才看到完整列表。插件已被安排装载，调用方只是提前读取了观察结果。

“2 在 3 前面”来自框架的 `_reload()`：它先 `await Promise.resolve()` 让出本轮执行，然后才调用 `_execute(this._runner)`，由后者调用插件函数。插件自身执行到定时器的 `await` 后又暂停一次。

`inertia` 保存 Fiber 当前正在进行的装载或卸载 Promise。`_execute` 接住插件返回的 Promise，`Fiber.await()` 再等待 `inertia` 稳定。沿这几处连接，就能从实验顺序回到实际实现。

> 定义为 `async` 决定函数调用返回 Promise；框架何时调用这个函数，由它的调度代码决定。

**第一步：`Fiber._setEpoch()` 保存当前装载过程。**

在从未装载状态进入装载状态的分支中：

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 408–409 行。

```typescript
// 讲解：把装载 Promise 存入 inertia，供 Fiber.await() 等待。
this.inertia = this._reload()
return FiberState.LOADING
```

**第二步：`Fiber._reload()` 先让出执行，再等待插件逻辑。**

本实验没有再次更新状态；完成后进入清空 `inertia` 的分支。

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 417–437 行。

```typescript
private async _reload() {
    this.store = { ...this._store }
    const oldEpoch = this._runner.epoch
    try {
        // 讲解：先让出执行，因此调用方能先记录事件 2。
        await Promise.resolve()
        // 讲解：再执行并等待插件逻辑。
        await this._execute(this._runner)
    } catch (reason) {
        // impl guarantees that the error is non-null (?)
        this.ctx.logger.error(reason)
        // 讲解：装载失败时记录错误；Fiber.await() 会传播它。
        this._error = reason
        this._runner.epoch = INACTIVE
    }
    this._updateState(() => {
        if (this._runner.epoch === oldEpoch) {
            // 讲解：状态没有再次变化时，清空当前装载 Promise。
            this.inertia = undefined
        } else {
            this.inertia = this._unload()
            return FiberState.UNLOADING
        }
    })
}
```

**第三步：`Fiber._execute()` 接住插件返回的 Promise。**

先调用构造器中保存的执行器，取得插件返回值：

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 239 行。

```typescript
// 讲解：runner.execute 中包含实验 01 看到的 runtime.callback(...)。
const effect: Effect = runner.execute.call(this)
```

本课的 async 插件返回 Promise。在返回值是对象且 `'then' in effect` 成立的分支中，框架返回下面的等待结果，让 `_reload()` 继续等待插件。`safeCollect` 是本方法前面定义的辅助函数，用于登记可选的清理函数。

来源：[fiber.ts](materials/cordis/src/fiber.ts)，原文件第 247 行。

```typescript
// 讲解：插件完成后处理可选的清理函数，等待链再向外完成。
return effect.then(safeCollect)
```

### 用同一条调用路径收束

现在把本课已经看到的对象与动作接起来：

`root.plugin(fn, config)` → Context 的运行时转发 → `RegistryService.plugin` 查找/创建 Runtime → 每次创建 Fiber 与派生 Context → `_reload` 等待后调用 `fn(ctx, config)` → 等待插件的异步执行 → `fiber.await()` 返回真实 Fiber。

类型签名位于 `registry.ts` 的模块扩充；实际装载位于注册服务与 Fiber。01 的配置和上下文、02 的一条登记与两次装载、03 的等待与完成值，分别为这条路径提供了可观察证据。

最后读上游 `context inspect` 中 root 与命名函数 foo 的断言。相同显示名称可能对应不同对象；对照实验 01 的引用比较，区分显示名称与对象身份。这些所选测试提供具体断言，不代表全框架性质都已由本课验证。

本段到此即可停止。

**`context inspect` 测试中的根对象、匿名插件与命名函数断言。**

来源：[plugin.spec.ts](materials/cordis/tests/plugin.spec.ts)，原文件第 50–61、75 行。

```typescript
it('context inspect', async () => {
    const root = new Context()

    // 讲解：根上下文显示为 root。
    expect(inspect(root)).to.equal('Context <root>')

    // 讲解：匿名插件也显示 root，名字不能证明对象相同。
    await root.plugin((ctx) => {
        expect(inspect(ctx)).to.equal('Context <root>')
    })

    // 讲解：命名函数插件显示函数名 foo。
    await root.plugin(function foo(ctx) {
        expect(inspect(ctx)).to.equal('Context <foo>')
    })
    // ……省略对象插件与类插件断言，原文件第 63–74 行……
})
```

这些断言关注显示名称；实验 01 的引用比较关注对象身份，二者回答不同问题。

# 本课收束

同一个插件函数对应一个 Runtime；每次装载产生自己的 Fiber 与插件 Context。plugin() 发起装载，返回的包装对象同时提供 Fiber 操作和 then 接口；等待它与首次启动插件是两件事。
