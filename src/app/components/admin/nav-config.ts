import {
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarSquareIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon,
    LightBulbIcon,
    MapPinIcon,
    PhotoIcon,
    ShieldCheckIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

export type NavItem = {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export const navItems: NavItem[] = [
  {
    title: "数据中心",
    subtitle: "Dashboard",
    href: "/dashboard",
    icon: ChartBarSquareIcon,
  },
  {
    title: "模块入口",
    subtitle: "Operations",
    href: "/operations",
    icon: FolderOpenIcon,
  },
  {
    title: "举报中心",
    subtitle: "Reports",
    href: "/moderation/reports",
    icon: ExclamationTriangleIcon,
  },
  {
    title: "图片审核",
    subtitle: "City Photos",
    href: "/moderation/city-photos",
    icon: PhotoIcon,
  },
  {
    title: "角色权限",
    subtitle: "IAM Roles",
    href: "/iam/roles",
    icon: ShieldCheckIcon,
  },
  {
    title: "用户中心",
    subtitle: "Users",
    href: "/users",
    icon: UserGroupIcon,
  },
  {
    title: "城市资源",
    subtitle: "Cities",
    href: "/cities",
    icon: MapPinIcon,
  },
  {
    title: "联合办公",
    subtitle: "Coworking",
    href: "/coworking",
    icon: BuildingOffice2Icon,
  },
  {
    title: "创新项目",
    subtitle: "Innovation",
    href: "/innovation",
    icon: LightBulbIcon,
  },
  {
    title: "活动管理",
    subtitle: "Meetups",
    href: "/meetups",
    icon: CalendarDaysIcon,
  },
];
