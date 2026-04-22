import OpenAI from 'openai';
import { getTrendAnalysis } from '../storage/history';
// 初始化大模型客户端（支持 OpenAI 兼容格式）
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY;
    const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1';
    return new OpenAI({
        apiKey: apiKey || 'dummy-key',
        baseURL
    });
}
/**
 * 语义分析关键词扩展
 * 用于识别日程标题中的隐含语义
 */
const SEMANTIC_PATTERNS = {
    // 高风险/不确定性
    uncertain: ['不确定', '待定', '可能', '试试', '聊聊', '随便', '随便聊聊', '初步', '意向', '探讨'],
    // 高价值/战略性
    strategic: ['战略', '规划', '愿景', '使命', '文化', '价值观', '长期', '核心', '关键', '重要', 'CEO'],
    // 执行/运营
    execution: ['执行', '落地', '实施', '跟进', '完成', ' deadline', '截止', '必须', '紧急'],
    // 外部关系
    external: ['客户', '合作伙伴', '投资人', '政府', '媒体', 'KOL', '生态', '战略合作'],
    // 内部管理
    internal: ['团队', '例会', '1:1', '周会', '日报', '周报', '复盘', '回顾'],
    // 个人成长
    personal: ['学习', '读书', '运动', '健身', '教练', '冥想', '休息', '度假', '家庭', '陪孩子']
};
/**
 * 识别隐含语义
 */
function extractImplicitSemantics(title) {
    const semantics = [];
    const lowerTitle = title.toLowerCase();
    for (const [category, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerTitle.includes(pattern.toLowerCase())) {
                semantics.push(category);
                break;
            }
        }
    }
    return semantics;
}
/**
 * 判断日程是否暗示焦虑或压力
 */
function detectStressIndicators(title, description) {
    const reasons = [];
    const text = `${title} ${description || ''}`.toLowerCase();
    // 高压力关键词
    const highStress = ['焦虑', '崩溃', '紧急', '危机', '抢救', '补救', '加班', '通宵', '赶'];
    const mediumStress = ['不确定', '待定', '压力大', '困难', '挑战', '复杂', '敏感'];
    for (const kw of highStress) {
        if (text.includes(kw)) {
            reasons.push(`提及"${kw}"`);
        }
    }
    for (const kw of mediumStress) {
        if (text.includes(kw)) {
            reasons.push(`涉及"${kw}"`);
        }
    }
    // 检查是否有明确的决策点
    if (text.includes('决定') || text.includes('决策') || text.includes('选择') || text.includes('拍板')) {
        reasons.push('涉及重要决策');
    }
    // 检查是否有时间紧迫性
    if (text.includes('今天') || text.includes('明天') || text.includes('本周') || text.includes('尽快')) {
        reasons.push('有时间紧迫性');
    }
    if (reasons.length >= 2)
        return { level: 'high', reasons };
    if (reasons.length === 1)
        return { level: 'medium', reasons };
    return { level: 'low', reasons: [] };
}
/**
 * 生成智能分析 Prompt - 增强版
 */
function buildAnalysisPrompt(event, context) {
    const title = event.title || '无标题';
    const description = event.description || '无描述';
    const startTime = new Date(event.startTime);
    // 提取隐含语义
    const semantics = extractImplicitSemantics(title);
    const stress = detectStressIndicators(title, description);
    // 判断时间段
    const hour = startTime.getHours();
    const isMorning = hour >= 6 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;
    const isNight = hour >= 22 || hour < 6;
    const timeSlot = isMorning ? '上午' : isAfternoon ? '下午' : isEvening ? '傍晚' : '深夜';
    return `你是FounderOS，一个专注于创始人成长的AI助手。

## 创始人背景
- 科技行业创业者，技术出身
- 刚拿到融资，需要注意股权稀释和团队扩张
- 关注产品优先级和商业化
- 核心原则：不打扰、不决策、只激发思考

## 日程信息
- 标题：${title}
- 时间：${timeSlot} ${startTime.toLocaleString('zh-CN', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
- 描述：${description}
- 隐含语义：${semantics.length > 0 ? semantics.join('、') : '无明显特征'}

## 当前状态
- 时间段：${timeSlot}${isNight ? '（注意休息）' : ''}${isEvening ? '（注意工作时长）' : ''}
- 压力信号：${stress.level === 'high' ? '高（' + stress.reasons.join('、') + '）' : stress.level === 'medium' ? '中等（' + stress.reasons.join('、') + '）' : '低'}
${context?.thisWeekStats ? `- 本周事务分布：${JSON.stringify(context.thisWeekStats)}` : ''}

## 任务
请分析这个日程，生成JSON格式的智能提醒：

{
  "importance": 评分(0-100),
  "category": "分类(fundraising/legal/hiring/sales/product/team/finance/personal/other)",
  "briefTip": "一句话提醒(不超过20字)",
  "detailedExplanation": "详细建议(50-100字，针对这个具体日程)",
  "encouragement": "一句鼓励的话",
  "stressLevel": "high/medium/low",
  "requiresFollowUp": true/false
}

评分标准（重要性）：
- 90+: 战略级（融资、重要合同、核心产品决策）
- 70-89: 高优先级（关键招聘、重要客户、重大合作）
- 50-69: 常规事务
- <50: 被动响应或可推迟

注意：
- 直接返回JSON，不要其他内容
- 如果日程信息太少无法分析，category设为"other"，importance设为50
- 建议要具体针对这个日程和当前上下文
- 风格：直接、有洞察、不说废话
- 对于深夜日程，要提醒注意休息`;
}
/**
 * 解析大模型返回的 JSON
 */
function parseAIResponse(text) {
    try {
        // 尝试提取 JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                importance: typeof parsed.importance === 'number' ? parsed.importance : 50,
                category: parsed.category || 'other',
                briefTip: parsed.briefTip || '',
                detailedExplanation: parsed.detailedExplanation || '',
                encouragement: parsed.encouragement || '',
                stressLevel: parsed.stressLevel || 'low',
                requiresFollowUp: parsed.requiresFollowUp || false
            };
        }
    }
    catch (e) {
        console.error('解析AI响应失败:', e);
    }
    // 返回部分结果而不是 null，让调用方处理默认值
    return { importance: 50, category: 'other', briefTip: '', detailedExplanation: '', encouragement: '', stressLevel: 'low', requiresFollowUp: false };
}
/**
 * 用大模型分析单个日程
 */
async function analyzeWithAI(event, context) {
    const prompt = buildAnalysisPrompt(event, context);
    try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
            messages: [
                { role: 'system', content: '你是一个专注于创始人成长的AI助手，擅长分析日程对创始人的影响，给出有洞察的建议。直接返回JSON。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });
        const text = response.choices[0]?.message?.content || '';
        const result = parseAIResponse(text);
        if (result && result.category) {
            return {
                importance: result.importance || 50,
                category: result.category,
                briefTip: result.briefTip || '这是一个需要关注的日程',
                detailedExplanation: result.detailedExplanation || '请根据日程内容自行判断',
                encouragement: result.encouragement || '相信你的判断',
                stressLevel: result.stressLevel || 'low',
                requiresFollowUp: result.requiresFollowUp || false
            };
        }
    }
    catch (error) {
        console.error('AI分析失败:', error);
    }
    // AI 失败时返回默认分析
    return generateDefaultAnalysis(event);
}
/**
 * 默认分析（当AI不可用时）- 增强版
 */
function generateDefaultAnalysis(event) {
    const title = event.title || '';
    const description = event.description || '';
    // 提取隐含语义
    const semantics = extractImplicitSemantics(title);
    const stress = detectStressIndicators(title, description);
    // 判断时间段
    const hour = new Date(event.startTime).getHours();
    const isNightTime = hour >= 22 || hour < 6;
    // 智能分类
    let category = 'other';
    let importance = 50;
    if (title.includes('融资') || title.includes('投资') || title.includes('BP') || title.includes('FA')) {
        category = 'fundraising';
        importance = 85;
    }
    else if (title.includes('律师') || title.includes('股权') || title.includes('法律') || title.includes('合同') || title.includes('架构师')) {
        category = 'legal';
        importance = 80;
    }
    else if (title.includes('面试') || title.includes('招聘') || title.includes('offer') || title.includes('CTO') || title.includes('技术负责人')) {
        category = 'hiring';
        importance = 75;
    }
    else if (title.includes('客户') || title.includes('签约') || title.includes('回款') || title.includes('签单')) {
        category = 'sales';
        importance = 80;
    }
    else if (title.includes('产品') || title.includes('PRD') || title.includes('评审') || title.includes('路线图') || title.includes('技术选型')) {
        category = 'product';
        importance = 70;
    }
    else if (title.includes('团队') || title.includes('例会') || title.includes('1:1') || title.includes('周会')) {
        category = 'team';
        importance = 60;
    }
    else if (title.includes('财务') || title.includes('税务') || title.includes('预算') || title.includes('现金流')) {
        category = 'finance';
        importance = 75;
    }
    else if (title.includes('学习') || title.includes('健身') || title.includes('运动') || title.includes('教练')) {
        category = 'personal';
        importance = 40;
    }
    // 根据语义调整
    if (semantics.includes('uncertain')) {
        importance = Math.max(30, importance - 20);
    }
    if (semantics.includes('strategic')) {
        importance = Math.min(95, importance + 15);
    }
    if (semantics.includes('execution')) {
        importance = Math.min(95, importance + 10);
    }
    // 深夜日程降低重要性
    if (isNightTime && category !== 'personal') {
        importance = Math.max(20, importance - 15);
    }
    // 生成提示
    let briefTip = '';
    let detailedExplanation = '';
    if (isNightTime && category !== 'personal') {
        briefTip = '🌙 深夜日程，注意休息';
        detailedExplanation = '这个日程安排在深夜。创始人的精力是最重要的资产，长期熬夜会影响判断力和健康。建议考虑：1）这个会议是否真的需要在这个时间？2）能否改到明天上午？3）如果必须参加，注意会后休息。';
    }
    else if (stress.level === 'high') {
        briefTip = '⚠️ 高压力日程，做好准备';
        detailedExplanation = `这个日程似乎涉及一些压力点：${stress.reasons.join('、')}。建议：1）提前准备可能的方案；2）设定明确的会议目标；3）记得给自己留出缓冲时间。`;
    }
    else if (semantics.includes('uncertain')) {
        briefTip = '🤔 不确定的会议，明确目标';
        detailedExplanation = '这类"聊聊"类的会议容易陷入无效讨论。建议提前想清楚：1）你希望通过这次沟通达成什么？2）准备 2-3 个具体问题；3）设定时间上限。';
    }
    else if (category === 'personal') {
        briefTip = '🌿 个人时间，珍惜休息';
        detailedExplanation = '这是你的个人时间。对于创始人来说，保持精力和健康是长期战斗的基础。尽量不受干扰地享受这段时间。';
    }
    else {
        briefTip = '专注处理，推动进展';
        detailedExplanation = `这是一个${category === 'other' ? '常规' : category}相关的日程。建议提前准备、设定目标、会议后及时跟进。`;
    }
    // 鼓励语
    const encouragements = [
        '相信你的判断，你已经准备好了',
        '保持专注，重要的会议你都能 handle',
        '一天一天来，你在做正确的事',
        '记得休息，持续的战斗需要好状态'
    ];
    return {
        importance,
        category,
        briefTip,
        detailedExplanation,
        encouragement: encouragements[Math.floor(Math.random() * encouragements.length)],
        stressLevel: stress.level,
        requiresFollowUp: importance >= 70
    };
}
/**
 * 分析单个日程 - 智能版本
 */
export async function analyzeEvent(event) {
    // 检查是否有 API Key
    const apiKey = process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY;
    // 获取本周统计作为上下文
    let context = {};
    try {
        const trends = await getTrendAnalysis();
        if (trends.thisWeek) {
            context.thisWeekStats = trends.thisWeek.categoryCount;
        }
    }
    catch (e) {
        // 忽略历史数据获取失败
    }
    if (!apiKey) {
        // 无 API Key 时使用增强的默认分析
        return generateDefaultAnalysis(event);
    }
    // 使用 AI 分析
    return analyzeWithAI(event, context);
}
// HealthReport 在下方定义为 export interface，直接可用
/**
 * 批量分析日程 - 带并发控制
 */
export async function analyzeCalendar(events, onProgress) {
    const results = new Map();
    const concurrency = 3; // 并发数
    for (let i = 0; i < events.length; i += concurrency) {
        const batch = events.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(async (event) => {
            const analysis = await analyzeEvent(event);
            return { id: event.id, analysis };
        }));
        for (const { id, analysis } of batchResults) {
            results.set(id, analysis);
        }
        // 进度回调
        if (onProgress) {
            onProgress(Math.min(i + concurrency, events.length), events.length);
        }
        // 避免 API 限流
        if (i + concurrency < events.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return results;
}
export async function checkHealth(events, days = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // 统计各类别日程
    const categoryCount = {};
    const categoryHours = {};
    let totalEvents = 0;
    let eveningEvents = 0;
    let weekendEvents = 0;
    for (const event of events) {
        if (event.startTime >= startDate) {
            const title = event.title || '';
            const eventDate = new Date(event.startTime);
            const hour = eventDate.getHours();
            const dayOfWeek = eventDate.getDay();
            // 分类
            let category = 'other';
            if (title.includes('融资') || title.includes('投资') || title.includes('BP') || title.includes('FA'))
                category = 'fundraising';
            else if (title.includes('律师') || title.includes('股权') || title.includes('法律') || title.includes('架构'))
                category = 'legal';
            else if (title.includes('面试') || title.includes('招聘') || title.includes('offer') || title.includes('裁员'))
                category = 'hiring';
            else if (title.includes('客户') || title.includes('签约') || title.includes('销售') || title.includes('回款'))
                category = 'sales';
            else if (title.includes('产品') || title.includes('评审') || title.includes('路线图') || title.includes('技术债'))
                category = 'product';
            else if (title.includes('团队') || title.includes('例会') || title.includes('1:1') || title.includes('团建'))
                category = 'team';
            else if (title.includes('财务') || title.includes('税务') || title.includes('预算') || title.includes('现金流'))
                category = 'finance';
            else if (title.includes('学习') || title.includes('健身') || title.includes('运动') || title.includes('教练') || title.includes('休息'))
                category = 'personal';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            // 计算时长（小时）
            const durationHours = event.duration / 60;
            categoryHours[category] = (categoryHours[category] || 0) + durationHours;
            totalEvents++;
            // 统计异常时间
            if (hour >= 20 || hour < 6)
                eveningEvents++;
            if (dayOfWeek === 0 || dayOfWeek === 6)
                weekendEvents++;
        }
    }
    const issues = [];
    const suggestions = [];
    const trends = [];
    // === 基础检查 ===
    if (totalEvents > 0) {
        // 融资占比检查
        const fundraisingRatio = (categoryCount['fundraising'] || 0) / totalEvents;
        if (fundraisingRatio > 0.4) {
            issues.push('⚠️ 融资事务占比过高（>' + Math.round(fundraisingRatio * 100) + '%）');
            suggestions.push('💡 产品和团队才是公司根本，建议适当减少融资相关事务');
        }
    }
    // === 时间分配检查 ===
    const categoryNames = {
        fundraising: '融资', legal: '法务', hiring: '招聘', sales: '销售',
        product: '产品', team: '团队', finance: '财务', personal: '个人', other: '其他'
    };
    // 关键事项缺失
    const missingCategories = [];
    if (!categoryCount['product'] && totalEvents > 3)
        missingCategories.push('产品');
    if (!categoryCount['team'] && totalEvents > 3)
        missingCategories.push('团队');
    if (!categoryCount['legal'] && totalEvents > 5)
        missingCategories.push('法务');
    if (!categoryCount['finance'] && totalEvents > 5)
        missingCategories.push('财务');
    if (missingCategories.length > 0) {
        issues.push('⚠️ 本周缺少：' + missingCategories.join('、') + '相关事务');
        for (const cat of missingCategories) {
            if (cat === '产品')
                suggestions.push('💡 建议每周至少安排一次产品评审，保持对产品方向的把控');
            if (cat === '团队')
                suggestions.push('💡 建议每周与核心团队成员进行 1:1 沟通');
            if (cat === '法务')
                suggestions.push('💡 建议每月审阅一次合同和股权事务');
            if (cat === '财务')
                suggestions.push('💡 建议每周关注现金流，确保公司健康发展');
        }
    }
    // === 时间异常检查 ===
    if (eveningEvents >= 3) {
        issues.push('🌙 本周有 ' + eveningEvents + ' 个深夜/早起日程');
        suggestions.push('💡 连续高压会累积疲劳，考虑调整部分日程到白天');
    }
    if (weekendEvents >= 2) {
        issues.push('📅 本周有 ' + weekendEvents + ' 个周末日程');
        suggestions.push('💡 创始人也需要休息，适度减少周末工作');
    }
    // === 个人时间检查 ===
    if (!categoryCount['personal'] && totalEvents > 5) {
        issues.push('⚠️ 本周没有安排个人时间（运动、学习、休息等）');
        suggestions.push('💡 持续高效需要精力管理，建议每周至少安排 2 小时个人时间');
    }
    else if (categoryCount['personal']) {
        trends.push('✅ 有 ' + categoryCount['personal'] + ' 个个人相关日程');
    }
    // === 趋势对比 ===
    try {
        const trendData = await getTrendAnalysis();
        if (trendData.thisWeek && trendData.lastWeek) {
            const thisTotal = trendData.thisWeek.totalEvents;
            const lastTotal = trendData.lastWeek.totalEvents;
            if (thisTotal > lastTotal * 1.3) {
                issues.push('📈 本周日程量较上周增长 ' + Math.round((thisTotal / lastTotal - 1) * 100) + '%');
                suggestions.push('💡 日程量增长较快，注意不要超载');
            }
            else if (thisTotal < lastTotal * 0.7) {
                trends.push('📉 本周日程量较上周减少，可能是恢复期');
            }
        }
    }
    catch (e) {
        // 忽略趋势获取失败
    }
    // === 计算恢复天数 ===
    let recoveryDays = 0;
    for (let i = 0; i < days; i++) {
        const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayEvents = events.filter(e => {
            const d = new Date(e.startTime);
            return d.toDateString() === checkDate.toDateString();
        });
        // 如果这一天日程少于等于 2 个，且没有深夜日程，认为是恢复日
        const hasEvening = dayEvents.some(e => {
            const h = new Date(e.startTime).getHours();
            return h >= 22 || h < 6;
        });
        if (dayEvents.length <= 2 && !hasEvening && i > 0) {
            break;
        }
        recoveryDays++;
    }
    if (recoveryDays >= 5) {
        issues.push('🔥 已经连续 ' + recoveryDays + ' 天高强度工作');
        suggestions.push('💡 建议明天或后天安排一个「无会议日」，让大脑恢复');
    }
    // === 正面反馈 ===
    if (issues.length === 0) {
        trends.push('✨ 本周时间分配比较健康，继续保持！');
    }
    const score = Math.max(0, 100 - issues.length * 15 + trends.length * 5);
    return {
        score,
        issues,
        suggestions,
        trends,
        recoveryDays
    };
}
