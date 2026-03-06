import { fetchPrivacyPolicy } from "@/app/lib/api";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "隐私政策 - 行途",
	description:
		"行途（Go Nomads）隐私政策，了解我们如何收集、使用和保护您的个人信息。",
};

/** 强制动态渲染 —— 构建时无 API 可用，避免预渲染为 fallback */
export const dynamic = "force-dynamic";

/* ───── 页面（async Server Component） ───── */
export default async function PrivacyPage() {
	const doc = await fetchPrivacyPolicy();

	// API 获取失败时的降级 UI
	if (!doc) {
		return (
			<div className="min-h-screen bg-base-200">
				<Nav />
				<main className="max-w-3xl mx-auto px-6 py-16 text-center">
					<h1 className="text-4xl font-bold mb-4">隐私政策</h1>
					<p className="text-base-content/60">
						暂时无法加载隐私政策内容，请稍后再试或联系{" "}
						<a href="mailto:hi@gonomads.app" className="link link-primary">
							hi@gonomads.app
						</a>
					</p>
				</main>
			</div>
		);
	}

	// 格式化生效日期
	const effectiveDate = doc.effectiveDate
		? new Date(doc.effectiveDate).toLocaleDateString("zh-CN", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "";

	return (
		<div className="min-h-screen bg-base-200">
			<Nav />

			<main className="max-w-3xl mx-auto px-6 py-16">
				<h1 className="text-4xl font-bold mb-2">
					{doc.title || "隐私政策"}
				</h1>
				{effectiveDate && (
					<p className="text-base-content/60 mb-2">
						生效日期：{effectiveDate}
					</p>
				)}
				<p className="text-base-content/40 text-sm mb-12">
					版本 {doc.version}
				</p>

				{/* ───── 章节内容 ───── */}
				<div className="space-y-12">
					{doc.sections.map((section) => (
						<section key={section.title}>
							<h2 className="text-2xl font-semibold mb-4">
								{section.title}
							</h2>
							<div className="prose prose-sm max-w-none text-base-content/80 whitespace-pre-line leading-relaxed [&>*]:my-0">
								{section.content.split("\n\n").map((para) => (
									<p key={para.slice(0, 40)} className="mb-4">
										{para.split(/\*\*(.*?)\*\*/g).map((seg, si) =>
											si % 2 === 1 ? (
												// biome-ignore lint/suspicious/noArrayIndexKey: bold segments have no stable id
												<strong key={si}>
													{seg}
												</strong>
											) : (
												seg
											),
										)}
									</p>
								))}
							</div>
						</section>
					))}
				</div>

				{/* ───── 第三方 SDK 清单表格 ───── */}
				{doc.sdkList && doc.sdkList.length > 0 && (
					<div className="mt-16">
						<h2 className="text-2xl font-semibold mb-6">
							第三方 SDK 信息清单
						</h2>
						<div className="overflow-x-auto">
							<table className="table table-zebra table-sm w-full">
								<thead>
									<tr>
										<th>SDK 名称</th>
										<th>所属公司</th>
										<th>用途</th>
										<th>收集的数据</th>
										<th>隐私政策</th>
									</tr>
								</thead>
								<tbody>
									{doc.sdkList.map((sdk) => (
										<tr key={sdk.name}>
											<td className="font-medium">{sdk.name}</td>
											<td>{sdk.company}</td>
											<td>{sdk.purpose}</td>
											<td>
												<ul className="list-disc list-inside text-xs">
													{sdk.dataCollected.map((d) => (
														<li key={d}>{d}</li>
													))}
												</ul>
											</td>
											<td>
												<a
													href={sdk.privacyUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="link link-primary text-xs"
												>
													查看
												</a>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

/* ───── 导航栏组件 ───── */
function Nav() {
	return (
		<nav className="navbar sticky top-0 z-50 bg-base-100/80 backdrop-blur-lg border-b border-base-200">
			<div className="navbar-start">
				<Link href="/" className="text-xl font-bold text-primary">
					行途
				</Link>
			</div>
			<div className="navbar-end">
				<Link href="/" className="btn btn-ghost btn-sm">
					返回首页
				</Link>
			</div>
		</nav>
	);
}
