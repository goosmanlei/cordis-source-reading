# -*- coding: utf-8 -*-
"""Build five source-based teaching diagrams from this lesson's cwd."""
from html import escape
from math import atan2, cos, sin
from pathlib import Path

OUT = Path('materials')
BLUE, GREEN, ORANGE, GRAY = '#2563eb', '#15803d', '#b45309', '#64748b'


def start(title, subtitle, height):
    global parts, canvas_height
    canvas_height = height
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="{height}" viewBox="0 0 1440 {height}" role="img" aria-label="{escape(title)}">',
        f'<rect width="1440" height="{height}" fill="#f8fafc"/>',
        '<style>text{font-family:"PingFang SC","Noto Sans CJK SC",sans-serif;fill:#18324b;font-size:22px}.title{font-size:32px;font-weight:700}.small{font-size:19px}.head{font-size:24px;font-weight:700}</style>',
    ]
    txt(40, 48, title, 'title')
    txt(40, 85, subtitle, 'small')


def txt(x, y, text, cls=''):
    parts.append(f'<text x="{x}" y="{y}" class="{cls}">{escape(text)}</text>')


def frame(x, y, w, h, heading, color=BLUE):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="white" stroke="{color}" stroke-width="2"/>')
    txt(x + 20, y + 36, heading, 'head')


def box(x, y, w, h, heading, lines=(), color=BLUE):
    frame(x, y, w, h, heading, color)
    for i, line in enumerate(lines):
        txt(x + 20, y + 75 + 34 * i, line)


def arrow(x1, y1, x2, y2, label='', dashed=False, color=GRAY):
    dash = ' stroke-dasharray="7 5"' if dashed else ''
    parts.append(f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="2.5"{dash}/>')
    angle = atan2(y2 - y1, x2 - x1)
    bx, by = x2 - 11 * cos(angle), y2 - 11 * sin(angle)
    points = f'{x2},{y2} {bx + 5 * sin(angle)},{by - 5 * cos(angle)} {bx - 5 * sin(angle)},{by + 5 * cos(angle)}'
    parts.append(f'<polygon points="{points}" fill="{color}"/>')
    if label:
        label_width = sum(19 if ord(char) > 255 else 10 for char in label)
        label_x = (x1 + x2 - label_width) / 2 if y1 == y2 else (x1 + x2) / 2 + 8
        txt(label_x, (y1 + y2) / 2 - 12, label, 'small')


def save(name):
    txt(40, canvas_height - 25, 'Cordis c261dd2 · 结构与中间阶段按固定源码归纳；本例快照及分支执行范围见 Notebook。', 'small')
    OUT.joinpath(name + '.svg').write_text('\n'.join(parts + ['</svg>']))


start('对象结构：共享的管理服务，与三种不同的关系', 'Context 决定访问位置；父子 Fiber 连接释放责任；服务依赖连接提供者与消费者。', 1430)
box(40, 115, 1360, 110, 'app：根 Context 的代理入口', ['根 Fiber（uid 0）管理应用装载；根部创建 registry、reflect、events 等共享管理服务。'], GRAY)
box(40, 290, 430, 190, 'RegistryService', ['callback → Runtime', 'Runtime.fibers → 多次装载', '同一插件代码可安装多次'])
box(505, 290, 430, 190, 'ReflectService', ['props → 属性访问规则', 'Symbol → Impl → 业务实例', '局部映射选键，共享表保存实现'])
box(970, 290, 430, 190, 'EventsService', ['事件名 → Hook[]', 'Hook 保存回调与登记 Context', '派发与资源撤销分别有入口'])
for x in (255, 720, 1185):
    arrow(x, 225, x, 290, '持有')
frame(40, 535, 650, 495, '关系 A · Context 派生', BLUE)
box(65, 610, 245, 100, 'app', ['根访问位置'], GRAY)
box(395, 610, 270, 100, 'alphaCtx', ['局部键与工作区名'])
arrow(310, 660, 395, 660, '派生', True, BLUE)
box(395, 780, 270, 100, '工作区插件的 ctx', ['拥有自己的 fiber 字段'])
arrow(530, 710, 530, 780, '派生', True, BLUE)
box(65, 780, 245, 100, '各子插件的 ctx', ['每个子插件各一份'])
arrow(395, 830, 310, 830, '', True, BLUE)
txt(320, 810, '派生', 'small')
txt(65, 940, '虚线省略中间 Context 与代理；beta 另有同样一支。', 'small')
txt(65, 980, '派生访问位置不会自动 new 一份业务服务。', 'small')
frame(730, 535, 670, 495, '关系 B · Fiber 的释放归属', GREEN)
box(755, 610, 620, 85, '根 Fiber', ['父级持有子插件的 dispose'], GRAY)
box(755, 765, 260, 100, '四个共享插件 Fiber', ['格式 / 通知 / 统计'], GREEN)
box(1060, 765, 315, 100, 'workspace Fibers', ['alpha 与 beta 各一条'], GREEN)
arrow(885, 695, 885, 765, '负责释放', color=GREEN)
arrow(1215, 695, 1215, 765, '负责释放', color=GREEN)
box(1060, 935, 315, 70, '各组的三个子插件 Fiber', color=GREEN)
arrow(1215, 865, 1215, 935, '负责释放', color=GREEN)
txt(755, 935, '三种子插件互为兄弟。', 'small')
txt(755, 975, '共享监听不归 alpha 管理。', 'small')
frame(40, 1080, 1360, 265, '关系 C · 当前运行需要的服务', ORANGE)
box(65, 1160, 340, 100, 'batch Fiber', ['inject: report'], ORANGE)
box(550, 1160, 340, 100, 'report Fiber', ['inject: storage'], ORANGE)
box(1035, 1160, 340, 100, 'storage Fiber', ['提供 StorageService'], ORANGE)
arrow(405, 1210, 550, 1210, '依赖', color=ORANGE)
arrow(890, 1210, 1035, 1210, '依赖', color=ORANGE)
txt(65, 1310, '依赖变化从提供者影响消费者；声明依赖不会取得关闭提供者的所有权。', 'small')
save('objects')

start('装载流程：从 ctx.plugin() 到服务可用', '以 reportProvider 为例；batch 使用相同装载机制，在自己的 apply 中执行业务。', 1480)
steps = [
    (130, '1 · 当前 Context 调用 plugin', ['混入方法转发到共享 registry，保留调用位置。']),
    (340, '2 · 找 Runtime，建立本次 Fiber', ['ctx = parent.extend({ fiber })；保存 config、inject 与 runtime。']),
    (550, '3 · 检查依赖，再接入父级资源管理', ['按隔离键找 ACTIVE 的 storage Impl，记录到候选 _store。', '父级 effect 登记本次装载与释放动作，_refresh 决定是否加载。']),
    (760, '4 · _reload 准备本轮依赖并执行 apply', ['store = { ..._store }；经过异步边界后调用插件回调。']),
    (970, '5 · reportProvider 创建并登记业务实例', ['new ReportService → Service 构造器 → reflect.provide。']),
    (1180, '6 · 本轮装载完成，提供者进入 ACTIVE', ['状态变化通知相关消费者重新检查，reportBatch 可绑定 report。']),
]
for y, title, lines in steps:
    box(40, y, 880, 130, title, lines)
for y1, y2 in zip([260, 470, 680, 890, 1100], [340, 550, 760, 970, 1180]):
    arrow(480, y1, 480, y2)
box(980, 130, 420, 220, '身份分开', ['Runtime 按回调复用；', 'Fiber 按安装创建；', 'Service 由 apply 中的', '应用代码创建。'], GRAY)
box(980, 515, 420, 250, '依赖暂缺 · 源码分支', ['Fiber 可以已经登记，', '但仍 PENDING，未执行 apply。', '提供者就绪后重新检查；', '沿原 Fiber 开始加载。'], ORANGE)
arrow(920, 615, 980, 615, '', True, ORANGE)
box(980, 970, 420, 200, '登记与可用有先后', ['provide 写入 Impl；', '默认严格依赖查找还会', '检查提供者的 ACTIVE 状态。'], GREEN)
txt(40, 1380, 'await 等待当前加载／卸载过程稳定；一般缺依赖时仍可能停在 PENDING。', 'small')
save('installation-flow')

start('业务时序：现有服务怎样共同处理一份输入', '实线为调用，虚线为返回。服务方法与格式回调同步；文件写入有显式 await。', 1370)
box(40, 115, 1360, 120, '前置：reportBatch 已绑定本轮 report，report 已绑定 storage', ['服务视图带入调用 Context；方法接收者同时保留服务定义位置。方法调用复用已有实例。'], GRAY)
columns = [(180, 'reportBatch'), (470, 'report.generate'), (790, '格式回调'), (1080, 'storage'), (1310, '观察插件')]
for x, label in columns:
    txt(x - 85, 295, label, 'head')
    parts.append(f'<path d="M{x} 315 V1265" stroke="#cbd5e1" stroke-dasharray="5 5"/>')
arrow(180, 365, 470, 365, 'generate(id, input)')
arrow(470, 435, 790, 435, 'waterfall(input, inner)')
box(590, 480, 410, 135, '先进入，再加工返回', ['进入：quote → footer → render', '返回：render → footer → quote'])
arrow(790, 660, 470, 660, '完整 Markdown', True)
arrow(470, 730, 1080, 730, 'storage.save(id, markdown)')
arrow(1080, 795, 470, 795, '内存 Map 已写入', True)
arrow(470, 855, 180, 855, 'Markdown 字符串', True)
box(40, 905, 410, 135, 'await writeReport(...)', ['写入 alpha-lamp.md', '文件成功写出后继续'], ORANGE)
arrow(180, 1110, 1310, 1110, 'emit(report/completed, { id, title })')
box(1025, 1160, 375, 105, '同步通知与统计', ['观察者不改写报告返回值'], GREEN)
txt(40, 1310, '这批业务返回后，batch Fiber 仍保留；它的结束由后续周期清理或 dispose 决定。', 'small')
save('call-sequence')

start('登记数据：名字、全局实现与本轮绑定', 'alpha/beta 是同一机制的两份实例；reportAlpha 等为不同 Symbol 的讲解别名。', 1280)
box(40, 140, 400, 185, 'alphaCtx 的有效映射', ['report → reportAlpha', 'storage → storageAlpha', '局部覆盖继承的默认键'])
box(560, 140, 840, 185, '共享 reflect.store：alpha 的实现记录', ['reportAlpha → Impl { value: ReportService 1, fiber: 9 }', 'storageAlpha → Impl { value: StorageService 1, fiber: 7 }', 'value 是业务实例；fiber 是提供者的装载记录'])
arrow(440, 230, 560, 230, '选键')
box(560, 395, 840, 175, 'alpha report Fiber 的依赖', ['_checkImpl：候选 _store.storage → alpha storage Impl', '_reload：store = { ..._store }', '方法读取：store.storage.value → StorageService 1'], GREEN)
arrow(980, 395, 980, 325, '引用同一 Impl', True, GREEN)
txt(65, 440, '装载前：按键检查候选依赖。', 'small')
txt(65, 480, '运行时：读取本轮依赖绑定。', 'small')
txt(65, 520, '浅复制依赖表，不复制业务实例。', 'small')
box(40, 640, 400, 185, 'betaCtx 的有效映射', ['report → reportBeta', 'storage → storageBeta', '四个 Symbol 身份不同'])
box(560, 640, 840, 185, '共享 reflect.store：beta 的实现记录', ['reportBeta → Impl { value: ReportService 2, fiber: 10 }', 'storageBeta → Impl { value: StorageService 2, fiber: 8 }', '两组使用一张共享表，不复制整个登记表'])
arrow(440, 730, 560, 730, '选键')
box(560, 895, 840, 175, 'beta report Fiber 的依赖', ['_checkImpl：候选 _store.storage → beta storage Impl', '_reload：store = { ..._store }', '方法读取：store.storage.value → StorageService 2'], GREEN)
arrow(980, 895, 980, 825, '引用同一 Impl', True, GREEN)
txt(65, 950, '相同名字，不同有效键。', 'small')
txt(65, 990, '相同插件回调，不同装载与实例。', 'small')
box(40, 1120, 1360, 95, '名字存在 ≠ 当前有可用实现', ['根默认键可以已补齐，但键下没有实例。本例根 get(report/storage) 均为空，局部服务照常可用。'], GRAY)
save('data-map')

start('生命周期：一次装载可以经历多轮 apply', '正常装载／关闭在本例运行；依赖恢复与配置更新仅作已学源码回顾。中间状态依据源码。', 1370)
box(40, 130, 390, 100, 'PENDING', ['等待必需依赖'], GRAY)
box(525, 130, 390, 100, 'LOADING', ['绑定本轮依赖，执行 apply'])
box(1010, 130, 390, 100, 'ACTIVE', ['本轮服务与资源可继续使用'], GREEN)
arrow(430, 180, 525, 180, '就绪')
arrow(915, 180, 1010, 180, '完成')
box(40, 315, 1360, 105, '一次业务调用返回', ['generate 返回、batch.apply 兑现，都不自动删除 Fiber；下一份输入可以继续使用同一服务。'], GRAY)
box(40, 500, 420, 545, '依赖暂缺 → 恢复', ['storage 实现撤下', '→ notify 检查相关 report Fiber', '→ UNLOADING：释放旧一轮', '→ PENDING：保留装载，等待', '', 'storage 再就绪', '→ LOADING：重新执行 apply', '→ ACTIVE：新 ReportService', '', '同一 report Fiber，多轮 apply。', '依赖 report 的 batch 也可能重跑。'], BLUE)
box(510, 500, 420, 545, '配置更新 → 默认重启', ['report Fiber.update(config)', '→ 保存配置，默认 restart', '→ revision 变化', '→ UNLOADING：释放旧一轮', '', '→ LOADING：重新执行 apply', '→ ACTIVE：新 ReportService', '', '同一 report Fiber，新配置。', 'storage 未撤下，可保留原对象。', '本例没有拦截重启的更新监听。'], ORANGE)
box(980, 500, 420, 545, '最终 dispose', ['关闭本次插件装载', '→ uid 置 null，移出 Runtime', '→ 清理本轮登记的资源', '→ DISPOSED', '', '父组关闭会释放子插件。', '最后一条装载移除后，', '该插件的 Runtime 也删除。', '', '再次 plugin 才产生新 Fiber。', 'beta 与根部监听按各自归属清理。'], GREEN)
box(40, 1120, 1360, 165, '生命周期落实到资源：创建时登记释放动作，退出周期时执行', ['provide / on / plugin → Fiber 收集清理；_unload 释放登记、监听、子插件及 apply 返回的清理函数。', '服务解除登记不等于立即回收对象；应用文件不会自动删除，新的内存服务也不会自动迁移旧数据。', '提供者变化沿依赖关系传播；父组关闭沿释放归属传播；它们共同使用 Fiber 的周期调度。'], GRAY)
save('lifecycle')
print('Generated five diagrams.')
