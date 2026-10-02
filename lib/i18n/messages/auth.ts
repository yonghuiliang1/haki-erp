/**
 * Auth namespace: login, register, session screens.
 */
const auth: Record<string, string> = {
  "Welcome back": "欢迎回来",
  "Sign in to your account": "登录你的账号",
  "Sign in": "登录",
  "Signing in…": "登录中…",
  "Email address": "邮箱地址",
  "Email Address": "邮箱地址",
  Password: "密码",
  "Confirm Password": "确认密码",
  "Forgot password?": "忘记密码？",
  "Remember me": "记住我",
  "Don't have an account?": "还没有账号？",
  "Already have an account?": "已有账号？",
  "Create Account": "创建账号",
  "Create an account": "创建账号",
  "Create your account": "创建你的账号",
  "Sign up": "注册",
  "Signing up…": "注册中…",
  Name: "姓名",
  Username: "用户名",
  "Full Name": "姓名",
  Role: "角色",
  "Select Role": "选择角色",
  "Invalid email or password": "邮箱或密码错误",
  "Invalid email or password.": "邮箱或密码错误。",
  "Email is required": "请输入邮箱",
  "Password is required": "请输入密码",
  "Passwords do not match": "两次输入的密码不一致",
  "Sign out": "退出登录",
  "Demo accounts": "演示账号",
  "Use a demo account": "使用演示账号",

  // Login / register page chrome
  "Welcome Back": "欢迎回来",
  "Sign in to your account to continue": "登录你的账号以继续",
  "Test Accounts To Login With": "可用于登录的测试账号",
  "Enter your password": "请输入密码",
  "Confirm your password": "请再次输入密码",
  "Loading Dashboard…": "正在加载仪表盘…",
  "Signing In…": "登录中…",
  "Or continue with": "或使用以下方式继续",
  "Continue with Google": "使用 Google 继续",
  "Select Role Based Test Account": "选择基于测试账号的角色",
  "Clear Selection": "清除选择",
  "Export Trade Management": "出口贸易管理",
  "HAKI ERP — Export Trade Management": "HAKI ERP — 出口贸易管理",
  "Stock Inventory Illustration": "库存清单插图",
  "Personal Finance Illustration": "个人财务插图",
  "Creating Account...": "正在创建账号…",
  "Sign up to get started with your inventory dashboard":
    "注册以开始使用你的库存仪表盘",

  // Login / register errors + toasts
  "Google Sign-In Failed": "Google 登录失败",
  "OAuth Error": "OAuth 错误",
  "Login Failed": "登录失败",
  "Password Mismatch": "密码不一致",
  "Registration Failed": "注册失败",
  "Account Created Successfully! 🎉": "账号创建成功！🎉",
  "Welcome, {name}! Your account has been created. Redirecting to login page...":
    "欢迎，{name}！你的账号已创建，正在跳转到登录页…",
  "Invalid email or password. Please try again.": "邮箱或密码错误，请重试。",
  "Passwords do not match. Please try again.": "两次输入的密码不一致，请重试。",
  "An unexpected error occurred. Please try again.": "发生意外错误，请重试。",
  "Failed to initiate Google sign-in. Please try again.":
    "无法发起 Google 登录，请重试。",
  "An error occurred during Google sign-in.": "Google 登录时发生错误。",
  "Google OAuth is not configured. Please contact support.":
    "未配置 Google OAuth，请联系支持人员。",
  "Google sign-in was cancelled or failed. Please try again.":
    "Google 登录被取消或失败，请重试。",
  "Invalid OAuth state. Please try again.": "OAuth 状态无效，请重试。",
  "OAuth authorization code missing. Please try again.":
    "缺少 OAuth 授权码，请重试。",
  "Failed to exchange OAuth token. Please try again.":
    "OAuth 令牌交换失败，请重试。",
  "Failed to fetch user information from Google. Please try again.":
    "无法从 Google 获取用户信息，请重试。",
  "Google account email is required. Please try again.":
    "需要 Google 账号邮箱，请重试。",
  "An error occurred during OAuth processing. Please try again.":
    "OAuth 处理过程中发生错误，请重试。",
  "OAuth error: {error}. Please try again.": "OAuth 错误：{error}。请重试。",

  // Auth info panel — login
  "Explore Role-Based Portals": "探索基于角色的门户",
  "Select a role from the sign-in dropdown to open each workspace with a pre-configured demo account. Credentials are applied automatically when you choose a role.":
    "从登录下拉框中选择角色，即可使用预配置的演示账号打开对应工作区。选择角色后凭据会自动填充。",
  Administrator: "管理员",
  "Full platform control across products, orders, invoices, warehouses, and the admin console.":
    "对产品、订单、发票、仓库和管理控制台拥有完整的平台控制权。",
  "Browse catalogs, place orders, track fulfillment, and pay invoices through the client portal.":
    "通过客户门户浏览目录、下单、跟踪履约并支付发票。",
  "Manage your product catalog, fulfill orders, and monitor revenue and low-stock alerts.":
    "管理你的产品目录、完成订单，并监控收入和低库存提醒。",
  "Roles & Access": "角色与权限",
  "Client and supplier roles are assigned by administrators. Use User Management to review or update access.":
    "客户和供应商角色由管理员分配。使用用户管理来查看或更新访问权限。",
  "Orders & Fulfillment": "订单与履约",
  "Track orders end to end with invoices, shipping labels, and status updates across your operation.":
    "通过发票、发货标签和状态更新，端到端跟踪你的订单。",
  "Inventory Intelligence": "库存智能",
  "Monitor warehouses, stock levels, low-stock alerts, and AI-powered insights on the admin dashboard.":
    "在管理仪表盘上监控仓库、库存水平、低库存提醒和 AI 洞察。",

  // Auth info panel — register
  "Built for Modern Warehouse Teams": "为现代仓库团队打造",
  "Create an admin account to start managing products, orders, and inventory from a single dashboard.":
    "创建管理员账号，即可从单一仪表盘开始管理产品、订单和库存。",
  "Real-Time Visibility": "实时可见性",
  "Track stock levels, allocations, and order status as they change across your operation.":
    "实时跟踪库存水平、分配和订单状态的变化。",
  "Actionable Analytics": "可执行的洞察分析",
  "Turn inventory and sales data into insights that support replenishment and planning decisions.":
    "将库存和销售数据转化为支持补货和规划决策的洞察。",
  "Role-Based Access": "基于角色的访问",
  "Separate admin, client, and supplier experiences so each team sees only what they need.":
    "区分管理员、客户和供应商的体验，让每个团队只看到所需内容。",
  "Secure by Design": "安全设计",
  "Session-based authentication and scoped permissions help keep your business data protected.":
    "基于会话的认证和范围权限有助于保护你的业务数据。",
  "Unified Operations": "统一运营",
  "Manage products, categories, suppliers, and warehouses in one connected workspace.":
    "在一个互联的工作区中管理产品、分类、供应商和仓库。",
  "Integrations Ready": "集成就绪",
  "Stripe payments, email notifications, and optional Redis caching for faster list and detail views.":
    "支持 Stripe 支付、邮件通知以及可选的 Redis 缓存，以加快列表和详情页的加载。",
};

export default auth;