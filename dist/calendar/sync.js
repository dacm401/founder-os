/**
 * 从飞书日历事件转换为内部 CalendarEvent 格式
 */
function convertFeishuEvent(feishuEvent) {
    const startTime = new Date(parseInt(feishuEvent.start_time) * 1000);
    const endTime = new Date(parseInt(feishuEvent.end_time) * 1000);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    return {
        id: feishuEvent.event_id,
        title: feishuEvent.summary || '无标题',
        description: feishuEvent.description,
        startTime,
        endTime,
        duration,
        attendees: [], // 飞书 API 需要单独获取参与人，先留空
        location: feishuEvent.location,
        isOnline: !!feishuEvent.vchat?.vc_type,
        meetingUrl: feishuEvent.vchat?.meeting_url
    };
}
// 从飞书导入的日程（模拟）
let importedEvents = [];
/**
 * 设置从飞书导入的日程
 */
export function setImportedEvents(events) {
    importedEvents = events;
}
/**
 * 获取已导入的飞书日程
 */
export function getImportedEvents() {
    return importedEvents;
}
// 模拟数据 - 当飞书日历为空时使用
export function generateMockCalendarEvents() {
    const today = new Date();
    const events = [
        {
            id: 'evt_001',
            title: '与王总（XX资本）聊项目',
            description: 'A轮融资洽谈',
            startTime: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
            endTime: new Date(today.getTime() + 3 * 60 * 60 * 1000),
            duration: 60,
            attendees: [
                { id: 'att_001', name: '王总', email: 'wang@xxcapital.com', isOrganizer: false },
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true }
            ],
            location: '线上会议',
            isOnline: true,
            meetingUrl: 'https://meet.xx.com/abc123'
        },
        {
            id: 'evt_002',
            title: '与李律师讨论股权架构设计',
            description: '天使轮后股权调整',
            startTime: new Date(today.getTime() + 26 * 60 * 60 * 1000), // tomorrow
            endTime: new Date(today.getTime() + 27 * 60 * 60 * 1000),
            duration: 60,
            attendees: [
                { id: 'att_003', name: '李律师', email: 'li@lawfirm.com', isOrganizer: false },
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true }
            ],
            location: 'XX律师事务所',
            isOnline: false
        },
        {
            id: 'evt_003',
            title: '面试行政助理候选人A',
            description: '第一个非技术岗位招聘',
            startTime: new Date(today.getTime() + 50 * 60 * 60 * 1000), // day after tomorrow
            endTime: new Date(today.getTime() + 51 * 60 * 60 * 1000),
            duration: 60,
            attendees: [
                { id: 'att_004', name: '候选人A', email: 'candidate_a@email.com', isOrganizer: false },
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true }
            ],
            location: '公司会议室',
            isOnline: false
        },
        {
            id: 'evt_004',
            title: '与潜在客户李总晚饭',
            description: '商务拓展',
            startTime: new Date(today.getTime() + 74 * 60 * 60 * 1000), // 3 days later
            endTime: new Date(today.getTime() + 77 * 60 * 60 * 1000),
            duration: 180,
            attendees: [
                { id: 'att_005', name: '李总', email: 'li@enterprise.com', isOrganizer: false },
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true }
            ],
            location: '北京某某餐厅',
            isOnline: false
        },
        {
            id: 'evt_005',
            title: '产品路线图评审',
            description: 'Q2产品规划',
            startTime: new Date(today.getTime() + 98 * 60 * 60 * 1000), // 4 days later
            endTime: new Date(today.getTime() + 100 * 60 * 60 * 1000),
            duration: 120,
            attendees: [
                { id: 'att_006', name: '产品经理小王', email: 'pm@company.com', isOrganizer: true },
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true },
                { id: 'att_007', name: 'CTO老赵', email: 'cto@company.com', isOrganizer: false }
            ],
            location: '线上会议',
            isOnline: true
        },
        {
            id: 'evt_006',
            title: '团队周例会',
            description: '每周团队同步',
            startTime: new Date(today.getTime() + 122 * 60 * 60 * 1000), // 5 days later
            endTime: new Date(today.getTime() + 124 * 60 * 60 * 1000),
            duration: 120,
            attendees: [
                { id: 'att_002', name: '张明（创始人）', email: 'zhangming@company.com', isOrganizer: true },
                { id: 'att_006', name: '产品经理小王', email: 'pm@company.com', isOrganizer: false },
                { id: 'att_007', name: 'CTO老赵', email: 'cto@company.com', isOrganizer: false }
            ],
            location: '公司会议室',
            isOnline: false
        }
    ];
    return events;
}
/**
 * 同步日历 - 优先使用飞书数据，如果没有则用模拟数据
 * 注意：这个函数需要从外部传入飞书事件数据
 */
export async function syncCalendar(feishuEvents) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    // 如果有飞书数据，优先使用
    if (feishuEvents && feishuEvents.length > 0) {
        console.log(`📱 读取到 ${feishuEvents.length} 个飞书日程`);
        return feishuEvents.map(convertFeishuEvent);
    }
    // 否则使用模拟数据
    console.log('📱 飞书日历为空，使用模拟数据');
    return generateMockCalendarEvents();
}
