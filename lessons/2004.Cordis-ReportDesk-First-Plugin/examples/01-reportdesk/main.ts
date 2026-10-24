// 01 · ReportDesk 完成参考：装载一个函数插件，等待本次报告写完，再卸载插件。
import { Context } from "cordis";
import { reportPlugin } from "../../app/report-plugin.ts";
import { configFromArgs } from "../../shared/entry.ts";

const config = await configFromArgs();

const app = new Context();
console.log("app：", app);
const handle = app.plugin(reportPlugin, config);
console.log("handle=app.plugin(reportPlugin, config)：", handle);
try {
    await handle;
    console.log("in try block: after await handle");
} finally {
    await handle.dispose();
    console.log("in finally block: after await handle.dispose()");
}
