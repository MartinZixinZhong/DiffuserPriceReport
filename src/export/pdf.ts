import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { QuoteResult } from "../domain/quote";

export type PdfModel = ReturnType<typeof buildPdfModel>;

export function buildPdfModel(result: QuoteResult) {
  const recommendedOilLiters = result.recommendedOilLiters.toFixed(1);
  const measuredOilLiters = result.totalTheoreticalOilLiters.toFixed(3);
  const monthlyOilLiters = result.monthlyTheoreticalOilLiters.toFixed(3);
  const followUpQuantityLabel =
    result.usageMode === "custom" ? "本次指定采购量" : `本次建议${result.usageLabel}采购量`;
  const usageNote =
    result.usageMode === "yearly"
      ? `年度采购建议按月度理论耗量乘以 12 后向上取整至小数点后一位：${monthlyOilLiters}L/月 × 12 = ${measuredOilLiters}L/年 -> ${recommendedOilLiters}L/年。`
      : result.usageMode === "custom"
        ? `本报价按客户指定用量计算，并向上取整至小数点后一位：${measuredOilLiters}L -> ${recommendedOilLiters}L。`
        : `月度采购建议按理论耗量向上取整至小数点后一位：${measuredOilLiters}L -> ${recommendedOilLiters}L。`;

  return {
    title: "GlassMartin 商用香薰系统报价单",
    subtitle: "专业空间香氛解决方案 | 扩香设备 · 香薰精油 · 用量规划",
    customer: result.customerName,
    quoteNumber: result.quoteNumber,
    quoteDate: result.quoteDate,
    validity: result.validity,
    quoteCompany: result.quoteCompany,
    lines: [
      ...(result.includeDevices
        ? [
            {
              product: "香薰扩香机",
              spec: `${result.deviceModel}${result.deviceRemark ? `（${result.deviceRemark}）` : ""}`,
              quantity: `${result.totalDeviceQuantity} 台`,
              unitPrice: `${result.deviceUnitPrice.toFixed(2)} 元`,
              amount: `${result.deviceAmount.toFixed(2)} 元`
            }
          ]
        : []),
      {
        product: "香薰精油",
        spec: `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`,
        quantity: `${result.oilSaleQuantity.toFixed(1)} ${result.oilSaleUnitLabel}`,
        unitPrice: `${result.oilUnitPrice.toFixed(2)} ${result.oilPriceUnitLabel}`,
        amount: `${result.firstMonthOilAmount.toFixed(2)} 元`
      }
    ],
    sites: result.sites.map((site) => ({
      name: site.name,
      deviceQuantity: `${site.deviceQuantity} 台`,
      dailyHours: `${site.dailyHours} 小时`,
      spraySetting: `喷${site.spraySeconds}秒 / 停${site.pauseSeconds}秒`,
      effectiveRatio: `${Math.round(site.effectiveSprayRatio * 100)}%`,
      oilLiters: `${site.theoreticalOilLiters} L`,
      remark: site.remark
    })),
    summary: {
      totalDeviceQuantity: result.totalDeviceQuantity,
      includeDevices: result.includeDevices,
      showSiteConfig: result.showSiteConfig,
      totalTheoreticalOilLiters: result.totalTheoreticalOilLiters,
      monthlyTheoreticalOilLiters: result.monthlyTheoreticalOilLiters,
      recommendedOilLiters,
      oilSaleQuantity: result.oilSaleQuantity,
      oilSaleUnitLabel: result.oilSaleUnitLabel,
      oilPriceUnitLabel: result.oilPriceUnitLabel,
      firstPurchaseTotal: result.firstPurchaseTotal,
      followUpOilUnitPrice: result.followUpOilUnitPrice,
      followUpOilUnitPricePerLiter: result.followUpOilUnitPricePerLiter,
      followUpMonthlyOilFee: result.followUpMonthlyOilFee,
      followUpDiscountPercent: result.followUpDiscountPercent,
      followUpQuantityLabel,
      quoteTypeLabel: result.quoteTypeLabel,
      usageBudgetLabel: result.usageBudgetLabel,
      usageUnitLabel: result.usageUnitLabel,
      oilAmountLabel: result.oilAmountLabel,
      purchaseTotalLabel: result.purchaseTotalLabel,
      followUpOilFeeLabel: result.followUpOilFeeLabel,
      showFollowUpOilFee: result.showFollowUpOilFee,
      usageNote
    }
  };
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function trimBlankCanvasBottom(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  let lastContentRow = canvas.height - 1;

  for (; lastContentRow >= 0; lastContentRow -= 1) {
    let hasContent = false;
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (lastContentRow * canvas.width + x) * 4;
      const alpha = data[index + 3];
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      if (alpha > 0 && (red < 250 || green < 250 || blue < 250)) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) break;
  }

  const trimPadding = 64;
  const trimmedHeight = Math.min(canvas.height, lastContentRow + 1 + trimPadding);
  if (trimmedHeight >= canvas.height) return canvas;

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = canvas.width;
  trimmedCanvas.height = Math.max(1, trimmedHeight);
  const trimmedContext = trimmedCanvas.getContext("2d");
  if (!trimmedContext) return canvas;

  trimmedContext.fillStyle = "#ffffff";
  trimmedContext.fillRect(0, 0, trimmedCanvas.width, trimmedCanvas.height);
  trimmedContext.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    trimmedCanvas.height,
    0,
    0,
    trimmedCanvas.width,
    trimmedCanvas.height
  );

  return trimmedCanvas;
}

export function buildPdfHtml(model: PdfModel): string {
  const quoteRows = model.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.product)}</td>
          <td>${escapeHtml(line.spec)}</td>
          <td>${escapeHtml(line.quantity)}</td>
          <td>${escapeHtml(line.unitPrice)}</td>
          <td>${escapeHtml(line.amount)}</td>
        </tr>`
    )
    .join("");

  const siteRows = model.sites
    .map(
      (site) => `
        <tr>
          <td>${escapeHtml(site.name)}</td>
          <td>${escapeHtml(site.deviceQuantity)}</td>
          <td>${escapeHtml(site.dailyHours)}</td>
          <td>${escapeHtml(site.spraySetting)}</td>
          <td>${escapeHtml(site.effectiveRatio)}</td>
          <td>${escapeHtml(site.oilLiters)}</td>
        </tr>`
    )
    .join("");
  const followUpSummary = model.summary.showFollowUpOilFee
    ? `<div class="pdf-follow-up-total">
          <span>后续精油采购（${escapeHtml(model.summary.followUpDiscountPercent)}%折扣）</span>
          <strong>${escapeHtml(model.summary.followUpMonthlyOilFee.toFixed(2))} 元</strong>
          <p>折后单价：${escapeHtml(model.summary.followUpOilUnitPrice.toFixed(2))} ${escapeHtml(model.summary.oilPriceUnitLabel)}；${escapeHtml(model.summary.followUpQuantityLabel)} ${escapeHtml(model.summary.oilSaleQuantity.toFixed(1))}${escapeHtml(model.summary.oilSaleUnitLabel)}，后续采购精油总价：${escapeHtml(model.summary.followUpMonthlyOilFee.toFixed(2))} 元。</p>
        </div>`
    : "";
  const siteConfigSection = model.summary.showSiteConfig
    ? `<h2 class="pdf-section-title">二、项目配置与用量摘要</h2>
      <table class="pdf-table">
        <thead>
          <tr><th>场地</th><th>设备数量</th><th>每日运行</th><th>喷停设置</th><th>有效比例</th><th>理论月耗油</th></tr>
        </thead>
        <tbody>${siteRows}</tbody>
      </table>`
    : "";

  return `
    <article class="pdf-page">
      <style>
        .pdf-page {
          width: 794px;
          min-height: 1123px;
          padding: 46px;
          color: #111827;
          background: #ffffff;
          font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
        }
        .pdf-title { margin: 0 0 8px; font-size: 28px; }
        .pdf-subtitle { margin: 0 0 28px; color: #4b5563; font-size: 14px; }
        .pdf-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px 22px;
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          font-size: 13px;
        }
        .pdf-meta strong { color: #374151; }
        .pdf-section-title { margin: 26px 0 10px; font-size: 16px; }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .pdf-table th,
        .pdf-table td {
          padding: 10px 8px;
          border: 1px solid #d1d5db;
          text-align: left;
          vertical-align: top;
        }
        .pdf-table th {
          background: #f3f4f6;
        }
        .pdf-summary {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 12px;
          margin-top: 22px;
        }
        .pdf-total-primary,
        .pdf-follow-up-total {
          padding: 14px;
          border-radius: 8px;
        }
        .pdf-total-primary {
          background: #111827;
          color: #ffffff;
        }
        .pdf-follow-up-total {
          border: 1px solid #e8c779;
          background: #fff8e6;
          color: #5f430f;
        }
        .pdf-summary span {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
        }
        .pdf-total-primary span {
          color: #d1d5db;
        }
        .pdf-follow-up-total span {
          color: #7a5a18;
        }
        .pdf-total-primary strong {
          font-size: 24px;
        }
        .pdf-follow-up-total strong {
          font-size: 17px;
        }
        .pdf-follow-up-total p {
          margin: 8px 0 0;
          font-size: 11px;
          line-height: 1.65;
        }
        .pdf-notes {
          margin: 22px 0 0;
          padding-left: 18px;
          color: #374151;
          font-size: 12px;
          line-height: 1.75;
        }
        .pdf-sign {
          display: flex;
          justify-content: space-between;
          margin-top: 48px;
          font-size: 13px;
        }
      </style>
      <h1 class="pdf-title">${escapeHtml(model.title)}</h1>
      <p class="pdf-subtitle">${escapeHtml(model.subtitle)}</p>
      <section class="pdf-meta">
        <div><strong>报价对象：</strong>${escapeHtml(model.customer)}</div>
        <div><strong>报价编号：</strong>${escapeHtml(model.quoteNumber)}</div>
        <div><strong>报价日期：</strong>${escapeHtml(model.quoteDate)}</div>
        <div><strong>有效期：</strong>${escapeHtml(model.validity)}</div>
        <div><strong>报价单位：</strong>${escapeHtml(model.quoteCompany)}</div>
        <div><strong>报价类型：</strong>${escapeHtml(model.summary.quoteTypeLabel)}</div>
        <div><strong>${escapeHtml(model.summary.usageBudgetLabel)}：</strong>约${escapeHtml(model.summary.recommendedOilLiters)}${escapeHtml(model.summary.usageUnitLabel)}</div>
      </section>
      <h2 class="pdf-section-title">一、报价明细</h2>
      <table class="pdf-table">
        <thead>
          <tr><th>产品 / 服务</th><th>规格 / 香型</th><th>数量</th><th>单价</th><th>金额</th></tr>
        </thead>
        <tbody>${quoteRows}</tbody>
      </table>
      <section class="pdf-summary">
        <div class="pdf-total-primary"><span>${escapeHtml(model.summary.purchaseTotalLabel)}</span><strong>${escapeHtml(model.summary.firstPurchaseTotal.toFixed(2))} 元</strong></div>
        ${followUpSummary}
      </section>
      ${siteConfigSection}
      <ol class="pdf-notes">
        <li>精油理论耗量按设备台数、每日运行小时、喷停比例、持续喷香耗油量和每月运行天数测算。</li>
        <li>${escapeHtml(model.summary.usageNote)}</li>
        <li>报价币种为人民币（CNY）；税费、运输费用、安装费用、付款方式及交货周期请以双方最终确认的销售合同为准。</li>
        <li>GlassMartin 可提供设备参数设置、香氛使用建议及后续补充采购支持。</li>
      </ol>
      <footer class="pdf-sign">
        <div>GlassMartin 香薰工厂<br />专业商用空间香氛解决方案</div>
        <div>客户确认：________________<br /><br />日期：________________</div>
      </footer>
    </article>`;
}

export async function createPdfBlob(result: QuoteResult): Promise<Blob> {
  const model = buildPdfModel(result);
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = buildPdfHtml(model);
  document.body.append(container);

  try {
    const canvas = trimBlankCanvasBottom(
      await html2canvas(container, { backgroundColor: "#ffffff", scale: 2 })
    );
    const imageData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "pt" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageOverflowTolerance = 2;
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    let remainingHeight = imageHeight;
    let position = 0;

    doc.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
    remainingHeight -= pageHeight;

    while (remainingHeight > pageOverflowTolerance) {
      position = remainingHeight - imageHeight;
      doc.addPage();
      doc.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
      remainingHeight -= pageHeight;
    }

    return doc.output("blob");
  } finally {
    container.remove();
  }
}
