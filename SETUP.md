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

要调试，用 VS Code 单独打开这一课目录，再选择“运行和调试”中的配置。先运行 `npm run check`，然后在应用或 `materials/cordis/src/` 设置断点。第 1、2 课也可以直接调试正文链接的独立入口文件。

报告、声明、快照和缓存写入当前课的 `runs/`；重跑同一示例通常会替换对应结果，保留需要比较的文件后再运行。`runs/` 和 `node_modules/` 被忽略，不提交个人实验产物。

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
