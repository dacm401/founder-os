/**
 * 解析知识库文档，提取分类规则
 */
function parseKnowledgeBase(markdown) {
    const rules = [];
    // 简单的分类解析
    const categories = [
        { id: 'fundraising', name: '融资相关', keywords: ['融资', '投资人', 'BP', 'Term', 'Sheet', '路演', '尽调', '投资协议', '投资'] },
        { id: 'legal', name: '法律相关', keywords: ['律师', '股权', '合同', '法律', '合规', '知识产权'] },
        { id: 'hiring', name: '招聘相关', keywords: ['面试', '招聘', 'offer', '入职', '团队成员'] },
        { id: 'sales', name: '销售/客户相关', keywords: ['客户', '签约', '销售', '商务', '晚饭', '饭局'] },
        { id: 'product', name: '产品相关', keywords: ['产品', '评审', '路线图', '技术', '设计'] },
        { id: 'team', name: '团队相关', keywords: ['团队', '例会', '1:1', '周会', '月会'] }
    ];
    const importanceMap = {
        fundraising: { min: 85, max: 95 },
        legal: { min: 80, max: 90 },
        hiring: { min: 80, max: 90 },
        sales: { min: 80, max: 90 },
        product: { min: 75, max: 85 },
        team: { min: 70, max: 80 }
    };
    const tips = {
        fundraising: {
            brief: '这是融资关键节点。提前准备估值策略、投资人常见问题、你的核心优势。',
            detailed: '融资是公司的"生死线"。投资人常问：技术壁垒、市场空间、团队优势、竞争格局、财务预测。建议准备3个版本：30秒版（电梯演讲）、3分钟版（详细阐述）、技术版（深入细节）。了解投资人的投资风格和近期动态会让对话更顺畅。',
            encourage: '投资人见多了项目，你有你的独特优势。准备充分，从容应对。你不是在"求人"，是在找合作伙伴。'
        },
        legal: {
            brief: '法律/股权会议很重要，现在的决策会影响未来3-5年。建议充分准备想清楚的问题。',
            detailed: '股权是公司的"宪法"，一旦定下来再改很难。常见坑：创始人平均分股权（没有决策核心）、不设vesting（有人early exit其他人被动）、期权池太小。律师是服务方，不是决策方。你要有主见，每个条款问"为什么这样设计，有其他选择吗"。',
            encourage: '股权设计是公司的宪法，现在多花1小时想清楚，未来少100个麻烦。你是创始人，要有主见。'
        },
        hiring: {
            brief: '招聘是关键决策，选错人成本很高（6-12个月工资+团队士气影响）。仔细考察。',
            detailed: '第一个非技术岗位招聘很重要。助理/行政看似简单但影响你50%的时间质量。面试要点：1）考察细心和靠谱；2）问行为问题；3）必须做背景调查；4）设置3个月试用期，明确考核标准。',
            encourage: 'Hire slow, fire fast。这个岗位不直接创造收入，但影响你50%的时间质量。宁缺毋滥。'
        },
        sales: {
            brief: '客户相关日程直接关系到收入。提前准备产品价值主张和客户可能的问题。',
            detailed: '与客户/潜在客户见面是商业拓展的关键。准备要点：1）明确你的核心价值；2）了解客户背景；3）准备好成功案例；4）设定本次目标。第一次别急着卖，先建立信任。',
            encourage: '每一次与客户的交流都是建立信任的机会。真诚、专业、不卑不亢。'
        },
        product: {
            brief: '产品会议是公司方向的核心。建议确保会议有明确产出。',
            detailed: '产品路线图评审决定未来3-6个月的技术方向和资源分配。常见问题：需求太多做不过来（需要优先级框架）、技术债累积（需要预留20%时间）、方向频繁变更（需要OKR对齐）。',
            encourage: '产品是公司的根本。花在产品上的时间，永远值得。'
        },
        team: {
            brief: '团队会议保持信息同步。但注意别让会议本身成为工作。',
            detailed: '团队例会的目的是信息同步和问题解决，不是汇报工作。建议：1）控制时间；2）鼓励发现问题；3）重要决策要明确；4）会后要有明确行动项。',
            encourage: '团队是你最宝贵的资产。好的团队例会能让大家更有方向感和凝聚力。'
        }
    };
    // 构建规则
    for (const cat of categories) {
        rules.push({
            category: cat.id,
            keywords: cat.keywords,
            importanceRange: importanceMap[cat.id] || { min: 70, max: 80 },
            briefTip: tips[cat.id]?.brief || '',
            detailedExplanation: tips[cat.id]?.detailed || '',
            encouragement: tips[cat.id]?.encourage || ''
        });
    }
    return rules;
}
/**
 * 根据知识库规则分析日程
 */
function analyzeByRules(event, rules) {
    const title = event.title;
    const description = event.description || '';
    const fullText = title + ' ' + description;
    // 匹配分类
    for (const rule of rules) {
        const matched = rule.keywords.some(keyword => fullText.includes(keyword));
        if (matched) {
            // 根据匹配数量调整重要性
            const matchCount = rule.keywords.filter(keyword => fullText.includes(keyword)).length;
            const importance = Math.min(rule.importanceRange.max, rule.importanceRange.min + matchCount * 3);
            return {
                importance,
                category: rule.category,
                briefTip: rule.briefTip,
                detailedExplanation: rule.detailedExplanation,
                encouragement: rule.encouragement
            };
        }
    }
    return null;
}
/**
 * 分析单个日程
 */
export async function analyzeEvent(event, knowledgeBase) {
    // 解析知识库
    const rules = parseKnowledgeBase(knowledgeBase || '');
    // 按规则分析
    const result = analyzeByRules(event, rules);
    if (result) {
        return result;
    }
    // 如果没有匹配，返回默认分析
    return generateDefaultAnalysis(event);
}
/**
 * 默认分析（当没有匹配规则时）
 */
function generateDefaultAnalysis(event) {
    const title = event.title;
    return {
        importance: 50,
        category: 'other',
        briefTip: '这个日程需要你自行判断重要性。',
        detailedExplanation: '根据日程内容，我无法准确判断重要性。你可以思考：1）这个会议是否影响公司关键决策？2）是否涉及重要合作伙伴？3）是否有时间敏感性？',
        encouragement: '相信你的直觉。你是最了解公司情况的人。'
    };
}
/**
 * 分析多个日程
 */
export async function analyzeCalendar(events, knowledgeBase) {
    const results = new Map();
    for (const event of events) {
        const analysis = await analyzeEvent(event, knowledgeBase);
        results.set(event.id, analysis);
    }
    return results;
}
export function checkHealth(events, days = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // 统计各类别日程数量
    const categoryCount = {};
    let totalEvents = 0;
    for (const event of events) {
        if (event.startTime >= startDate) {
            // 简单分类
            const title = event.title;
            let category = 'other';
            if (title.includes('融资') || title.includes('投资') || title.includes('BP'))
                category = 'fundraising';
            else if (title.includes('律师') || title.includes('股权') || title.includes('法律'))
                category = 'legal';
            else if (title.includes('面试') || title.includes('招聘') || title.includes('offer'))
                category = 'hiring';
            else if (title.includes('客户') || title.includes('签约') || title.includes('销售'))
                category = 'sales';
            else if (title.includes('产品') || title.includes('评审') || title.includes('路线图'))
                category = 'product';
            else if (title.includes('团队') || title.includes('例会') || title.includes('1:1'))
                category = 'team';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            totalEvents++;
        }
    }
    const issues = [];
    const suggestions = [];
    // 检查时间分配
    if (totalEvents > 0) {
        const fundraisingRatio = (categoryCount['fundraising'] || 0) / totalEvents;
        // 融资太多
        if (fundraisingRatio > 0.5) {
            issues.push('⚠️ 你最近50%以上的时间在处理融资相关事务');
            suggestions.push('💡 融资固然重要，但产品才是公司的根本。建议分配更多时间在产品开发上。');
        }
    }
    // 检查关键事项缺失
    if (!categoryCount['legal'] && totalEvents > 5) {
        issues.push('⚠️ 你最近没有法律/股权相关的会议');
        suggestions.push('💡 建议至少每月审阅一次合同和股权相关事务。');
    }
    if (!categoryCount['team'] && totalEvents > 3) {
        issues.push('⚠️ 你最近没有与团队的例会或1:1');
        suggestions.push('💡 建议每周至少与核心团队成员进行1:1沟通。');
    }
    if (!categoryCount['product'] && totalEvents > 3) {
        issues.push('⚠️ 你最近没有产品相关的会议');
        suggestions.push('💡 产品是公司的根本，建议至少每两周安排一次产品评审。');
    }
    const score = Math.max(0, 100 - issues.length * 20);
    return { score, issues, suggestions };
}
