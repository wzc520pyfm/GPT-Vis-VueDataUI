export interface ChartExample {
  type: string;
  label: string;
  group: '统计' | '关系' | '文本';
  note: string;
  content: string;
}

export const EXAMPLES: ChartExample[] = [
  {
    type: 'line',
    label: '折线图',
    group: '统计',
    note: '双渠道趋势，同一 time 轴自动形成系列',
    content: `vis line
title 双渠道月度线索
axisXTitle 月份
axisYTitle 线索数
data
  - time 1月
    value 128
    group 自然搜索
  - time 2月
    value 146
    group 自然搜索
  - time 3月
    value 141
    group 自然搜索
  - time 4月
    value 176
    group 自然搜索
  - time 5月
    value 193
    group 自然搜索
  - time 6月
    value 218
    group 自然搜索
  - time 1月
    value 82
    group 内容营销
  - time 2月
    value 96
    group 内容营销
  - time 3月
    value 109
    group 内容营销
  - time 4月
    value 118
    group 内容营销
  - time 5月
    value 151
    group 内容营销
  - time 6月
    value 172
    group 内容营销
style
  lineWidth 2.5`,
  },
  {
    type: 'area',
    label: '面积图',
    group: '统计',
    note: '堆叠后的累计构成与趋势',
    content: `vis area
title 产品收入构成
stack true
axisXTitle 季度
axisYTitle 收入（万元）
data
  - time Q1
    value 320
    group 订阅
  - time Q2
    value 386
    group 订阅
  - time Q3
    value 451
    group 订阅
  - time Q4
    value 528
    group 订阅
  - time Q1
    value 118
    group 增值服务
  - time Q2
    value 142
    group 增值服务
  - time Q3
    value 173
    group 增值服务
  - time Q4
    value 206
    group 增值服务`,
  },
  {
    type: 'column',
    label: '柱状图',
    group: '统计',
    note: '分类比较，分组柱由 VueUiXy 绘制',
    content: `vis column
title 两大区域季度签约额
axisXTitle 季度
axisYTitle 签约额（万元）
group true
data
  - category Q1
    value 86
    group 华东
  - category Q2
    value 102
    group 华东
  - category Q3
    value 118
    group 华东
  - category Q4
    value 143
    group 华东
  - category Q1
    value 64
    group 华南
  - category Q2
    value 73
    group 华南
  - category Q3
    value 91
    group 华南
  - category Q4
    value 108
    group 华南`,
  },
  {
    type: 'bar',
    label: '条形图',
    group: '统计',
    note: '长标签更易读，堆叠展示年度构成',
    content: `vis bar
title 各渠道商机来源
axisXTitle 商机数
stack true
data
  - category 官网内容与案例
    value 182
    group 新客
  - category 官网内容与案例
    value 94
    group 续约
  - category 合作伙伴转介绍
    value 136
    group 新客
  - category 合作伙伴转介绍
    value 68
    group 续约
  - category 行业活动与沙龙
    value 88
    group 新客
  - category 行业活动与沙龙
    value 47
    group 续约
  - category 销售外呼
    value 64
    group 新客
  - category 销售外呼
    value 72
    group 续约`,
  },
  {
    type: 'pie',
    label: '饼图',
    group: '统计',
    note: 'innerRadius 控制实心饼或环形图',
    content: `vis pie
title 预算分配
innerRadius 0.62
data
  - category 产品研发
    value 46
  - category 市场投放
    value 22
  - category 客户成功
    value 16
  - category 基础设施
    value 11
  - category 组织储备
    value 5`,
  },
  {
    type: 'scatter',
    label: '散点图',
    group: '统计',
    note: '两个数值字段的关系，可用 group 分色',
    content: `vis scatter
title 投放频次与转化率
axisXTitle 周触达频次
axisYTitle 转化率 %
data
  - x 2
    y 3.1
    group 新客
    name 样本 A
  - x 3
    y 4.4
    group 新客
    name 样本 B
  - x 5
    y 5.8
    group 新客
  - x 7
    y 6.1
    group 新客
  - x 9
    y 4.9
    group 新客
  - x 2
    y 4.8
    group 老客
  - x 4
    y 6.3
    group 老客
  - x 6
    y 7.4
    group 老客
  - x 8
    y 8.1
    group 老客
  - x 10
    y 7.2
    group 老客
  - x 6
    y 8.6
    group 高价值
  - x 8
    y 9.7
    group 高价值`,
  },
  {
    type: 'radar',
    label: '雷达图',
    group: '统计',
    note: '多维能力对比，group 形成独立雷达',
    content: `vis radar
title 产品能力评估
data
  - name 易用性
    value 88
    group 本季度
  - name 性能
    value 76
    group 本季度
  - name 可扩展性
    value 82
    group 本季度
  - name 稳定性
    value 91
    group 本季度
  - name 生态
    value 68
    group 本季度
  - name 支持
    value 84
    group 本季度
  - name 易用性
    value 79
    group 上季度
  - name 性能
    value 70
    group 上季度
  - name 可扩展性
    value 74
    group 上季度
  - name 稳定性
    value 86
    group 上季度
  - name 生态
    value 61
    group 上季度
  - name 支持
    value 77
    group 上季度`,
  },
  {
    type: 'funnel',
    label: '漏斗图',
    group: '统计',
    note: '阶段转化，数据顺序就是流程顺序',
    content: `vis funnel
title 注册转化漏斗
data
  - category 访问产品页
    value 12800
  - category 开始试用
    value 5860
  - category 完成配置
    value 3180
  - category 邀请协作者
    value 1740
  - category 升级付费
    value 682`,
  },
  {
    type: 'waterfall',
    label: '瀑布图',
    group: '统计',
    note: '累计增减与中间合计',
    content: `vis waterfall
title 月度收入变化
axisXTitle 项目
axisYTitle 万元
data
  - category 期初收入
    value 420
    isTotal true
  - category 新增订阅
    value 96
  - category 扩容
    value 38
  - category 流失
    value -54
  - category 折扣
    value -21
  - category 期末收入
    isTotal true`,
  },
  {
    type: 'dual-axes',
    label: '双轴图',
    group: '统计',
    note: '不同量纲共享分类轴',
    content: `vis dual-axes
title 营收与团队规模
axisXTitle 季度
categories
  - Q1
  - Q2
  - Q3
  - Q4
series
  - type column
    axisYTitle 营收（百万元）
    data
      - 42
      - 48
      - 57
      - 69
  - type line
    axisYTitle 团队人数
    data
      - 86
      - 92
      - 104
      - 118`,
  },
  {
    type: 'histogram',
    label: '直方图',
    group: '统计',
    note: '连续样本分箱，binNumber 控制区间',
    content: `vis histogram
title 首次响应时长分布
axisXTitle 响应分钟
axisYTitle 工单数
binNumber 8
data
  - 4
  - 5
  - 6
  - 6
  - 7
  - 8
  - 8
  - 9
  - 10
  - 11
  - 12
  - 13
  - 14
  - 15
  - 17
  - 18
  - 20
  - 22
  - 25
  - 31`,
  },
  {
    type: 'boxplot',
    label: '箱线图',
    group: '统计',
    note: '原始样本的分布、中位数与离群值',
    content: `vis boxplot
title 各版本首屏耗时
axisXTitle 版本
axisYTitle 毫秒
data
  - category v1.8
    value 860
  - category v1.8
    value 920
  - category v1.8
    value 1010
  - category v1.8
    value 1100
  - category v1.8
    value 1520
  - category v2.0
    value 640
  - category v2.0
    value 690
  - category v2.0
    value 720
  - category v2.0
    value 810
  - category v2.0
    value 980
  - category v2.2
    value 510
  - category v2.2
    value 548
  - category v2.2
    value 590
  - category v2.2
    value 640
  - category v2.2
    value 730`,
  },
  {
    type: 'violin',
    label: '小提琴图',
    group: '统计',
    note: '概率密度轮廓比箱线图更适合比较形态',
    content: `vis violin
title 客单价分布
axisXTitle 客户层级
axisYTitle 元
data
  - category 自助客户
    value 128
  - category 自助客户
    value 146
  - category 自助客户
    value 158
  - category 自助客户
    value 172
  - category 自助客户
    value 188
  - category 自助客户
    value 224
  - category 成长客户
    value 320
  - category 成长客户
    value 348
  - category 成长客户
    value 366
  - category 成长客户
    value 382
  - category 成长客户
    value 410
  - category 成长客户
    value 468
  - category 企业客户
    value 860
  - category 企业客户
    value 930
  - category 企业客户
    value 980
  - category 企业客户
    value 1050
  - category 企业客户
    value 1180
  - category 企业客户
    value 1420`,
  },
  {
    type: 'venn',
    label: '韦恩图',
    group: '统计',
    note: '两到三个集合的交集与专属区域',
    content: `vis venn
title 活跃用户行为交集
data
  - sets "产品, 技术"
    value 18
    label 产品 ∩ 技术
  - sets "产品, 增长"
    value 24
    label 产品 ∩ 增长
  - sets "技术, 增长"
    value 14
    label 技术 ∩ 增长
  - sets "产品, 技术, 增长"
    value 32
    label 三者共同
  - sets 产品
    value 42
  - sets 技术
    value 30
  - sets 增长
    value 26`,
  },
  {
    type: 'sankey',
    label: '桑基图',
    group: '统计',
    note: '带权流向与路径拆分',
    content: `vis sankey
title 试用流量路径
data
  - source 官网
    target 免费试用
    value 820
  - source 内容
    target 免费试用
    value 520
  - source 伙伴
    target 免费试用
    value 310
  - source 免费试用
    target 团队版
    value 460
  - source 免费试用
    target 专业版
    value 280
  - source 免费试用
    target 流失
    value 910
  - source 团队版
    target 续费
    value 388
  - source 专业版
    target 续费
    value 246`,
  },
  {
    type: 'treemap',
    label: '矩形树图',
    group: '统计',
    note: '层级面积编码，children 递归展开',
    content: `vis treemap
title 收入结构
data
  - name 订阅产品
    children
      - name 企业版
        value 412
      - name 专业版
        value 286
      - name 团队版
        value 174
  - name 服务
    children
      - name 实施
        value 128
      - name 培训
        value 62
      - name 咨询
        value 48
  - name 生态
    children
      - name 应用市场
        value 84
      - name API 调用
        value 56`,
  },
  {
    type: 'word-cloud',
    label: '词云',
    group: '统计',
    note: '词频由字号编码',
    content: `vis word-cloud
title 客服反馈关键词
data
  - text 响应速度
    value 96
  - text 易上手
    value 82
  - text 报表
    value 74
  - text 导出
    value 61
  - text 稳定性
    value 58
  - text 移动端
    value 52
  - text 协作
    value 46
  - text 权限
    value 39
  - text 通知
    value 34
  - text API
    value 30
  - text 搜索
    value 26
  - text 文档
    value 22`,
  },
  {
    type: 'liquid',
    label: '水波图',
    group: '统计',
    note: '单指标进度，支持四种容器形状',
    content: `vis liquid
title Q4 收入目标
percent 0.78
shape circle`,
  },
  {
    type: 'flow-diagram',
    label: '流程图',
    group: '关系',
    note: '有向步骤与依赖，窄屏也保持可读的分层排版',
    content: `vis flow-diagram
title 新功能上线流程
data
  nodes
    - name 需求澄清
    - name 方案评审
    - name 设计
    - name 开发
    - name 测试
    - name 灰度
    - name 全量
  edges
    - source 需求澄清
      target 方案评审
    - source 方案评审
      target 设计
    - source 设计
      target 开发
    - source 开发
      target 测试
    - source 测试
      target 灰度
    - source 灰度
      target 全量`,
  },
  {
    type: 'network-graph',
    label: '网络图',
    group: '关系',
    note: '实体关联，力导向布局可交互',
    content: `vis network-graph
title 客户协同网络
layout force
data
  nodes
    - name 星云科技
    - name 远山零售
    - name 云帆金融
    - name 合创医疗
    - name 北辰制造
    - name 顾问 A
    - name 顾问 B
  edges
    - source 星云科技
      target 远山零售
      name 项目合作
    - source 星云科技
      target 云帆金融
    - source 远山零售
      target 北辰制造
    - source 云帆金融
      target 合创医疗
    - source 顾问 A
      target 星云科技
    - source 顾问 A
      target 远山零售
    - source 顾问 B
      target 云帆金融
    - source 顾问 B
      target 合创医疗`,
  },
  {
    type: 'mindmap',
    label: '思维导图',
    group: '关系',
    note: '默认中心向两侧展开，direction 可改方向',
    content: `vis mindmap
title 增长放缓诊断
data
  name 营收增长放缓
  children
    - name 新客减少
      children
        - name 渠道疲劳
        - name 内容老化
        - name 品牌声量下降
    - name 转化下降
      children
        - name 试用路径变长
        - name 价值感知不足
    - name 客单下降
      children
        - name 折扣增加
        - name 套餐降级
    - name 流失上升
      children
        - name 首次价值延迟
        - name 服务覆盖不足`,
  },
  {
    type: 'indented-tree',
    label: '缩进树',
    group: '关系',
    note: '紧凑层级名单，适合目录与分类',
    content: `vis indented-tree
title 数据产品目录
data
  name 数据平台
  children
    - name 数据接入
      children
        - name 实时同步
        - name 批量导入
        - name API 拉取
    - name 指标中心
      children
        - name 原子指标
        - name 派生指标
        - name 指标血缘
    - name 洞察应用
      children
        - name 看板
        - name 自助分析
        - name 智能问数`,
  },
  {
    type: 'organization-chart',
    label: '组织架构',
    group: '关系',
    note: '自上而下的树形层级',
    content: `vis organization-chart
title 星云科技产品组织
data
  name 产品委员会
  children
    - name 产品平台
      children
        - name 账户与权限
        - name 工作流
        - name 开放平台
    - name 数据产品
      children
        - name 指标中心
        - name 分析体验
    - name 行业方案
      children
        - name 零售
        - name 金融
        - name 制造
    - name 设计中心
      children
        - name 产品设计
        - name 设计系统`,
  },
  {
    type: 'fishbone-diagram',
    label: '鱼骨图',
    group: '关系',
    note: '问题在右，一级原因分列两侧',
    content: `vis fishbone-diagram
title 线索转化率下降
data
  name 转化率下降
  children
    - name 人员
      children
        - name 新销售占比高
        - name 产品培训不足
    - name 流程
      children
        - name 审批链路变长
        - name 线索分配延迟
    - name 产品
      children
        - name 试用门槛提高
        - name 关键功能缺失
    - name 市场
      children
        - name 低意向流量增加
        - name 竞品促销
    - name 数据
      children
        - name 画像标签过期
        - name 归因口径变化
    - name 环境
      children
        - name 行业预算收缩
        - name 旺季结束`,
  },
  {
    type: 'table',
    label: '表格',
    group: '文本',
    note: '精确数据查阅，由 VueUiTable 承载',
    content: `vis table
title 区域经营明细
data
  - 区域 华东
    收入 428
    客户数 186
    续费率 92.4
    同比 18.2
  - 区域 华南
    收入 316
    客户数 142
    续费率 89.8
    同比 14.6
  - 区域 华北
    收入 264
    客户数 118
    续费率 87.1
    同比 9.8
  - 区域 西部
    收入 176
    客户数 86
    续费率 84.6
    同比 22.4`,
  },
  {
    type: 'summary',
    label: '智能摘要',
    group: '文本',
    note: 'Markdown + 语义标注 + 行内 sparkline',
    content: `# Q4 经营摘要

## 核心结论

在 [2025 Q4](time_desc)，[总收入](metric_name)达到 [¥1,284 万](metric_value, origin=12840000)，环比增长 [18.6%](ratio_value, origin=0.186, assessment="positive")。增长主要来自 [企业版扩容](dim_value) 与 [渠道合作](dim_value)。

## 值得关注

- [续费率](metric_name)保持在 [92.4%](metric_value)，但 [华南地区](dim_value) 环比 [下降 1.8 个百分点](delta_value, assessment="negative")。
- 新客获取成本为 [¥2,860](metric_value)，相比上季度 [下降 6.2%](ratio_value, origin=-0.062, assessment="positive")。
- [企业版](dim_value) 在收入贡献中 [排名第一](rank, detail=[512, 386, 241, 145])。

> 下一阶段优先提升首次价值到达速度，并针对华南团队补齐行业方案培训。

## 行动项

1. 将新客试用引导拆成 **三步任务卡**。
2. 两周内完成 3 场行业方案共创。
3. 对高潜流失客户启动 **主动成功计划**。`,
  },
];

export const EXAMPLE_GROUPS = ['统计', '关系', '文本'] as const;

export function findExample(type: string): ChartExample | undefined {
  return EXAMPLES.find((example) => example.type === type);
}
