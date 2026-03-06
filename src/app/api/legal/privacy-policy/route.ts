import type { ApiResponse, LegalDocument } from "@/app/lib/api";
import { resolveApiBase } from "@/app/lib/runtime-api-base";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Route Handler — 代理隐私政策请求到后端 Gateway
 * 客户端组件通过 /api/legal/privacy-policy?lang=zh 调用此路由，
 * 由 Next.js 服务端读取运行时环境变量 API_BASE 转发请求，
 * 避免 NEXT_PUBLIC_* 构建时内联的限制。
 */
export async function GET(req: NextRequest) {
	const lang = req.nextUrl.searchParams.get("lang") || "zh";
	const apiBase = resolveApiBase();

	try {
		const res = await fetch(
			`${apiBase}/users/legal/privacy-policy?lang=${lang}`,
			{ next: { revalidate: 3600 } },
		);

		if (!res.ok) {
			return NextResponse.json(
				{ success: false, message: "Backend error", data: null, errors: [] },
				{ status: res.status },
			);
		}

		const body: ApiResponse<LegalDocument> = await res.json();
		return NextResponse.json(body);
	} catch (e) {
		console.error("❌ Route Handler 代理隐私政策失败:", e);
		return NextResponse.json(
			{ success: false, message: "Proxy error", data: null, errors: [] },
			{ status: 502 },
		);
	}
}
