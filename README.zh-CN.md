# AI 转化率急诊室：PayPal 收款版 MVP

这是一个一天内可部署的 AI 编程变现小工具：用户提交落地页/店铺页信息，通过 PayPal 付款后生成转化率诊断报告。

## 你现在拥有的功能

- 首页表单：收集页面链接、产品、目标客户、当前问题、页面文案、邮箱。
- 两档定价：$9 基础诊断、$29 深度诊断。
- PayPal Payment Link 跳转付款。
- 付款后填写 PayPal 邮箱/交易号。
- 调用 OpenAI Responses API 生成报告。
- 未配置 OpenAI Key 时返回演示报告，方便先部署测试。
- 可选 Webhook：把订单线索同步到 Zapier、Make、飞书、Airtable 等。

## 第一天推荐支付方式

先不要接 PayPal Checkout API，也不要做 webhook 自动验单。

第一天采用：

```text
PayPal Payment Link / PayPal Button → 用户付款 → 输入付款邮箱/交易号 → 生成报告 → 人工抽查付款
```

这样最快上线，目的是验证是否有人愿意付费。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开：

```text
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local`，填写：

```bash
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_PAYPAL_BASIC_LINK=你的 $9 PayPal Payment Link
NEXT_PUBLIC_PAYPAL_PRO_LINK=你的 $29 PayPal Payment Link
NEXT_PUBLIC_SUPPORT_EMAIL=你的客服邮箱
```

如果暂时没有 OpenAI API Key，也能部署测试；系统会返回演示报告。

## 创建 PayPal 付款链接

在 PayPal 后台创建两个商品/服务付款链接：

1. 基础诊断：$9
2. 深度诊断：$29

然后分别填入：

```bash
NEXT_PUBLIC_PAYPAL_BASIC_LINK=
NEXT_PUBLIC_PAYPAL_PRO_LINK=
```

## 部署到 Vercel

1. 把项目推到 GitHub。
2. 登录 Vercel，导入 GitHub 仓库。
3. 在 Vercel Project Settings → Environment Variables 填写上面的环境变量。
4. 点击 Deploy。

## 第一版运营打法

当天发帖标题：

```text
我做了一个 AI 转化率急诊室：3 分钟帮你找出页面为什么没人买
```

发帖正文：

```text
我做了一个小工具：AI 转化率急诊室。

输入你的落地页、Shopify 店铺、SaaS 页面或课程销售页信息，AI 会生成一份转化率诊断报告，包括：
- 页面为什么流失用户
- 首屏标题怎么改
- 卖点怎么重写
- CTA 怎么写
- FAQ 应该补什么
- 未来 7 天怎么优化

今天开放前 10 个测试名额：基础版 $9，深度版 $29。
```

## 第一阶段不要做的事

- 不要做用户登录。
- 不要做会员中心。
- 不要做复杂数据库。
- 不要做 PayPal API 自动验单。
- 不要做网页爬虫。
- 不要做多语言后台。

第一天的目标只有一个：上线并收第一笔钱。

## 第二阶段升级

拿到 3-5 个真实付费用户后，再做：

1. PayPal Checkout API 自动验单。
2. 数据库存储订单和报告。
3. 邮件自动交付。
4. URL 抓取页面内容。
5. 报告 PDF 导出。
6. 中文大陆版：飞书表单 + 微信/支付宝 + 国产模型 API。
