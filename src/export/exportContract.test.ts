import { describe, expect, it } from "vitest";
import { calculateQuote } from "../domain/quote";
import { buildExcelRows } from "./excel";
import { buildPdfHtml, buildPdfModel } from "./pdf";

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
  oilPriceUnit: "liter",
  quoteType: "standard",
  usageMode: "monthly",
  customOilLiters: 0,
  includeDevices: true,
  showSiteConfig: true,
  showFollowUpPurchase: true,
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
    expect(excelRows.summary.followUpOilUnitPrice).toBe(result.followUpOilUnitPrice);
    expect(excelRows.summary.followUpMonthlyOilFee).toBe(result.followUpMonthlyOilFee);
    expect(pdfModel.summary.firstPurchaseTotal).toBe(result.firstPurchaseTotal);
    expect(pdfModel.summary.followUpOilUnitPrice).toBe(result.followUpOilUnitPrice);
    expect(pdfModel.summary.followUpMonthlyOilFee).toBe(result.followUpMonthlyOilFee);
    expect(pdfModel.summary.usageUnitLabel).toBe(result.usageUnitLabel);
  });

  it("explains follow-up oil purchase unit price and total in PDF output", () => {
    const pdfHtml = buildPdfHtml(buildPdfModel(result));

    expect(pdfHtml).toContain("折后单价：110.97 元/L");
    expect(pdfHtml).toContain("后续采购精油总价：2663.28 元");
  });

  it("omits follow-up fee rows for annual package quotes", () => {
    const packageResult = calculateQuote({
      ...result,
      quoteType: "annualPackage",
      usageMode: "yearly",
      customOilLiters: 0,
      sites: result.sites
    });
    const excelRows = buildExcelRows(packageResult);
    const pdfModel = buildPdfModel(packageResult);

    expect(excelRows.quoteLines.flat()).not.toContain("后续年度精油费用");
    expect(excelRows.summary.showFollowUpOilFee).toBe(false);
    expect(pdfModel.summary.showFollowUpOilFee).toBe(false);
    expect(pdfModel.summary.purchaseTotalLabel).toBe("包年报价总价");
    expect(buildPdfHtml(pdfModel)).not.toContain("后续精油采购");
  });

  it("omits device and site sections when display options are disabled", () => {
    const oilOnlyResult = calculateQuote({
      ...result,
      includeDevices: false,
      showSiteConfig: false,
      showFollowUpPurchase: false,
      sites: result.sites
    });
    const excelRows = buildExcelRows(oilOnlyResult);
    const pdfHtml = buildPdfHtml(buildPdfModel(oilOnlyResult));

    expect(oilOnlyResult.deviceAmount).toBe(0);
    expect(excelRows.quoteLines.flat()).not.toContain("香薰扩香机");
    expect(excelRows.summary.showFollowUpOilFee).toBe(false);
    expect(pdfHtml).not.toContain("香薰扩香机");
    expect(pdfHtml).not.toContain("项目配置与用量摘要");
    expect(pdfHtml).not.toContain("后续精油采购");
  });
});
