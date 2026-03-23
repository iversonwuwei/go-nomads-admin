import {
    BellIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    ChartBarSquareIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    HandThumbUpIcon,
    HomeModernIcon,
    LightBulbIcon,
    MapIcon,
    MapPinIcon,
    PhotoIcon,
    ShieldCheckIcon,
    SparklesIcon,
    StarIcon,
    UserGroupIcon,
    UsersIcon
} from "@heroicons/react/24/outline";

export type NavItem = {
	title: string;
	subtitle: string;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	group: string;
};

export const navItems: NavItem[] = [
	// ── 概览 ──
	{
		title: "数据中心",
		subtitle: "Dashboard",
		href: "/dashboard",
		icon: ChartBarSquareIcon,
		group: "概览",
	},
	{
		title: "数据分析",
		subtitle: "Analytics",
		href: "/analytics",
		icon: ChartBarIcon,
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
