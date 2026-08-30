import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { QuoteResult } from "../domain/quote";

export type PdfModel = ReturnType<typeof buildPdfModel>;

export function buildPdfModel(result: QuoteResult) {
  const recommendedOilLiters = result.recommendedOilLiters.toFixed(1);
  const measuredOilLiters = result.totalTheoreticalOilLiters.toFixed(3);
  const monthlyOilLiters = result.monthlyTheoreticalOilLiters.toFixed(3);
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
      {
        product: "香薰扩香机",
        spec: `${result.deviceModel}${result.deviceRemark ? `（${result.deviceRemark}）` : ""}`,
        quantity: `${result.totalDeviceQuantity} 台`,
        unitPrice: `${result.deviceUnitPrice.toFixed(2)} 元`,
        amount: `${result.deviceAmount.toFixed(2)} 元`
      },
      {
        product: "香薰精油",
        spec: `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`,
        quantity: `${recommendedOilLiters} ${result.usageUnitLabel}`,
        unitPrice: `${result.oilUnitPrice.toFixed(2)} 元`,
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
      totalTheoreticalOilLiters: result.totalTheoreticalOilLiters,
      monthlyTheoreticalOilLiters: result.monthlyTheoreticalOilLiters,
      recommendedOilLiters,
      firstPurchaseTotal: result.firstPurchaseTotal,
      followUpMonthlyOilFee: result.followUpMonthlyOilFee,
      followUpDiscountPercent: result.followUpDiscountPercent,
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
    ? `<div><span>${escapeHtml(model.summary.followUpOilFeeLabel)}（${escapeHtml(model.summary.followUpDiscountPercent)}%）</span><strong>${escapeHtml(model.summary.followUpMonthlyOilFee.toFixed(2))} 元</strong></div>`
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
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 22px;
        }
        .pdf-summary div {
          padding: 14px;
          border-radius: 8px;
          background: #f3f4f6;
        }
        .pdf-summary span {
          display: block;
          margin-bottom: 6px;
          color: #4b5563;
          font-size: 12px;
        }
        .pdf-summary strong {
          font-size: 18px;
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
        <div><span>${escapeHtml(model.summary.purchaseTotalLabel)}</span><strong>${escapeHtml(model.summary.firstPurchaseTotal.toFixed(2))} 元</strong></div>
        ${followUpSummary}
      </section>
      <h2 class="pdf-section-title">二、项目配置与用量摘要</h2>
      <table class="pdf-table">
        <thead>
          <tr><th>场地</th><th>设备数量</th><th>每日运行</th><th>喷停设置</th><th>有效比例</th><th>理论月耗油</th></tr>
        </thead>
        <tbody>${siteRows}</tbody>
      </table>
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
    const canvas = await html2canvas(container, { backgroundColor: "#ffffff", scale: 2 });
    const imageData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "pt" });
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
  } finally {
    container.remove();
  }
}
