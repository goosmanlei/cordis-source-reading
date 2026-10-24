# 环境与运行

## 只读正文

直接阅读每课 README 即可。代码围栏中的运行示例是 Notebook 的阅读副本；需要交互执行时打开同目录的 `LearningTask.ipynb`。源码摘录可能省略外围代码，不能把所有围栏当作独立程序执行。

## 命令行与 VS Code

课程验证环境为 Node.js 26.10.0、npm 11.19.1。仓库的 `.nvmrc` 固定 Node 版本；也可使用自己的 Node 安装方式。其他 Node 版本与操作系统尚未逐一验证。

先进入某一课目录，例如：

```bash
cd lessons/2014.Cordis-ReportDesk-Full-Flow
npm ci
npm run check
npm run demo
```

`npm ci` 按本课锁文件安装依赖；`npm run check` 生成声明并检查本课代码；`npm run demo` 运行本课默认示例。部分课还有 `demo:start`、`demo:excerpt` 等入口，以正文和 `package.json` 为准。每课独立安装，不需要先运行上一课，也不需要全局安装 Cordis。

报告、声明、快照和缓存写入当前课的 `runs/`；重跑同一示例通常会替换对应结果，保留需要比较的文件后再运行。`runs/` 和 `node_modules/` 被忽略，不提交个人实验产物。

## VS Code 调试

14 课均提供 `.vscode/launch.json`；仓库根目录也汇总了全部 23 个入口。只需使用 VS Code 内置的 Node.js 调试器，Node 从你的 `PATH` 中查找。调试配置使用 `${workspaceFolder}`，不绑定作者的目录、用户名或 Node 安装位置。

1. 用 VS Code 打开克隆后的 `cordis-source-reading` 根目录。
2. 在终端进入要读的课目录，先执行 `npm ci` 和 `npm run check`。每课首次运行都需要安装自己的依赖；只安装当前课即可。
3. 打开左侧“运行和调试”（Run and Debug），从下拉列表选择对应 `Cordis 20xx` 的入口。正文要求修改示例时可选“建设起点”，查看完整行为时选该课的完整入口。
4. 在入口、`app/` 或 `materials/cordis/src/` 中的可执行语句行设置断点，按 F5 启动。选择调用堆栈中的帧查看局部变量和 `this`；用“单步跳入”跟进源码，F5 继续运行。

也可以直接打开 `lessons/20xx.…/` 这一课目录，使用同名配置。两种打开方式都会把程序的工作目录设为本课目录，产物写入本课 `runs/`。`${workspaceFolder}` 指 VS Code 当前打开的目录；根配置因此多一段 `lessons/课目录`，单课配置直接从本课开始解析。[VS Code 变量说明](https://code.visualstudio.com/docs/reference/variables-reference)

可以从这些位置开始观察（路径均相对于所选课）：

| 课次 | 断点位置与观察对象 |
| --- | --- |
| 2001 | `examples/01-function-plugin.ts` 的 `greeting()`：插件收到的 Context 与配置 |
| 2002 | `examples/02-context-assembly.mjs` 的 `inspectAssembly()`、`materials/cordis/src/registry.ts` 的 `plugin()`：调用如何进入本课内核 |
| 2012 | `app/report-service.ts` 的 `generate()`：`this.ctx.entryLabel` 与共享服务实例 |
| 2013–2014 | `app/report-service.ts` 的 `generate()`：`this.ctx.workspaceName` 与两组服务实例 |

第 2002 课沿用正文的运行脚本，实际示例在它启动的 Node 子进程中执行；配置开启了 `autoAttachChildProcesses`，可直接在示例和内核源码上设断点。其他入口直接运行对应 `.ts` 或 `.mjs`。TypeScript 由本课的 `tsx` 加载；配置保留 source map 并等待映射加载，避免程序快速执行时跳过首行断点。调试器只跳过 Node 内部实现，便于继续跟入 Cordis。[VS Code Node.js 调试说明](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)

如果出现 `Cannot find module`，先确认安装的是当前课的依赖；如果断点一直空心，确认打开的是本课源码、所选入口会执行这行，且 `npm run check` 已通过。编译期类型声明与注释行不能作为运行断点。无需把路径改成你自己的绝对路径。

## Notebook（可选）

Notebook 使用 [tslab 提供的 JavaScript 内核](https://github.com/yunabe/tslab#installing-tslab)。需要 Python、JupyterLab 以及 Node.js；如果已有 Jupyter 环境，可以继续使用。

一种安装方式是在仓库内创建 Python 虚拟环境：

```bash
python3 -m venv .venv
# macOS / Linux
source .venv/bin/activate
python -m pip install jupyterlab
npm install -g tslab@1.0.22
tslab install --python=python
jupyter kernelspec list
```

Windows 的虚拟环境激活命令为 `.venv\Scripts\activate`。上述 `npm install -g` 与 `tslab install` 会安装用户环境组件；如需自定义安装位置，按 tslab 官方说明设置。

进入目标课目录、完成该课的 `npm ci` 和 `npm run check` 后，启动 `jupyter lab`，打开 `LearningTask.ipynb` 并选择 **JavaScript（jslab）**。Code cell 按正文顺序运行，通常先 00，再 01；前 3 课有多个实验，初始化与运行顺序已在相邻文字中标明。

不要把这些 Notebook 切换到 Python 或 TypeScript 内核。业务 TypeScript 由本课 tsx 在独立 Node 进程运行，项目类型检查以 `npm run check` 为准。遇到 `Cannot find module`，先核对当前课安装是否完成；遇到路径错误，核对 Notebook 内核的工作目录是否为该课目录。

## 修改后如何同步

`LearningTask.ipynb` 是教学正文来源；每课 README 由它生成，便于 GitHub 阅读。修改正文或 Code cell 后，在仓库根执行：

```bash
python3 scripts/render-lessons.py
```

第 3 课的 Notebook 内联示例与独立文件还通过 `npm run check:examples` 检查主体是否一致。此检查只报告差异，不覆盖你的修改。

调试入口以各课 `.vscode/launch.json` 为准。修改后在仓库根执行 `python3 scripts/sync-debug-configs.py`，同步根配置；执行 `python3 scripts/sync-debug-configs.py --check` 可只检查两者是否一致。
