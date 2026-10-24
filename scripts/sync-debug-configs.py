#!/usr/bin/env python3
"""将各课调试入口汇总到仓库根目录；--check 只检查，不写文件。"""

import argparse
import json
from pathlib import Path


def rebase(value, lesson_path):
    if isinstance(value, str):
        return value.replace("${workspaceFolder}", "${workspaceFolder}/" + lesson_path)
    if isinstance(value, list):
        return [rebase(item, lesson_path) for item in value]
    if isinstance(value, dict):
        return {key: rebase(item, lesson_path) for key, item in value.items()}
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    configurations = []
    for lesson in sorted((root / "lessons").iterdir()):
        if not lesson.is_dir():
            continue
        data = json.loads((lesson / ".vscode/launch.json").read_text(encoding="utf-8"))
        configurations.extend(rebase(data["configurations"], lesson.relative_to(root).as_posix()))
    output = json.dumps({"version": "0.2.0", "configurations": configurations}, ensure_ascii=False, indent=2) + "\n"
    target = root / ".vscode/launch.json"
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != output:
            raise SystemExit("根调试配置与各课不一致，请运行 python3 scripts/sync-debug-configs.py")
    else:
        target.parent.mkdir(exist_ok=True)
        target.write_text(output, encoding="utf-8")
    print(f"调试配置{'一致' if args.check else '已同步'}：{len(configurations)} 个入口")


if __name__ == "__main__":
    main()
