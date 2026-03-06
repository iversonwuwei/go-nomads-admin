import { resolveApiBase } from "@/app/lib/runtime-api-base";

// ============================================================
// Go Nomads Web — API 工具层
// 通过环境变量 API_BASE 配置后端地址（仅服务端运行时读取）
// 默认：https://api.go-nomads.com/api/v1
// Docker 本地：http://go-nomads-gateway:5000/api/v1
// ============================================================

/** 服务端 API 基地址（Server Components / Route Handlers 使用） */
function getApiBase(): string {
	return resolveApiBase();
}

// ─── 通用响应信封 ────────────────────────────────────
export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data: T | null;
	errors: string[];
}

// ─── 法律文档类型 ────────────────────────────────────
export interface LegalSection {
	title: string;
	content: string;
}

export interface LegalSummary {
	icon: string;
	title: string;
	content: string;
}

export interface LegalSdkInfo {
	name: string;
	company: string;
	purpose: string;
	dataCollected: string[];
	privacyUrl: string;
}

export interface LegalDocument {
	id: string;
	documentType: string;
	version: string;
	language: string;
	title: string;
	effectiveDate: string;
	isCurrent: boolean;
	sections: LegalSection[];
	summary: LegalSummary[];
	sdkList: LegalSdkInfo[];
}

// ─── 获取隐私政策（Server Component 用，带 ISR 缓存） ───
export async function fetchPrivacyPolicy(
	lang = "zh",
): Promise<LegalDocument | null> {
	try {
		const base = getApiBase();
		const res = await fetch(
			`${base}/users/legal/privacy-policy?lang=${lang}`,
			{ cache: "no-store" }, // 页面已 force-dynamic，不缓存
		);

		if (!res.ok) return null;

		const body: ApiResponse<LegalDocument> = await res.json();
		return body.success ? body.data : null;
	} catch (e) {
		console.error("❌ 获取隐私政策失败:", e);
		return null;
	}
}

// ─── 获取隐私政策（客户端组件用，走 Route Handler 代理） ──
export async function fetchPrivacyPolicyClient(
	lang = "zh",
): Promise<LegalDocument | null> {
	try {
		// 客户端使用相对路径调用 Next.js Route Handler 代理
		// 避免 NEXT_PUBLIC_* 构建时内联限制
		const res = await fetch(
			`/api/legal/privacy-policy?lang=${lang}`,
		);

		if (!res.ok) return null;

		const body: ApiResponse<LegalDocument> = await res.json();
		return body.success ? body.data : null;
	} catch (e) {
		console.error("❌ 获取隐私政策失败:", e);
		return null;
	}
}
