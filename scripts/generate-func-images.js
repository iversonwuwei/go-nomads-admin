/*
 * Generate feature images for the landing page using Tongyi Wanxiang (DashScope).
 * Usage: DASHSCOPE_API_KEY=your_key node scripts/generate-func-images.js
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
const BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const CREATE_ENDPOINT = `${BASE_URL}/services/aigc/text2image/image-synthesis`;
const TASK_ENDPOINT = `${BASE_URL}/tasks`;
const OUTPUT_DIR = path.join(__dirname, "../public/funcs");
const HERO_DIR = path.join(__dirname, "../public/hero");

const features = [
	{
		slug: "discover",
		prompt:
			"Minimalist illustration of a digital nomad exploring global cities, map pins, warm gradient background, modern flat design",
	},
	{
		slug: "cowork",
		prompt:
			"Cozy coworking space with large windows, greenery, laptops, freelancers collaborating, clean and bright style",
	},
	{
		slug: "community",
		prompt:
			"Community event for digital nomads, people networking, casual vibe, speech bubble icons, vibrant but soft colors",
	},
	{
		slug: "planner",
		prompt:
			"AI travel planner dashboard, calendar, route map, checklist, friendly UI, pastel tones",
	},
	{
		slug: "chat",
		prompt:
			"Instant messaging interface on mobile, chat bubbles, helpful assistant, smooth gradients, futuristic yet friendly",
	},
	{
		slug: "mobile",
		prompt:
			"Digital nomad using phone on the go, dual platforms iOS and Android, abstract mobile UI, purple to blue gradient",
	},
];

const negativePrompt =
	"blurry, low quality, distorted, watermark, text, logo, ugly, deformed, dull colors";

// Allowed styles per DashScope doc: <3d cartoon>, <anime>, <oil painting>, <watercolor>,
// <sketch>, <chinese painting>, <flat illustration>, <photography>, <portrait>, <auto>.
const STYLE = "<flat illustration>";

async function ensureOutputDir() {
	await fs.mkdir(OUTPUT_DIR, { recursive: true });
	await fs.mkdir(HERO_DIR, { recursive: true });
}

async function createTask(prompt, size = "1280*720") {
	const body = {
		model: "wanx-v1",
		input: {
			prompt,
			negative_prompt: negativePrompt,
		},
		parameters: {
			style: STYLE,
			size,
			n: 1,
		},
	};

	const response = await fetch(CREATE_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
			"X-DashScope-Async": "enable",
			"User-Agent": "go-nomads-admin/feature-image-generator",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Create task failed: ${response.status} ${text}`);
	}

	const result = await response.json();
	const taskId = result?.output?.task_id;
	if (!taskId)
		throw new Error(`No task id returned: ${JSON.stringify(result)}`);
	return taskId;
}

async function pollTask(taskId) {
	for (let i = 0; i < 60; i++) {
		const res = await fetch(`${TASK_ENDPOINT}/${taskId}`, {
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"User-Agent": "go-nomads-admin/feature-image-generator",
			},
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Poll failed: ${res.status} ${text}`);
		}

		const data = await res.json();
		const status = data?.output?.task_status;
		const images =
			data?.output?.results?.map((r) => r?.url).filter(Boolean) || [];

		if (status === "SUCCEEDED" && images.length) {
			return images[0];
		}

		if (status === "FAILED") {
			throw new Error(`Task failed: ${JSON.stringify(data)}`);
		}

		await new Promise((resolve) => setTimeout(resolve, 2000));
	}

	throw new Error(`Task ${taskId} did not complete in time`);
}

async function downloadImage(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed: ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

async function saveImage(buffer, slug) {
	const filePath = path.join(OUTPUT_DIR, `${slug}.png`);
	await fs.writeFile(filePath, buffer);
	return filePath;
}

async function saveHero(buffer) {
	const filePath = path.join(HERO_DIR, "hero.png");
	await fs.writeFile(filePath, buffer);
	return filePath;
}

async function generateAll() {
	if (!API_KEY) {
		throw new Error("Missing DASHSCOPE_API_KEY env variable.");
	}

	await ensureOutputDir();

	for (const feature of features) {
		console.log(`\n▶ Generating image for ${feature.slug}...`);
		try {
			const taskId = await createTask(feature.prompt);
			console.log(`Task created: ${taskId}`);
			const imageUrl = await pollTask(taskId);
			console.log(`Image ready: ${imageUrl}`);
			const buffer = await downloadImage(imageUrl);
			const savedPath = await saveImage(buffer, feature.slug);
			console.log(`Saved to ${savedPath}`);
		} catch (err) {
			console.error(`Failed for ${feature.slug}:`, err.message);
		}
	}

	// Hero background
	const heroPrompt =
		"Wide hero background for digital nomad app, soft gradients, abstract world map, silhouettes of remote workers with laptops, clean minimal, spacious composition, premium tech aesthetic";

	try {
		console.log("\n▶ Generating hero background...");
		const taskId = await createTask(heroPrompt, "1280*720");
		console.log(`Task created: ${taskId}`);
		const imageUrl = await pollTask(taskId);
		console.log(`Image ready: ${imageUrl}`);
		const buffer = await downloadImage(imageUrl);
		const savedPath = await saveHero(buffer);
		console.log(`Saved to ${savedPath}`);
	} catch (err) {
		console.error("Failed for hero background:", err.message);
	}
}

generateAll().catch((err) => {
	console.error(err);
	process.exit(1);
});
