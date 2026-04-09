import {
    BellIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon,
    CloudArrowUpIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    HandThumbUpIcon,
    HomeModernIcon,
    LanguageIcon,
    LightBulbIcon,
    ListBulletIcon,
    MapIcon,
    MapPinIcon,
    PhotoIcon,
    ShieldCheckIcon,
    SparklesIcon,
    StarIcon,
    UserGroupIcon,
    UsersIcon
} from "@heroicons/react/24/outline";

export type NavGroupKey = "概览" | "业务管理" | "用户管理" | "内容审核" | "运营" | "系统";

export type NavGroupMeta = {
	title: string;
	subtitle: string;
	description: string;
	focus: string;
};

export type NavItem = {
	title: string;
	subtitle: string;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	group: NavGroupKey;
	badge?: string;
};

export const navGroupOrder: NavGroupKey[] = ["概览", "业务管理", "用户管理", "内容审核", "运营", "系统"];

export const navGroupMeta: Record<NavGroupKey, NavGroupMeta> = {
	概览: {
		title: "总览与指挥",
		subtitle: "Overview",
		description: "适合先判断今天应该从哪个控制面切入。",
		focus: "先判断工作域，再进入执行页面",
	},
	业务管理: {
		title: "内容供给",
		subtitle: "Supply",
		description: "管理进入 App 首页、详情页和发现流的资源供给。",
		focus: "城市、活动、办公、创新、行程",
	},
	用户管理: {
		title: "用户与商业化",
		subtitle: "Users",
		description: "处理用户状态、角色、版主和会员转化配置。",
		focus: "身份、关系、订阅",
	},
	内容审核: {
		title: "治理与审核",
		subtitle: "Moderation",
		description: "聚焦举报、评论、图片和社区风险控制。",
		focus: "风险判断与处置闭环",
	},
	运营: {
		title: "触达与互动",
		subtitle: "Operations",
		description: "处理通知、聊天和 AI 互动等增长相关动作。",
		focus: "召回、对话、活跃",
	},
	系统: {
		title: "策略与治理",
		subtitle: "System",
		description: "系统权限、法律文档和平台级策略配置。",
		focus: "规则、权限、合规",
	},
};

export const navItems: NavItem[] = [
	// ── 概览 ──
	{
		title: "数据中心",
		subtitle: "Dashboard",
		href: "/dashboard",
		icon: ChartBarSquareIcon,
		group: "概览",
		badge: "Core",
	},
	{
		title: "数据分析",
		subtitle: "Analytics",
		href: "/analytics",
		icon: ChartBarIcon,
		group: "概览",
	},
	{
		title: "App 控制台",
		subtitle: "App Control",
		href: "/app-control",
		icon: DevicePhoneMobileIcon,
		group: "概览",
		badge: "Key",
	},
	{
		title: "静态文本",
		subtitle: "Static Texts",
		href: "/app-control/static-texts",
		icon: LanguageIcon,
		group: "概览",
	},
	{
		title: "选项管理",
		subtitle: "Options",
		href: "/app-control/option-groups",
		icon: ListBulletIcon,
		group: "概览",
	},
	{
		title: "配置发布",
		subtitle: "Config Publish",
		href: "/app-control/config-publish",
		icon: CloudArrowUpIcon,
		group: "概览",
	},
	// ── 业务管理 ──
	{
		title: "城市资源",
		subtitle: "Cities",
		href: "/cities",
		icon: MapPinIcon,
		group: "业务管理",
	},
	{
		title: "酒店住宿",
		subtitle: "Hotels",
		href: "/hotels",
		icon: HomeModernIcon,
		group: "业务管理",
	},
	{
		title: "联合办公",
		subtitle: "Coworking",
		href: "/coworking",
		icon: BuildingOffice2Icon,
		group: "业务管理",
	},
	{
		title: "活动管理",
		subtitle: "Meetups",
		href: "/meetups",
		icon: CalendarDaysIcon,
		group: "业务管理",
	},
	{
		title: "活动类型",
		subtitle: "Event Types",
		href: "/event-types",
		icon: ClipboardDocumentListIcon,
		group: "业务管理",
	},
	{
		title: "创新项目",
		subtitle: "Innovation",
		href: "/innovation",
		icon: LightBulbIcon,
		group: "业务管理",
	},
	{
		title: "旅行计划",
		subtitle: "Travel Plans",
		href: "/travel-plans",
		icon: MapIcon,
		group: "业务管理",
	},
	// ── 用户管理 ──
	{
		title: "用户中心",
		subtitle: "Users",
		href: "/users",
		icon: UserGroupIcon,
		group: "用户管理",
	},
	{
		title: "版主管理",
		subtitle: "Moderators",
		href: "/moderators",
		icon: UsersIcon,
		group: "用户管理",
	},
	{
		title: "会员管理",
		subtitle: "Membership",
		href: "/membership",
		icon: CreditCardIcon,
		group: "用户管理",
	},
	// ── 内容审核 ──
	{
		title: "城市评论",
		subtitle: "City Reviews",
		href: "/city-reviews",
		icon: StarIcon,
		group: "内容审核",
	},
	{
		title: "酒店评论",
		subtitle: "Hotel Reviews",
		href: "/hotel-reviews",
		icon: StarIcon,
		group: "内容审核",
	},
	{
		title: "优缺点",
		subtitle: "Pros & Cons",
		href: "/pros-cons",
		icon: HandThumbUpIcon,
		group: "内容审核",
	},
	{
		title: "举报中心",
		subtitle: "Reports",
		href: "/moderation/reports",
		icon: ExclamationTriangleIcon,
		group: "内容审核",
		badge: "Risk",
	},
	{
		title: "图片审核",
		subtitle: "City Photos",
		href: "/moderation/city-photos",
		icon: PhotoIcon,
		group: "内容审核",
	},
	{
		title: "社区内容",
		subtitle: "Community",
		href: "/community",
		icon: GlobeAltIcon,
		group: "内容审核",
	},
	// ── 运营 ──
	{
		title: "通知推送",
		subtitle: "Notifications",
		href: "/notifications",
		icon: BellIcon,
		group: "运营",
		badge: "Reach",
	},
	{
		title: "聊天记录",
		subtitle: "Chat",
		href: "/chat",
		icon: ChatBubbleLeftRightIcon,
		group: "运营",
	},
	{
		title: "AI 对话",
		subtitle: "AI Chat",
		href: "/ai-chat",
		icon: SparklesIcon,
		group: "运营",
		badge: "AI",
	},
	// ── 系统 ──
	{
		title: "角色权限",
		subtitle: "IAM Roles",
		href: "/iam/roles",
		icon: ShieldCheckIcon,
		group: "系统",
	},
	{
		title: "法律文档",
		subtitle: "Legal",
		href: "/legal",
		icon: DocumentTextIcon,
		group: "系统",
	},
	{
		title: "系统设置",
		subtitle: "Settings",
		href: "/settings",
		icon: Cog6ToothIcon,
		group: "系统",
	},
];
