// 核对 Notebook 和 VS Code 两个可编辑入口的教学主体，防止静默出现行为差异。
import ts from "typescript";
import { readFileSync } from "node:fs";

const notebook = JSON.parse(readFileSync(new URL("../LearningTask.ipynb", import.meta.url), "utf8"));
const pairs = [
    ["example-02-shadow-application", "02-shadow-application.mjs", "runCordisFragment2003"],
    ["fragment-01-m1", "01-m1-context-branches.mjs", "runCordisFragment2003"],
    ["fragment-01-m1-shadow", "01-m1-shadow-extend.mjs", "runCordisFragment2003"],
];
const printer = ts.createPrinter({ removeComments: true });
function parse(name, text) {
    const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    if (source.parseDiagnostics.length) throw new Error(`${name} 存在语法错误。`);
    return source;
}
for (const [id, filename, runner] of pairs) {
    const cell = notebook.cells.find((item) => item.id === id);
    if (!cell || cell.cell_type !== "code") throw new Error(`缺少 Code cell：${id}`);
    const source = parse(id, cell.source.join(""));
    const call = source.statements.find((item) => ts.isExpressionStatement(item)
        && ts.isCallExpression(item.expression) && item.expression.expression.getText(source) === runner)?.expression;
    const callback = call?.arguments[runner === "runCordis2003" ? 0 : 1];
    const file = parse(filename, readFileSync(new URL(`../examples/${filename}`, import.meta.url), "utf8"));
    const entry = file.statements.find((item) => ts.isFunctionDeclaration(item)
        && item.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword));
    if (!callback?.body || !entry?.body) throw new Error(`找不到示例函数：${id} / ${filename}`);
    const notebookBody = printer.printNode(ts.EmitHint.Unspecified, callback.body, source);
    const fileBody = printer.printNode(ts.EmitHint.Unspecified, entry.body, file);
    if (notebookBody !== fileBody) {
        throw new Error(`${id} 与 examples/${filename} 的教学主体不同。请核对并同步两处修改；检查不会覆盖任一入口。`);
    }
    console.log(`一致：${id} ↔ examples/${filename}`);
}
