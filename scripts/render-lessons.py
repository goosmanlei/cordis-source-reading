#!/usr/bin/env python3
"""Render GitHub-readable lesson text from the matching Notebook, without outputs."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
for notebook in sorted(root.glob("lessons/*/LearningTask.ipynb")):
    data = json.loads(notebook.read_text())
    content = ["<!-- Generated from LearningTask.ipynb by scripts/render-lessons.py. -->\n",
               "[运行此课 Notebook](LearningTask.ipynb) · [课程目录](../../README.md)\n"]
    for cell in data["cells"]:
        source = "".join(cell["source"]).rstrip()
        if cell["cell_type"] == "code":
            content.append("```javascript\n" + source + "\n```\n")
        elif cell["cell_type"] == "markdown":
            content.append(source + "\n")
    (notebook.parent / "README.md").write_text("\n".join(content), encoding="utf-8")
print("Rendered 14 lesson reading pages.")
