# 第三方来源与许可

## Cordis

本仓库的 `lessons/*/materials/cordis/` 包含 [cordiverse/cordis](https://github.com/cordiverse/cordis) 的核心源码、README、许可证和精选测试。上游采用 MIT License，版权为 **Copyright (c) 2021-present Shigma**。每课保留原始 LICENSE；各课 `materials/source-index.json` 记录文件的上游路径、固定提交、下载地址与 SHA-256。

- 2001–2003：[`f8ea3cd50f1a5724e8e715995bcde131c9c12b2c`](https://github.com/cordiverse/cordis/tree/f8ea3cd50f1a5724e8e715995bcde131c9c12b2c)。
- 2004–2014：[`c261dd2c13d65b1994adb1cdc10d7dba61542523`](https://github.com/cordiverse/cordis/tree/c261dd2c13d65b1994adb1cdc10d7dba61542523)。

公开课程中的上述上游文件按清单还原并核对；教学包的入口、声明输出和本地安装配置经过适配。Notebook 与课程正文包含带解释注释的源码摘录，删节会在附近说明。精选测试用于阅读，不构成完整上游测试套件。

## 运行依赖与工具

npm 依赖通过每课 `package-lock.json` 安装，依赖包及其许可证由 npm 包提供，本仓库不提交 `node_modules`。Jupyter 与 tslab 是可选运行工具，不打包进课程；安装说明链接其官方项目。

## 课程内容

原创课程讲解、图解与 ReportDesk 示例采用根目录 MIT License。该许可不改变第三方文件的版权归属；转载本课程或其中的上游代码时，应保留相应版权与许可证文件。
