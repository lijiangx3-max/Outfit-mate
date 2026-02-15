export async function POST(req) {
    try {
        const { image, customRules } = await req.json();
        const apiKey = process.env.VOLC_API_KEY;
        const endpointId = process.env.VOLC_ENDPOINT_ID;

        if (!apiKey || !endpointId) {
            return new Response(JSON.stringify({
                error: "请在 .env.local 中配置 VOLC_API_KEY 和 VOLC_ENDPOINT_ID",
                category: "配置缺失",
                description: "AI 管家需要火山引擎的凭证才能工作。"
            }), { status: 500 });
        }

        const systemPrompt = `你是一位高效的衣橱数字化助手。
请客观、简洁地识别照片中的单品，直接返回核心事实，不要任何修饰词或时尚评论。
JSON 格式：
{
  "category": "单品核心名称 (如：黑色连帽卫衣、直筒牛仔裤)",
  "description": "极简客观描述。限100字内，仅包含：1.款式类型；2.核心颜色；3.材质/纹理；4.关键特征点。",
  "tags": ["款式词", "材质", "颜色"],
  "suggestion": "一句话极简搭配方案",
  "season": "春/夏/秋/冬"
}
要求：极致简练，杜绝华丽词藻。
用户规则：${customRules || "极简客观描述"}
`;

        const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: endpointId,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: systemPrompt },
                            {
                                type: "image_url",
                                image_url: { url: image }
                            }
                        ]
                    }
                ],
                // 强制要求模型按 JSON 格式输出
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`火山引擎 API 响应错误: ${errorText}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;

        // 尝试解析并返回内容
        const data = JSON.parse(content);

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("豆包分析过程出错:", error);
        return new Response(JSON.stringify({
            error: error.message,
            category: "分析异常",
            description: "豆包管家在识图时由于连接问题暂时掉线，请检查 API 配置或网络。"
        }), { status: 500 });
    }
}
