"use client";

import {
    BellIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    HomeIcon,
    ShieldCheckIcon,
    SparklesIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

type Section = "general" | "moderation" | "ai" | "notification" | "maintenance";

export default function SettingsPage() {
	const [section, setSection] = useState<Section>("general");

	const tabs: { key: Section; label: string; icon: React.ReactNode }[] = [
		{ key: "general", label: "基本设置", icon: <Cog6ToothIcon className="h-4 w-4" /> },
		{ key: "moderation", label: "审核设置", icon: <ShieldCheckIcon className="h-4 w-4" /> },
		{ key: "ai", label: "AI 设置", icon: <SparklesIcon className="h-4 w-4" /> },
		{ key: "notification", label: "通知设置", icon: <BellIcon className="h-4 w-4" /> },
		{ key: "maintenance", label: "系统维护", icon: <WrenchScrewdriverIcon className="h-4 w-4" /> },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">系统设置</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<Cog6ToothIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">系统设置</h1>
					<p className="text-xs text-base-content/50">System Settings</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap gap-1 rounded-2xl border border-base-300/60 bg-base-100 p-1.5">
				{tabs.map((t) => (
					<button
						type="button"
						key={t.key}
						className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
							section === t.key ? "bg-primary text-primary-content" : "hover:bg-base-200"
						}`}
						onClick={() => setSection(t.key)}
					>
						{t.icon}
						{t.label}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
				{section === "general" && <GeneralSettings />}
				{section === "moderation" && <ModerationSettings />}
				{section === "ai" && <AiSettings />}
				{section === "notification" && <NotificationSettings />}
				{section === "maintenance" && <MaintenanceSettings />}
			</div>
		</div>
	);
}

function FieldRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 border-b border-base-300/40 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-sm font-medium">{label}</p>
				{desc && <p className="text-xs text-base-content/50">{desc}</p>}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

function GeneralSettings() {
	return (
		<div>
			<h2 className="mb-2 text-base font-semibold">基本设置</h2>
			<FieldRow label="平台名称" desc="显示在前端页面标题处">
				<input className="input input-sm input-bordered w-56" defaultValue="Go Nomads" />
			</FieldRow>
			<FieldRow label="默认语言" desc="新用户注册时的默认语言">
				<select className="select select-sm select-bordered w-40">
					<option>中文</option>
					<option>English</option>
				</select>
			</FieldRow>
			<FieldRow label="每页数据量" desc="列表默认分页大小">
				<input className="input input-sm input-bordered w-24" type="number" defaultValue={20} min={5} max={100} />
			</FieldRow>
			<FieldRow label="维护模式" desc="开启后前端显示维护提示">
				<input type="checkbox" className="toggle toggle-primary" />
			</FieldRow>
			<div className="mt-4 flex justify-end">
				<button type="button" className="btn btn-primary btn-sm">保存设置</button>
			</div>
		</div>
	);
}

function ModerationSettings() {
	return (
		<div>
			<h2 className="mb-2 text-base font-semibold">审核设置</h2>
			<FieldRow label="自动审核" desc="新内容发布后是否自动通过审核">
				<input type="checkbox" className="toggle toggle-primary" />
			</FieldRow>
			<FieldRow label="敏感词过滤" desc="启用敏感词自动过滤">
				<input type="checkbox" className="toggle toggle-primary" defaultChecked />
			</FieldRow>
			<FieldRow label="举报阈值" desc="被举报次数达到后自动隐藏内容">
				<input className="input input-sm input-bordered w-24" type="number" defaultValue={5} min={1} />
			</FieldRow>
			<FieldRow label="图片审核" desc="上传图片是否需要人工审核">
				<input type="checkbox" className="toggle toggle-primary" defaultChecked />
			</FieldRow>
			<div className="mt-4 flex justify-end">
				<button type="button" className="btn btn-primary btn-sm">保存设置</button>
			</div>
		</div>
	);
}

function AiSettings() {
	return (
		<div>
			<h2 className="mb-2 text-base font-semibold">AI 设置</h2>
			<FieldRow label="AI 功能" desc="是否启用平台 AI 对话能力">
				<input type="checkbox" className="toggle toggle-primary" defaultChecked />
			</FieldRow>
			<FieldRow label="默认模型" desc="AI 对话使用的模型">
				<select className="select select-sm select-bordered w-48">
					<option>gpt-4o-mini</option>
					<option>gpt-4o</option>
					<option>deepseek-chat</option>
				</select>
			</FieldRow>
			<FieldRow label="Token 上限" desc="单个用户每日 Token 消耗上限">
				<input className="input input-sm input-bordered w-32" type="number" defaultValue={100000} />
			</FieldRow>
			<FieldRow label="温度参数" desc="AI 生成的随机性 (0~2)">
				<input className="input input-sm input-bordered w-24" type="number" defaultValue={0.7} step={0.1} min={0} max={2} />
			</FieldRow>
			<div className="mt-4 flex justify-end">
				<button type="button" className="btn btn-primary btn-sm">保存设置</button>
			</div>
		</div>
	);
}

function NotificationSettings() {
	return (
		<div>
			<h2 className="mb-2 text-base font-semibold">通知设置</h2>
			<FieldRow label="推送通知" desc="是否开启 App 推送通知">
				<input type="checkbox" className="toggle toggle-primary" defaultChecked />
			</FieldRow>
			<FieldRow label="邮件通知" desc="是否向用户发送邮件通知">
				<input type="checkbox" className="toggle toggle-primary" />
			</FieldRow>
			<FieldRow label="通知保留天数" desc="历史通知自动清理天数">
				<input className="input input-sm input-bordered w-24" type="number" defaultValue={90} min={7} />
			</FieldRow>
			<div className="mt-4 flex justify-end">
				<button type="button" className="btn btn-primary btn-sm">保存设置</button>
			</div>
		</div>
	);
}

function MaintenanceSettings() {
	return (
		<div>
			<h2 className="mb-2 text-base font-semibold">系统维护</h2>
			<FieldRow label="缓存清理" desc="清除 Redis 缓存中的过期数据">
				<button type="button" className="btn btn-outline btn-sm">清除缓存</button>
			</FieldRow>
			<FieldRow label="搜索索引重建" desc="重建 Elasticsearch 全文索引">
				<button type="button" className="btn btn-outline btn-sm">重建索引</button>
			</FieldRow>
			<FieldRow label="数据库备份" desc="手动触发 Supabase 数据库备份">
				<button type="button" className="btn btn-outline btn-sm">立即备份</button>
			</FieldRow>
			<FieldRow label="系统日志" desc="查看最近的系统运行日志">
				<button type="button" className="btn btn-outline btn-sm">查看日志</button>
			</FieldRow>
		</div>
	);
}
