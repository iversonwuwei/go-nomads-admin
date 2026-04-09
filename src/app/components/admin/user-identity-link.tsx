import { getUserDisplayName } from "@/app/lib/user-display";
import Link from "next/link";

type UserIdentityLinkProps = {
  userId?: string | null;
  userName?: string | null;
  fallback?: string;
  className?: string;
  plainClassName?: string;
};

export function UserIdentityLink({
  userId,
  userName,
  fallback = "未命名用户",
  className = "font-medium text-primary hover:underline",
  plainClassName = "font-medium",
}: UserIdentityLinkProps) {
  const safeUserId = userId?.trim();
  const label = getUserDisplayName(userName, safeUserId, fallback);
  const isOrphanReference = label.startsWith("孤儿用户");
  const resolvedClassName = isOrphanReference ? "font-medium text-warning hover:underline" : className;
  const resolvedPlainClassName = isOrphanReference ? "font-medium text-warning" : plainClassName;
  const orphanHint = isOrphanReference ? "UserService 中不存在该用户主档，当前记录仍在引用它" : undefined;

  if (safeUserId) {
    return (
      <Link href={`/users/${safeUserId}`} className={resolvedClassName} title={orphanHint}>
        {label}
      </Link>
    );
  }

  return <span className={resolvedPlainClassName} title={orphanHint}>{label}</span>;
}

type UserIdentityInfoRowProps = {
  label: string;
  userId?: string | null;
  userName?: string | null;
  fallback?: string;
};

export function UserIdentityInfoRow({
  label,
  userId,
  userName,
  fallback,
}: UserIdentityInfoRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <UserIdentityLink userId={userId} userName={userName} fallback={fallback} />
    </div>
  );
}