import { NextRequest } from "next/server";
import type { AuditInput } from "../../../lib/types";
import { buildAuditPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";

function validateInput(input: Partial<AuditInput>) {
  const required: Array<keyof AuditInput> = ["url", "product", "audience", "problem", "email", "tier"];
  for (const key of required) {
    if (!input[key]) return `缺少字段：${key}`;
  }
  if (input.tier !== "basic" && input.tier !== "pro") return "报告版本无效";
  return "";
}

function demoReport(input: AuditInput) {
  return `# AI 转化率诊断报告

## 1. 总评分
当前初步评分：68/100。页面已经有明确产品方向，但用户可能无法在首屏快速理解“为什么现在就应该行动”。由于你尚未配置 OPENAI_API_KEY，这是演示报告；正式版会根据用户提交的页面信息生成完整分析。

## 2. 一句话诊断
最大问题不是流量，而是页面没有把目标客户的痛点、结果和行动理由压缩到首屏 5 秒内讲清楚。

## 3. 最可能导致流失的 5 个问题
1. 问题：标题可能偏功能描述。影响：用户看完不知道自己能得到什么结果。修改建议：把标题改成“帮谁，在多久内，解决什么问题”。
2. 问题：缺少具体使用场景。影响：用户无法把产品和自己的处境对应起来。修改建议：增加 3 个典型场景模块。
3. 问题：CTA 可能太泛。影响：用户不知道点击后会发生什么。修改建议：用“获取我的诊断报告”替代“提交”。
4. 问题：信任状不足。影响：用户担心付款后没有价值。修改建议：展示样例报告截图、交付结构和退款承诺。
5. 问题：异议没有被提前处理。影响：用户带着疑问离开。修改建议：增加 FAQ，解释适合谁、不适合谁、多久交付、报告包含什么。

## 4. 首屏标题重写
1. 你的页面为什么有人看却没人买？3 分钟生成转化率诊断报告。
2. 把你的落地页丢进来，AI 告诉你标题、卖点和 CTA 怎么改。
3. 广告有点击没订单？先查你的页面是不是在流失用户。
4. 给 Shopify、SaaS、课程销售页的一次 AI 转化体检。
5. 不再猜文案怎么改，用一份诊断报告找到最大转化阻碍。

## 5. 核心卖点重写
1. 不只给评分，还给你可以直接替换的标题和按钮文案。
2. 把用户不买的理由提前找出来，并转成 FAQ。
3. 针对你的产品、目标客户和当前问题生成诊断，而不是通用模板。
4. 适合投流前检查页面，避免把预算浪费在低转化页面上。
5. 报告包含 7 天执行清单，方便当天开始修改。

## 6. CTA 按钮文案
1. 生成我的诊断报告 —— 适合首页主按钮。
2. 检查我的页面问题 —— 适合痛点模块。
3. 获取首屏优化建议 —— 适合标题分析模块。
4. 查看页面怎么改 —— 适合案例展示后。
5. 立即做一次转化体检 —— 适合底部 CTA。

## 7. 用户购买前的主要异议
- “AI 会不会太泛？” 页面上要展示报告结构和样例。
- “我的行业适用吗？” 列出适用行业和不适用场景。
- “付款后多久拿到？” 明确 3 分钟自动生成，人工版说明交付时间。
- “报告能不能直接执行？” 展示标题、CTA、FAQ 这些可复制内容。

## 8. FAQ 建议
Q：我需要提供什么？
A：页面链接、产品信息、目标客户和当前问题；如果粘贴页面文案，报告会更准确。

Q：报告会保证提升转化率吗？
A：不会承诺固定提升比例，但会给出具体、可执行的页面优化建议。

Q：适合哪些页面？
A：落地页、Shopify 店铺、SaaS 官网、课程销售页、咨询服务页和社媒主页。

## 9. 广告/社媒钩子
1. 有点击没订单，可能不是广告问题，而是页面没讲清楚。
2. 别急着加预算，先让 AI 检查你的落地页。
3. 你的 CTA 可能正在劝退用户。
4. 3 分钟找出页面最大的转化阻碍。
5. 把“没人买”的页面改成更容易成交的页面。

## 10. 未来 7 天执行清单
Day 1：重写首屏标题和副标题。
Day 2：替换 CTA 文案，并让用户知道点击后会发生什么。
Day 3：增加 3 个具体使用场景。
Day 4：补充 FAQ，处理价格、效果、交付和适用人群异议。
Day 5：增加样例报告或客户案例。
Day 6：测试两个不同标题版本。
Day 7：复盘点击、提交和付款数据，保留表现更好的版本。

客户信息：${input.product} / ${input.url}`;
}

async function sendLeadWebhook(input: AuditInput, report: string) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, report, createdAt: new Date().toISOString() })
    });
  } catch (error) {
    console.error("LEAD_WEBHOOK_ERROR", error);
  }
}

async function generateWithAI(input: AuditInput) {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!deepseekKey && !openaiKey) return { report: demoReport(input), demo: true };

  const prompt = buildAuditPrompt(input);
  const temperature = 0.4;
  const maxTokens = input.tier === "pro" ? 4200 : 2600;

  // 优先使用 DeepSeek，适合中国大陆地区部署和结算。
  if (deepseekKey) {
    const baseUrl = (process.env.LLM_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
    const model = process.env.LLM_MODEL || "deepseek-v4-flash";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是一名高级转化率优化顾问和直销文案专家。请输出中文、具体、可执行的诊断报告。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DeepSeek API 错误：${response.status} ${text}`);
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";
    if (!report) throw new Error("DeepSeek API 没有返回报告内容");
    return { report, demo: false };
  }

  // 保留 OpenAI 作为海外备用。
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      temperature,
      max_output_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API 错误：${response.status} ${text}`);
  }

  const data = await response.json();
  const report = data.output_text || data.output?.flatMap((item: any) => item.content || []).map((content: any) => content.text || "").join("\\n") || "";
  if (!report) throw new Error("OpenAI API 没有返回报告内容");
  return { report, demo: false };
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as AuditInput;
    const error = validateInput(input);
    if (error) return Response.json({ ok: false, error }, { status: 400 });

    console.log("NEW_AUDIT_ORDER", {
      email: input.email,
      paypalEmail: input.paypalEmail,
      paypalTransactionId: input.paypalTransactionId,
      tier: input.tier,
      url: input.url,
      createdAt: new Date().toISOString()
    });

    const { report, demo } = await generateWithAI(input);
    await sendLeadWebhook(input, report);

    return Response.json({ ok: true, report, demo });
  } catch (error) {
    console.error("GENERATE_REPORT_ERROR", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "生成失败" }, { status: 500 });
  }
}
