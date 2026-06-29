# GlassMartin Quote PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first offline PWA that generates accurate GlassMartin quotation Excel and PDF files from user-entered customer, equipment, fragrance oil, and spray schedule data.

**Architecture:** Keep quotation math in a pure TypeScript domain module with no UI or export dependencies. The React UI collects and validates form state, then passes a calculated `QuoteResult` to separate Excel and PDF exporters so both outputs always use the same totals. PWA assets, manifest, and a small service worker make the built app installable and usable offline.

**Tech Stack:** Vite, React, TypeScript, Vitest, `xlsx` for Excel generation, `jspdf` plus `html2canvas` for Chinese-safe PDF generation, `pinyin-pro` for quotation number initials.

---

## File Structure

- Create `package.json`: project scripts and dependencies.
- Create `index.html`: Vite entry.
- Create `tsconfig.json`: TypeScript settings.
- Create `vite.config.ts`: Vite and Vitest configuration.
- Create `public/manifest.webmanifest`: installable PWA metadata.
- Create `public/sw.js`: offline cache service worker.
- Create `public/icon.svg`: simple GlassMartin app icon.
- Create `src/main.tsx`: React entry and service worker registration.
- Create `src/App.tsx`: app shell, form state, validation messages, preview, export buttons.
- Create `src/styles.css`: mobile-first visual design.
- Create `src/domain/quote.ts`: pure quote types, defaults, validation, calculation.
- Create `src/domain/quote.test.ts`: calculation and validation tests.
- Create `src/domain/quoteNumber.ts`: quotation number generation.
- Create `src/domain/quoteNumber.test.ts`: quotation number tests.
- Create `src/export/excel.ts`: Excel workbook generation.
- Create `src/export/pdf.ts`: PDF document generation.
- Create `src/export/exportContract.test.ts`: verifies exporters receive the same calculated result.
- Create `src/utils/download.ts`: browser download helper.

## Task 1: Scaffold The Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create the project metadata**

Create `package.json`:

```json
{
  "name": "glassmartin-quote-pwa",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^latest",
    "vite": "^latest",
    "typescript": "^latest",
    "react": "^latest",
    "react-dom": "^latest",
    "xlsx": "^latest",
    "jspdf": "^latest",
    "html2canvas": "^latest",
    "pinyin-pro": "^latest"
  },
  "devDependencies": {
    "vitest": "^latest",
    "@types/react": "^latest",
    "@types/react-dom": "^latest",
    "jsdom": "^latest"
  }
}
```

- [ ] **Step 2: Create the Vite entry files**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111827" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>GlassMartin 报价生成器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true
  }
});
```

- [ ] **Step 3: Create a minimal React shell**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app">
      <section className="header">
        <p className="eyebrow">GlassMartin 香薰工厂</p>
        <h1>报价生成器</h1>
        <p>填写客户、设备和喷香参数，自动生成 Excel 与 PDF 报价单。</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #111827;
  background: #f6f7f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

.app {
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 20px 16px 48px;
}

.header {
  padding: 20px 0 16px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #516070;
  font-size: 13px;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

p {
  line-height: 1.6;
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 6: Commit if the folder is a git repository**

Run:

```bash
git status --short
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold quote pwa"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 2: Implement Quote Calculation With TDD

**Files:**
- Create: `src/domain/quote.ts`
- Create: `src/domain/quote.test.ts`

- [ ] **Step 1: Write the failing single-site calculation test**

Create `src/domain/quote.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateQuote } from "./quote";

describe("calculateQuote", () => {
  it("calculates a single-site quotation from user-entered prices", () => {
    const result = calculateQuote({
      customerName: "邯郸上谷菲尔酒店",
      quoteNumber: "GM-HDSGFEJD-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "插电款",
      deviceUnitPrice: 196,
      oilName: "至尊白茶",
      oilDescription: "50%含量，日本出光Isododecane挥发溶剂载体",
      oilUnitPrice: 123.3,
      followUpDiscountPercent: 90,
      sites: [
        {
          id: "site-1",
          name: "邯郸上谷菲尔酒店",
          deviceQuantity: 20,
          dailyHours: 16,
          spraySeconds: 10,
          pauseSeconds: 10,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: "7:00-23:00"
        }
      ]
    });

    expect(result.totalDeviceQuantity).toBe(20);
    expect(result.sites[0].effectiveSprayRatio).toBe(0.5);
    expect(result.sites[0].theoreticalOilLiters).toBe(24);
    expect(result.totalTheoreticalOilLiters).toBe(24);
    expect(result.recommendedOilLiters).toBe(24);
    expect(result.deviceAmount).toBe(3920);
    expect(result.firstMonthOilAmount).toBe(2959.2);
    expect(result.firstPurchaseTotal).toBe(6879.2);
    expect(result.followUpMonthlyOilFee).toBe(2663.28);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/domain/quote.test.ts
```

Expected: FAIL because `src/domain/quote.ts` does not exist.

- [ ] **Step 3: Implement the minimal quote calculation**

Create `src/domain/quote.ts`:

```ts
export type QuoteSiteInput = {
  id: string;
  name: string;
  deviceQuantity: number;
  dailyHours: number;
  spraySeconds: number;
  pauseSeconds: number;
  oilMlPerHourPerDevice: number;
  monthlyDays: number;
  remark: string;
};

export type QuoteInput = {
  customerName: string;
  quoteNumber: string;
  quoteDate: string;
  validity: string;
  quoteCompany: string;
  deviceModel: string;
  deviceRemark: string;
  deviceUnitPrice: number;
  oilName: string;
  oilDescription: string;
  oilUnitPrice: number;
  followUpDiscountPercent: number;
  sites: QuoteSiteInput[];
};

export type QuoteSiteResult = QuoteSiteInput & {
  effectiveSprayRatio: number;
  effectiveDailyHours: number;
  theoreticalOilLiters: number;
  deviceAmount: number;
};

export type QuoteResult = QuoteInput & {
  sites: QuoteSiteResult[];
  totalDeviceQuantity: number;
  totalTheoreticalOilLiters: number;
  recommendedOilLiters: number;
  deviceAmount: number;
  firstMonthOilAmount: number;
  firstPurchaseTotal: number;
  followUpMonthlyOilFee: number;
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundLiters = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

export function calculateQuote(input: QuoteInput): QuoteResult {
  const sites = input.sites.map((site) => {
    const effectiveSprayRatio = site.spraySeconds / (site.spraySeconds + site.pauseSeconds);
    const effectiveDailyHours = site.dailyHours * effectiveSprayRatio;
    const theoreticalOilLiters = roundLiters(
      (site.deviceQuantity *
        site.dailyHours *
        effectiveSprayRatio *
        site.oilMlPerHourPerDevice *
        site.monthlyDays) /
        1000
    );

    return {
      ...site,
      effectiveSprayRatio,
      effectiveDailyHours,
      theoreticalOilLiters,
      deviceAmount: roundCurrency(site.deviceQuantity * input.deviceUnitPrice)
    };
  });

  const totalDeviceQuantity = sites.reduce((sum, site) => sum + site.deviceQuantity, 0);
  const totalTheoreticalOilLiters = roundLiters(
    sites.reduce((sum, site) => sum + site.theoreticalOilLiters, 0)
  );
  const recommendedOilLiters = Math.ceil(totalTheoreticalOilLiters);
  const deviceAmount = roundCurrency(totalDeviceQuantity * input.deviceUnitPrice);
  const firstMonthOilAmount = roundCurrency(recommendedOilLiters * input.oilUnitPrice);
  const firstPurchaseTotal = roundCurrency(deviceAmount + firstMonthOilAmount);
  const followUpMonthlyOilFee = roundCurrency(
    firstMonthOilAmount * (input.followUpDiscountPercent / 100)
  );

  return {
    ...input,
    sites,
    totalDeviceQuantity,
    totalTheoreticalOilLiters,
    recommendedOilLiters,
    deviceAmount,
    firstMonthOilAmount,
    firstPurchaseTotal,
    followUpMonthlyOilFee
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/domain/quote.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add failing multi-site and rounding tests**

Append to `src/domain/quote.test.ts` inside the `describe` block:

```ts
  it("sums multiple sites before rounding recommended oil liters up", () => {
    const result = calculateQuote({
      customerName: "联合客户",
      quoteNumber: "GM-LHKH-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "黑/白",
      deviceUnitPrice: 200,
      oilName: "白茶",
      oilDescription: "",
      oilUnitPrice: 100,
      followUpDiscountPercent: 85,
      sites: [
        {
          id: "site-1",
          name: "场地A",
          deviceQuantity: 7,
          dailyHours: 16,
          spraySeconds: 10,
          pauseSeconds: 10,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        },
        {
          id: "site-2",
          name: "场地B",
          deviceQuantity: 13,
          dailyHours: 16,
          spraySeconds: 10,
          pauseSeconds: 10,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(result.sites[0].theoreticalOilLiters).toBe(8.4);
    expect(result.sites[1].theoreticalOilLiters).toBe(15.6);
    expect(result.totalTheoreticalOilLiters).toBe(24);
    expect(result.recommendedOilLiters).toBe(24);
    expect(result.deviceAmount).toBe(4000);
    expect(result.firstMonthOilAmount).toBe(2400);
    expect(result.firstPurchaseTotal).toBe(6400);
    expect(result.followUpMonthlyOilFee).toBe(2040);
  });

  it("rounds recommended oil liters up from decimals", () => {
    const result = calculateQuote({
      customerName: "测试客户",
      quoteNumber: "GM-CSKH-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "",
      deviceUnitPrice: 100,
      oilName: "测试精油",
      oilDescription: "",
      oilUnitPrice: 80,
      followUpDiscountPercent: 100,
      sites: [
        {
          id: "site-1",
          name: "场地",
          deviceQuantity: 1,
          dailyHours: 1,
          spraySeconds: 1,
          pauseSeconds: 1,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(result.totalTheoreticalOilLiters).toBe(0.075);
    expect(result.recommendedOilLiters).toBe(1);
    expect(result.firstMonthOilAmount).toBe(80);
  });
```

- [ ] **Step 6: Run the tests to verify they pass**

Run:

```bash
npm test -- src/domain/quote.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit if git is available**

Run:

```bash
git status --short
git add src/domain/quote.ts src/domain/quote.test.ts
git commit -m "feat: add quote calculations"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 3: Implement Validation And Defaults With TDD

**Files:**
- Modify: `src/domain/quote.ts`
- Modify: `src/domain/quote.test.ts`
- Create: `src/domain/quoteNumber.ts`
- Create: `src/domain/quoteNumber.test.ts`

- [ ] **Step 1: Add failing validation tests**

Append to `src/domain/quote.test.ts` after the calculation tests:

```ts
import { validateQuoteInput } from "./quote";

describe("validateQuoteInput", () => {
  it("reports required fields and invalid spray settings", () => {
    const errors = validateQuoteInput({
      customerName: "",
      quoteNumber: "",
      quoteDate: "",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "",
      deviceRemark: "",
      deviceUnitPrice: -1,
      oilName: "",
      oilDescription: "",
      oilUnitPrice: -2,
      followUpDiscountPercent: 101,
      sites: [
        {
          id: "site-1",
          name: "",
          deviceQuantity: 0,
          dailyHours: 25,
          spraySeconds: 0,
          pauseSeconds: 0,
          oilMlPerHourPerDevice: -5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(errors).toContain("客户名称必填");
    expect(errors).toContain("机器型号必填");
    expect(errors).toContain("设备单价不能小于 0");
    expect(errors).toContain("精油名称必填");
    expect(errors).toContain("精油单价不能小于 0");
    expect(errors).toContain("后续月度折扣必须在 0 到 100 之间");
    expect(errors).toContain("每日运行小时数不能超过 24");
    expect(errors).toContain("喷香时间和停机时间不能同时为 0");
    expect(errors).toContain("持续喷香耗油量不能小于 0");
    expect(errors).toContain("总设备台数必须大于 0");
  });
});
```

- [ ] **Step 2: Run validation test to verify it fails**

Run:

```bash
npm test -- src/domain/quote.test.ts
```

Expected: FAIL because `validateQuoteInput` is not exported.

- [ ] **Step 3: Implement validation**

Append to `src/domain/quote.ts`:

```ts
export function validateQuoteInput(input: QuoteInput): string[] {
  const errors: string[] = [];

  if (!input.customerName.trim()) errors.push("客户名称必填");
  if (!input.deviceModel.trim()) errors.push("机器型号必填");
  if (!input.oilName.trim()) errors.push("精油名称必填");

  if (input.deviceUnitPrice < 0) errors.push("设备单价不能小于 0");
  if (input.oilUnitPrice < 0) errors.push("精油单价不能小于 0");
  if (input.followUpDiscountPercent < 0 || input.followUpDiscountPercent > 100) {
    errors.push("后续月度折扣必须在 0 到 100 之间");
  }

  if (input.sites.length === 0) errors.push("至少需要一个场地");

  for (const site of input.sites) {
    if (site.deviceQuantity < 0) errors.push("设备台数不能小于 0");
    if (site.dailyHours < 0) errors.push("每日运行小时数不能小于 0");
    if (site.dailyHours > 24) errors.push("每日运行小时数不能超过 24");
    if (site.spraySeconds < 0) errors.push("喷香时间不能小于 0");
    if (site.pauseSeconds < 0) errors.push("停机时间不能小于 0");
    if (site.spraySeconds === 0 && site.pauseSeconds === 0) {
      errors.push("喷香时间和停机时间不能同时为 0");
    }
    if (site.oilMlPerHourPerDevice < 0) errors.push("持续喷香耗油量不能小于 0");
    if (site.monthlyDays < 0) errors.push("每月运行天数不能小于 0");
  }

  const totalDeviceQuantity = input.sites.reduce((sum, site) => sum + site.deviceQuantity, 0);
  if (totalDeviceQuantity <= 0) errors.push("总设备台数必须大于 0");

  return Array.from(new Set(errors));
}
```

- [ ] **Step 4: Run validation tests**

Run:

```bash
npm test -- src/domain/quote.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing quotation number tests**

Create `src/domain/quoteNumber.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateQuoteNumber } from "./quoteNumber";

describe("generateQuoteNumber", () => {
  it("uses customer pinyin initials and date", () => {
    expect(generateQuoteNumber("邯郸上谷菲尔酒店", "2026-06-29")).toBe(
      "GM-HDSGFEJD-20260629"
    );
  });

  it("keeps latin initials for latin customer names", () => {
    expect(generateQuoteNumber("ABC Hotel", "2026-06-29")).toBe("GM-ABCH-20260629");
  });
});
```

- [ ] **Step 6: Run quotation number tests to verify they fail**

Run:

```bash
npm test -- src/domain/quoteNumber.test.ts
```

Expected: FAIL because `src/domain/quoteNumber.ts` does not exist.

- [ ] **Step 7: Implement quotation number generation**

Create `src/domain/quoteNumber.ts`:

```ts
import { pinyin } from "pinyin-pro";

export function compactDate(date: string): string {
  return date.replaceAll("-", "");
}

export function customerInitials(customerName: string): string {
  const cleaned = customerName.trim();
  if (!cleaned) return "KH";

  return cleaned
    .split(/\s+/)
    .map((part) => {
      if (/^[A-Za-z0-9]+$/.test(part)) {
        return part.slice(0, 4).toUpperCase();
      }

      return pinyin(part, {
        pattern: "first",
        toneType: "none",
        nonZh: "removed"
      }).toUpperCase();
    })
    .join("")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "KH";
}

export function generateQuoteNumber(customerName: string, date: string): string {
  return `GM-${customerInitials(customerName)}-${compactDate(date)}`;
}
```

- [ ] **Step 8: Run quotation number tests**

Run:

```bash
npm test -- src/domain/quoteNumber.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit if git is available**

Run:

```bash
git status --short
git add src/domain/quote.ts src/domain/quote.test.ts src/domain/quoteNumber.ts src/domain/quoteNumber.test.ts
git commit -m "feat: add quote validation and numbering"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 4: Build Excel And PDF Exporters

**Files:**
- Create: `src/export/excel.ts`
- Create: `src/export/pdf.ts`
- Create: `src/export/exportContract.test.ts`

- [ ] **Step 1: Write failing export contract tests**

Create `src/export/exportContract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateQuote } from "../domain/quote";
import { buildExcelRows } from "./excel";
import { buildPdfModel } from "./pdf";

const result = calculateQuote({
  customerName: "邯郸上谷菲尔酒店",
  quoteNumber: "GM-HDSGFEJD-20260629",
  quoteDate: "2026-06-29",
  validity: "15日内-因原料价格波动",
  quoteCompany: "GlassMartin 香薰工厂",
  deviceModel: "GAS-501F",
  deviceRemark: "插电款",
  deviceUnitPrice: 196,
  oilName: "至尊白茶",
  oilDescription: "50%含量，日本出光Isododecane挥发溶剂载体",
  oilUnitPrice: 123.3,
  followUpDiscountPercent: 90,
  sites: [
    {
      id: "site-1",
      name: "邯郸上谷菲尔酒店",
      deviceQuantity: 20,
      dailyHours: 16,
      spraySeconds: 10,
      pauseSeconds: 10,
      oilMlPerHourPerDevice: 5,
      monthlyDays: 30,
      remark: ""
    }
  ]
});

describe("export contract", () => {
  it("uses the same calculated totals in Excel and PDF models", () => {
    const excelRows = buildExcelRows(result);
    const pdfModel = buildPdfModel(result);

    expect(excelRows.summary.firstPurchaseTotal).toBe(result.firstPurchaseTotal);
    expect(excelRows.summary.followUpMonthlyOilFee).toBe(result.followUpMonthlyOilFee);
    expect(pdfModel.summary.firstPurchaseTotal).toBe(result.firstPurchaseTotal);
    expect(pdfModel.summary.followUpMonthlyOilFee).toBe(result.followUpMonthlyOilFee);
  });
});
```

- [ ] **Step 2: Run export contract tests to verify they fail**

Run:

```bash
npm test -- src/export/exportContract.test.ts
```

Expected: FAIL because export modules do not exist.

- [ ] **Step 3: Implement Excel row model and workbook export**

Create `src/export/excel.ts`:

```ts
import * as XLSX from "xlsx";
import type { QuoteResult } from "../domain/quote";

export function buildExcelRows(result: QuoteResult) {
  return {
    meta: [
      ["报价对象", result.customerName, "需求概况", `${result.deviceModel} 共${result.totalDeviceQuantity}台 ${result.deviceRemark}`],
      ["报价单位", result.quoteCompany, "香型", `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`],
      ["报价编号", result.quoteNumber, "月度精油预算", `约${result.recommendedOilLiters}升/月`],
      ["报价日期", result.quoteDate, "报价有效期", result.validity]
    ],
    quoteLines: [
      ["序号", "产品 / 服务", "规格 / 香型", "单位", "数量", "单价（元）", "金额（元）", "说明"],
      [1, "香薰扩香机", `${result.deviceModel}${result.deviceRemark ? `（${result.deviceRemark}）` : ""}`, "台", result.totalDeviceQuantity, result.deviceUnitPrice, result.deviceAmount, "一次性设备采购"],
      [2, "香薰精油", `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`, "升/月", result.recommendedOilLiters, result.oilUnitPrice, result.firstMonthOilAmount, "建议月度采购量"],
      ["", "采购合计", "", "", "", "", result.firstPurchaseTotal, "设备 + 首月建议精油"],
      ["", "后续月度精油费用", "", "", "", "", result.followUpMonthlyOilFee, `按${result.followUpDiscountPercent}%折扣计算`]
    ],
    siteRows: [
      ["场地", "设备数量（台）", "每日运行时长", "喷停设置", "有效喷香比例", "理论月耗油量（L）", "设备金额（元）", "配置说明"],
      ...result.sites.map((site) => [
        site.name,
        site.deviceQuantity,
        `${site.dailyHours}小时`,
        `喷${site.spraySeconds}秒 / 停${site.pauseSeconds}秒`,
        `${Math.round(site.effectiveSprayRatio * 100)}%`,
        site.theoreticalOilLiters,
        site.deviceAmount,
        site.remark
      ]),
      ["合计", result.totalDeviceQuantity, "", "", "", result.totalTheoreticalOilLiters, result.deviceAmount, `建议按约${result.recommendedOilLiters}L/月采购`]
    ],
    businessNotes: [
      ["商务说明"],
      [`1. 精油理论耗量按设备台数、每日运行小时、喷停比例、持续喷香耗油量和每月运行天数测算。`],
      [`2. 月度采购建议按理论耗量向上取整至整数升：${result.totalTheoreticalOilLiters}L -> ${result.recommendedOilLiters}L。`],
      ["3. 报价币种为人民币（CNY）；税费、运输费用、安装费用、付款方式及交货周期请以双方最终确认的销售合同为准。"],
      ["4. GlassMartin 可提供设备参数设置、香氛使用建议及后续补充采购支持。"]
    ],
    summary: {
      firstPurchaseTotal: result.firstPurchaseTotal,
      followUpMonthlyOilFee: result.followUpMonthlyOilFee
    }
  };
}

export function createExcelBlob(result: QuoteResult): Blob {
  const rows = buildExcelRows(result);
  const formalSheetRows = [
    ["GlassMartin 商用香薰系统报价单"],
    ["专业空间香氛解决方案 | 扩香设备 · 香薰精油 · 用量规划"],
    [],
    ...rows.meta,
    [],
    ["一、报价明细"],
    ...rows.quoteLines,
    [],
    ["二、项目配置与用量摘要"],
    ...rows.siteRows,
    [],
    ...rows.businessNotes,
    [],
    ["GlassMartin 香薰工厂", "", "", "", "客户确认：________________"],
    ["专业商用空间香氛解决方案", "", "", "", "日期：____________________"]
  ];

  const workbook = XLSX.utils.book_new();
  const formalSheet = XLSX.utils.aoa_to_sheet(formalSheetRows);
  formalSheet["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 34 }
  ];

  XLSX.utils.book_append_sheet(workbook, formalSheet, "正式报价单");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows.siteRows), "用量测算");

  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
```

- [ ] **Step 4: Implement PDF model and export**

Create `src/export/pdf.ts`:

```ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { QuoteResult } from "../domain/quote";

export function buildPdfModel(result: QuoteResult) {
  return {
    title: "GlassMartin 商用香薰系统报价单",
    customer: result.customerName,
    quoteNumber: result.quoteNumber,
    quoteDate: result.quoteDate,
    validity: result.validity,
    lines: [
      ["香薰扩香机", result.deviceModel, `${result.totalDeviceQuantity} 台`, `${result.deviceUnitPrice.toFixed(2)} 元`, `${result.deviceAmount.toFixed(2)} 元`],
      ["香薰精油", result.oilName, `${result.recommendedOilLiters} 升/月`, `${result.oilUnitPrice.toFixed(2)} 元`, `${result.firstMonthOilAmount.toFixed(2)} 元`]
    ],
    sites: result.sites.map((site) => [
      site.name,
      `${site.deviceQuantity} 台`,
      `${site.dailyHours} 小时`,
      `喷${site.spraySeconds}秒 / 停${site.pauseSeconds}秒`,
      `${Math.round(site.effectiveSprayRatio * 100)}%`,
      `${site.theoreticalOilLiters} L`
    ]),
    summary: {
      firstPurchaseTotal: result.firstPurchaseTotal,
      followUpMonthlyOilFee: result.followUpMonthlyOilFee
    }
  };
}

export function createPdfBlob(result: QuoteResult): Blob {
  const model = buildPdfModel(result);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = buildPdfHtml(model);
  document.body.append(container);

  return html2canvas(container, { scale: 2, backgroundColor: "#ffffff" })
    .then((canvas) => {
      container.remove();
      const imageData = canvas.toDataURL("image/png");
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = imageHeight;
      let position = 0;

      doc.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        position = remainingHeight - imageHeight;
        doc.addPage();
        doc.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      return doc.output("blob");
    })
    .catch((error) => {
      container.remove();
      throw error;
    });
}
```

- [ ] **Step 5: Run export contract tests**

Run:

```bash
npm test -- src/export/exportContract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit if git is available**

Run:

```bash
git status --short
git add src/export/excel.ts src/export/pdf.ts src/export/exportContract.test.ts
git commit -m "feat: add quote exports"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 5: Build The Mobile Form UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/utils/download.ts`

- [ ] **Step 1: Add the download helper**

Create `src/utils/download.ts`:

```ts
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Replace the app shell with the full form**

Replace `src/App.tsx`:

```tsx
import { useMemo, useState } from "react";
import { calculateQuote, type QuoteInput, validateQuoteInput } from "./domain/quote";
import { generateQuoteNumber } from "./domain/quoteNumber";
import { createExcelBlob } from "./export/excel";
import { createPdfBlob } from "./export/pdf";
import { downloadBlob } from "./utils/download";

const today = new Date().toISOString().slice(0, 10);

const initialQuote: QuoteInput = {
  customerName: "",
  quoteNumber: "GM-KH-" + today.replaceAll("-", ""),
  quoteDate: today,
  validity: "15日内-因原料价格波动",
  quoteCompany: "GlassMartin 香薰工厂",
  deviceModel: "GAS-501F",
  deviceRemark: "插电款",
  deviceUnitPrice: 0,
  oilName: "",
  oilDescription: "",
  oilUnitPrice: 0,
  followUpDiscountPercent: 90,
  sites: [
    {
      id: "site-1",
      name: "默认场地",
      deviceQuantity: 1,
      dailyHours: 16,
      spraySeconds: 10,
      pauseSeconds: 10,
      oilMlPerHourPerDevice: 5,
      monthlyDays: 30,
      remark: ""
    }
  ]
};

const numberValue = (value: string) => Number(value || 0);

export default function App() {
  const [quote, setQuote] = useState<QuoteInput>(initialQuote);

  const errors = useMemo(() => validateQuoteInput(quote), [quote]);
  const result = useMemo(() => (errors.length === 0 ? calculateQuote(quote) : null), [errors, quote]);

  const updateQuote = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setQuote((current) => ({ ...current, [key]: value }));
  };

  const updateCustomerName = (customerName: string) => {
    setQuote((current) => ({
      ...current,
      customerName,
      quoteNumber: generateQuoteNumber(customerName, current.quoteDate)
    }));
  };

  const updateSite = (siteId: string, patch: Partial<QuoteInput["sites"][number]>) => {
    setQuote((current) => ({
      ...current,
      sites: current.sites.map((site) => (site.id === siteId ? { ...site, ...patch } : site))
    }));
  };

  const addSite = () => {
    setQuote((current) => ({
      ...current,
      sites: [
        ...current.sites,
        {
          ...current.sites[0],
          id: `site-${Date.now()}`,
          name: `场地${current.sites.length + 1}`,
          deviceQuantity: 1,
          remark: ""
        }
      ]
    }));
  };

  const removeSite = (siteId: string) => {
    setQuote((current) => ({
      ...current,
      sites: current.sites.filter((site) => site.id !== siteId)
    }));
  };

  const filenameBase = `${quote.customerName || "客户"}_${quote.quoteDate}_香薰系统报价单`;

  return (
    <main className="app">
      <section className="header">
        <p className="eyebrow">GlassMartin 香薰工厂</p>
        <h1>报价生成器</h1>
        <p>输入现场参数，自动计算设备、精油、首月合计和后续月度费用。</p>
      </section>

      <section className="panel">
        <h2>基础信息</h2>
        <label>客户名称<input value={quote.customerName} onChange={(event) => updateCustomerName(event.target.value)} /></label>
        <label>报价编号<input value={quote.quoteNumber} onChange={(event) => updateQuote("quoteNumber", event.target.value)} /></label>
        <label>报价日期<input type="date" value={quote.quoteDate} onChange={(event) => updateQuote("quoteDate", event.target.value)} /></label>
        <label>有效期<input value={quote.validity} onChange={(event) => updateQuote("validity", event.target.value)} /></label>
      </section>

      <section className="panel">
        <h2>设备与精油</h2>
        <label>机器型号<input value={quote.deviceModel} onChange={(event) => updateQuote("deviceModel", event.target.value)} /></label>
        <label>机器款式/备注<input value={quote.deviceRemark} onChange={(event) => updateQuote("deviceRemark", event.target.value)} /></label>
        <label>机器单价<input type="number" value={quote.deviceUnitPrice} onChange={(event) => updateQuote("deviceUnitPrice", numberValue(event.target.value))} /></label>
        <label>精油名称<input value={quote.oilName} onChange={(event) => updateQuote("oilName", event.target.value)} /></label>
        <label>精油说明<textarea value={quote.oilDescription} onChange={(event) => updateQuote("oilDescription", event.target.value)} /></label>
        <label>精油单价（元/升）<input type="number" value={quote.oilUnitPrice} onChange={(event) => updateQuote("oilUnitPrice", numberValue(event.target.value))} /></label>
        <label>后续月度折扣（%）<input type="number" value={quote.followUpDiscountPercent} onChange={(event) => updateQuote("followUpDiscountPercent", numberValue(event.target.value))} /></label>
      </section>

      <section className="panel">
        <div className="row-title">
          <h2>场地配置</h2>
          <button type="button" onClick={addSite}>添加场地</button>
        </div>
        {quote.sites.map((site, index) => (
          <div className="site" key={site.id}>
            <div className="row-title">
              <h3>场地 {index + 1}</h3>
              {quote.sites.length > 1 && <button type="button" onClick={() => removeSite(site.id)}>删除</button>}
            </div>
            <label>场地名称<input value={site.name} onChange={(event) => updateSite(site.id, { name: event.target.value })} /></label>
            <label>设备台数<input type="number" value={site.deviceQuantity} onChange={(event) => updateSite(site.id, { deviceQuantity: numberValue(event.target.value) })} /></label>
            <label>每日运行小时<input type="number" value={site.dailyHours} onChange={(event) => updateSite(site.id, { dailyHours: numberValue(event.target.value) })} /></label>
            <label>喷香时间（秒）<input type="number" value={site.spraySeconds} onChange={(event) => updateSite(site.id, { spraySeconds: numberValue(event.target.value) })} /></label>
            <label>停机时间（秒）<input type="number" value={site.pauseSeconds} onChange={(event) => updateSite(site.id, { pauseSeconds: numberValue(event.target.value) })} /></label>
            <label>耗油量（ml/小时/台）<input type="number" value={site.oilMlPerHourPerDevice} onChange={(event) => updateSite(site.id, { oilMlPerHourPerDevice: numberValue(event.target.value) })} /></label>
            <label>每月运行天数<input type="number" value={site.monthlyDays} onChange={(event) => updateSite(site.id, { monthlyDays: numberValue(event.target.value) })} /></label>
            <label>备注<input value={site.remark} onChange={(event) => updateSite(site.id, { remark: event.target.value })} /></label>
          </div>
        ))}
      </section>

      <section className="panel preview">
        <h2>报价预览</h2>
        {errors.length > 0 && <ul className="errors">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        {result && (
          <dl className="summary">
            <div><dt>设备总数</dt><dd>{result.totalDeviceQuantity} 台</dd></div>
            <div><dt>理论月耗油量</dt><dd>{result.totalTheoreticalOilLiters} L</dd></div>
            <div><dt>建议采购量</dt><dd>{result.recommendedOilLiters} L</dd></div>
            <div><dt>设备金额</dt><dd>{result.deviceAmount.toFixed(2)} 元</dd></div>
            <div><dt>首月精油金额</dt><dd>{result.firstMonthOilAmount.toFixed(2)} 元</dd></div>
            <div><dt>首月采购合计</dt><dd>{result.firstPurchaseTotal.toFixed(2)} 元</dd></div>
            <div><dt>后续月度精油费用</dt><dd>{result.followUpMonthlyOilFee.toFixed(2)} 元</dd></div>
          </dl>
        )}
        <div className="actions">
          <button type="button" disabled={!result} onClick={() => result && downloadBlob(createExcelBlob(result), `${filenameBase}.xlsx`)}>导出 Excel</button>
          <button type="button" disabled={!result} onClick={() => result && downloadBlob(createPdfBlob(result), `${filenameBase}.pdf`)}>导出 PDF</button>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Replace the stylesheet with mobile-first layout**

Replace `src/styles.css`:

```css
:root {
  color: #111827;
  background: #f4f6f8;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 12px 14px;
  background: #111827;
  color: white;
  font-weight: 700;
}

button:disabled {
  background: #9ca3af;
}

.app {
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 18px 14px 48px;
}

.header {
  padding: 12px 0 8px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #5b6776;
  font-size: 13px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: 28px;
}

h2 {
  margin-bottom: 14px;
  font-size: 18px;
}

h3 {
  margin-bottom: 0;
  font-size: 16px;
}

p {
  line-height: 1.6;
}

.panel {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

label {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input,
textarea {
  width: 100%;
  min-height: 44px;
  border: 1px solid #cfd5dd;
  border-radius: 8px;
  padding: 10px 11px;
  color: #111827;
  background: #fff;
  font-weight: 500;
}

textarea {
  min-height: 82px;
  resize: vertical;
}

.row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.row-title button {
  padding: 9px 11px;
}

.site {
  padding-top: 14px;
  border-top: 1px solid #edf0f2;
}

.site:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.summary {
  display: grid;
  gap: 10px;
  margin: 0;
}

.summary div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #edf0f2;
}

.summary dt {
  color: #5b6776;
}

.summary dd {
  margin: 0;
  font-weight: 800;
}

.errors {
  margin: 0 0 12px;
  padding-left: 18px;
  color: #b42318;
}

.actions {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 16px -16px -16px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.96);
}

@media (min-width: 760px) {
  .panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }

  .panel h2,
  .panel .row-title,
  .preview,
  .site {
    grid-column: 1 / -1;
  }
}
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the app builds.

- [ ] **Step 5: Commit if git is available**

Run:

```bash
git status --short
git add src/App.tsx src/styles.css src/utils/download.ts
git commit -m "feat: add quote form ui"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 6: Add Offline PWA Support

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/icon.svg`

- [ ] **Step 1: Add the app icon**

Create `public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#111827"/>
  <text x="256" y="286" text-anchor="middle" font-size="148" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">GM</text>
  <path d="M148 340h216" stroke="#9ca3af" stroke-width="18" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Add the manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "GlassMartin 报价生成器",
  "short_name": "GM报价",
  "description": "GlassMartin 香薰系统 Excel 与 PDF 报价生成工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f4f6f8",
  "theme_color": "#111827",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Add the service worker**

Create `public/sw.js`:

```js
const CACHE_NAME = "glassmartin-quote-pwa-v1";
const CORE_ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds and `dist/manifest.webmanifest`, `dist/sw.js`, and `dist/icon.svg` exist.

- [ ] **Step 5: Commit if git is available**

Run:

```bash
git status --short
git add public/manifest.webmanifest public/sw.js public/icon.svg src/main.tsx
git commit -m "feat: add offline pwa support"
```

Expected: commit succeeds if git has been initialized. If this folder is not a git repository, skip the commit and record that commit was skipped.

## Task 7: Final Verification

**Files:**
- Modify only if verification reveals defects.

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and build succeeds.

- [ ] **Step 2: Start the local app**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL such as `http://localhost:5173/`.

- [ ] **Step 3: Manual browser verification**

Open the local URL and verify:

- Form loads on desktop width.
- Form loads on narrow mobile width.
- Default quotation date is current date.
- Customer name updates default quotation number.
- Single-site quote calculates expected totals.
- Adding a second site updates total device quantity and oil usage.
- Export Excel downloads an `.xlsx` file.
- Export PDF downloads a `.pdf` file.
- Export buttons are disabled when required values are missing.

- [ ] **Step 4: Production preview verification**

Run:

```bash
npm run build
npm run preview
```

Expected: preview starts and the app still loads. In browser devtools, service worker registration should appear after loading the production preview.

- [ ] **Step 5: Record git status**

Run:

```bash
git status --short
```

Expected: if git is initialized, only intentional files are changed or committed. If this folder is not a git repository, record that git status is unavailable.
