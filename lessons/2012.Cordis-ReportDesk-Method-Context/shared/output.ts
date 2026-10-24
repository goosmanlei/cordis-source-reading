// 本课默认只展示两入口对照；旧流程日志可用 REPORTDESK_VERBOSE=1 查看。
export function logDetail(message: string): void {
    if (process.env.REPORTDESK_VERBOSE === "1") console.log(message);
}
