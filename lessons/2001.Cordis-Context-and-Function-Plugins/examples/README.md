# 本课示例索引

所有命令从本课目录执行。Notebook 使用 JavaScript 内核：先运行 00，再直接修改 01–03 实验代码并观察结果。`runCordis` 将实验函数交给独立 Node 进程运行，用到的变量放在函数内部。Node 26.10.0 已验证，通过 `node --import tsx` 加载本地 Cordis 源码。首次换机器运行 `npm ci --ignore-scripts --no-audit --no-fund`，然后 `npm run check`。

| 编号 | Notebook 中可改变的条件 | 独立 TypeScript 参考文件 | 单独运行 |
|---|---|---|---|
| 00 | 核对运行目录、版本并定义 runCordis | Notebook 初始化单元 | 在 JavaScript 内核运行 |
| 01 | 使用根 Context 或派生 Context 作为插件父级 | examples/01-function-plugin.ts | npm run plugin |
| 02 | 复用同一个函数或创建同名新函数 | examples/02-plugin-and-fiber.ts | npm run identity |
| 03 | 调用方是否先等待再查看事件 | examples/03-await-plugin.ts | npm run async |

Notebook 的环境入口为 `examples/shared/run-experiment.mjs`；每个实验的当前代码与输出分别保存在 `runs/notebook-experiment-01/`、`runs/notebook-experiment-02/`、`runs/notebook-experiment-03/`，重跑只替换对应目录。实验创建独立 Context，并在结束时 dispose 已装入的插件。源码阅读直接使用 Notebook 中的注释摘录，无需执行查看源码的单元。

原 TypeScript 文件保留已有代码，供编辑器中独立调试；修改 Notebook 不会改写这些文件。`npm run demo` 按 01–03 顺序运行这些文件，输出写到 `runs/plugin-examples/`，每次只保留本次记录。也可绕过课程脚本直接运行，例如 `node --import tsx examples/01-function-plugin.ts`。

`cordis` 依赖指向本课的 [materials/cordis](../materials/cordis/package.json)，`node_modules/cordis` 是该目录的链接。分模块源码位于 [materials/cordis/src/](../materials/cordis/src/)，示例运行的就是这里的 TypeScript 源码；修改这些模块后，重新运行示例即可看到变化。

`npm run check` 先从本地源码生成声明文件与源码映射，再严格检查本课示例；生成物位于 `runs/cordis-types/`，不提交。编辑器中的“转到定义”可通过映射定位到分模块 `.ts` 源码。源码改动后重新执行 `npm run check`，同步类型与跳转信息。这不表示上游源码通过本课的严格类型检查。

保留的 `examples/shared/show-source.mjs` 仅供终端按需查行；它不再是 Notebook 的学习步骤。
