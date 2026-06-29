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
