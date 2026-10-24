// 01 · ReportDesk：先注册的 quote 在外层，后注册的 footer 在内层。
import type { Context } from "cordis";
import "./report-events.ts";

export function quoteFormat(ctx: Context): void {
    ctx.on("report/format", (input, next) => {
        console.log(`quoteFormat：进入 ${input.title}，调用 next()`);
        const markdown = next();
        console.log("quoteFormat：next() 已返回，为每行添加引用前缀");
        return markdown.trimEnd().split("\n").map((line) => `> ${line}`).join("\n") + "\n";
    });
}

export function footerFormat(ctx: Context): void {
    ctx.on("report/format", (input, next) => {
        console.log(`footerFormat：进入 ${input.title}，调用 next()`);
        const markdown = next();
        console.log("footerFormat：next() 已返回，添加统一页尾");
        return markdown + "\n---\n由 ReportDesk 生成。\n";
    });
}
