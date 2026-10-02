/**
 * Operations namespace: support tickets, reviews, notifications, import history.
 */
const operations: Record<string, string> = {
  // Support tickets
  "Support Ticket": "工单",
  "New Support Ticket": "新建工单",
  "Create Ticket": "创建工单",
  "Ticket Details": "工单详情",
  "Ticket not found": "工单不存在",
  Subject: "主题",
  Priority: "优先级",
  Low: "低",
  Medium: "中",
  High: "高",
  Urgent: "紧急",
  "Ticket Status": "工单状态",
  Replies: "回复",
  Reply: "回复",
  "Send Reply": "发送回复",
  "No replies yet": "暂无回复",
  Assignee: "负责人",
  "Created by": "创建人",

  // Reviews
  "Product Review": "商品评价",
  "Product Reviews": "商品评价",
  Rating: "评分",
  Comment: "评价内容",
  "Review Status": "评价状态",
  "Approve Review": "通过评价",
  "Reject Review": "驳回评价",
  "No reviews yet": "暂无评价",
  Reviewer: "评价人",

  // Notifications
  "Notification Center": "通知中心",
  "Unread notifications": "未读通知",
  "All caught up": "全部已读",
  "No notifications found": "未找到通知",
  "Mark all as read": "全部标为已读",
  "Notification settings": "通知设置",

  // Import history
  "Import History": "导入历史",
  "Import Details": "导入详情",
  "Import Type": "导入类型",
  "File Name": "文件名",
  "File Size": "文件大小",
  "Total Rows": "总行数",
  "Success Rows": "成功行数",
  "Failed Rows": "失败行数",
  "Imported at": "导入时间",
  "No imports yet": "暂无导入记录",

  // Support tickets — list / detail
  "Your Support Tickets": "您的支持工单",
  "Open and track tickets you've sent. Create a ticket to get help from a product owner.":
    "查看并跟踪您发送的工单。创建工单即可获得产品负责人的帮助。",
  "Sent by you": "由您发送",
  "Workflow state — managed by support staff": "流转状态——由支持人员管理",

  // Support tickets — create / edit dialog
  "Edit Support Ticket": "编辑支持工单",
  "Create Support Ticket": "创建支持工单",
  "Update subject, description, status, or priority. Send-to cannot be changed here.":
    "更新主题、描述、状态或优先级。发送对象不能在此修改。",
  "Update subject, description, or priority. Status and Send-to cannot be changed here.":
    "更新主题、描述或优先级。状态和发送对象不能在此修改。",
  "Open a new support ticket. Add a subject, description, and choose who to send it to (product owner).":
    "提交新的支持工单。填写主题、描述，并选择要发送给的产品负责人。",
  "Open a new support ticket. Add a subject and description.":
    "提交新的支持工单。填写主题和描述。",
  "Brief subject of your issue": "简要描述您的问题主题",
  "Describe the issue or request in detail...": "详细描述问题或需求...",
  "Send to (product owner)": "发送给（产品负责人）",
  "Select product owner": "选择产品负责人",
  "Select product owner (optional)": "选择产品负责人（选填）",
  "Related product": "关联产品",
  "Select a product owner first": "请先选择产品负责人",
  "— None —": "— 无 —",
  "1 product": "1 个产品",
  "{count} products": "{count} 个产品",
  "Saving ticket…": "正在保存工单…",
  "Creating ticket…": "正在创建工单…",

  // Support tickets — reply thread
  "Reply to": "回复",
  "Support staff": "支持人员",
  "Messages appear in this thread. {name} will be notified when you send a reply.":
    "消息会显示在此对话串中。您发送回复后，{name} 将收到通知。",
  "No replies yet. Be the first to respond.": "暂无回复，快来抢首评。",
  "Write a reply to {name}…": "回复 {name}…",

  // Support tickets — reassign dialog
  "Reassign ticket": "重新分配工单",
  "selected owner": "所选负责人",
  "no specific owner": "暂无指定负责人",
  "linked product": "关联产品",
  'Reassign "{subject}" to {target}? Related product "{product}{sku}" will be cleared because it is not owned by the new recipient.':
    "将「{subject}」重新分配给 {target}？关联产品「{product}{sku}」将被清除，因为新接收人不拥有该产品。",
  'Reassign "{subject}" to {target}? The previous recipient will no longer be the Send-to owner.':
    "将「{subject}」重新分配给 {target}？原接收人将不再是发送对象。",
  'Choose who receives "{subject}". Confirm before applying.':
    "选择「{subject}」的接收人，确认后再应用。",
  "Continue…": "继续…",
  Continue: "继续",
  "Reassign support ticket?": "重新分配支持工单？",
  Reassign: "重新分配",
  "Reassigning...": "正在重新分配...",

  // Product reviews — section
  "Write review": "写评价",
  "Write a review": "撰写评价",
  "Edit review": "编辑评价",
  "Delete review": "删除评价",
  "Submit review": "提交评价",
  "No reviews yet.": "暂无评价。",
  "Click “Write a review” above.": "点击上方的“撰写评价”。",
  "Pending approval": "待审核",
  'Delete your review of "{product}"{comment}? This cannot be undone.':
    "删除您对「{product}」的评价{comment}？此操作无法撤销。",
  "Are you sure you want to delete this review? This cannot be undone.":
    "确定要删除此评价吗？此操作无法撤销。",
  "Update status, rating, and comment": "更新状态、评分和评价内容",
  "Update your rating and comment": "更新您的评分和评价内容",
  "Share your experience": "分享您的使用体验",
  "Share your experience...": "分享您的使用体验...",
  "{count} stars": "{count} 星",
  "Saving review…": "正在保存评价…",
  "Submitting review…": "正在提交评价…",

  // Business insights — warehouse section
  "Warehouse stock rollup": "仓库库存汇总",
  "Allocated inventory across locations": "各地点的分配库存",
  "Locations with stock": "有库存的仓库",
  "{count} warehouses total": "共 {count} 个仓库",
  "Allocated units": "分配数量",
  "{count} SKU rows": "{count} 条 SKU 记录",
  "Reserved units": "预留数量",
  "Committed on active orders": "已占用在活跃订单上",
  "Inventory value": "库存价值",
  "Top: {name} ({pct}%)": "最多：{name}（{pct}%）",
  "No allocations yet": "暂无分配记录",
  "Quantity by warehouse": "各仓库数量",
  "Stock share by warehouse": "各仓库库存占比",
  "Warehouse Breakdown": "仓库明细",
  SKUs: "SKU 数",
  "Total allocated units at this warehouse": "该仓库的分配总量",
  "Quantity column help": "数量列说明",
  "Units reserved for open orders (amber/rose when elevated)":
    "为未结订单预留的数量（偏高时显示为琥珀色/玫红色）",
  "Reserved column help": "预留列说明",
  "Estimated inventory value from allocated stock":
    "根据分配库存估算的库存价值",
  "Value column help": "价值列说明",
  "No warehouse allocations yet. Allocate stock from a warehouse detail page.":
    "暂无仓库分配记录。请在仓库详情页分配库存。",
};

export default operations;