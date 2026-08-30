import { describe, expect, it } from "vitest";
import { calculateQuote, validateQuoteInput } from "./quote";

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
      quoteType: "standard",
      usageMode: "monthly",
      customOilLiters: 0,
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
    expect(result.monthlyTheoreticalOilLiters).toBe(24);
    expect(result.totalTheoreticalOilLiters).toBe(24);
    expect(result.recommendedOilLiters).toBe(24);
    expect(result.usageUnitLabel).toBe("升/月");
    expect(result.deviceAmount).toBe(3920);
    expect(result.firstMonthOilAmount).toBe(2959.2);
    expect(result.firstPurchaseTotal).toBe(6879.2);
    expect(result.followUpOilUnitPrice).toBe(110.97);
    expect(result.followUpMonthlyOilFee).toBe(2663.28);
  });

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
      quoteType: "standard",
      usageMode: "monthly",
      customOilLiters: 0,
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
      quoteType: "standard",
      usageMode: "monthly",
      customOilLiters: 0,
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
    expect(result.recommendedOilLiters).toBe(0.1);
    expect(result.firstMonthOilAmount).toBe(8);
  });

  it("rounds recommended oil liters up to one decimal place", () => {
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
      quoteType: "standard",
      usageMode: "monthly",
      customOilLiters: 0,
      followUpDiscountPercent: 100,
      sites: [
        {
          id: "site-1",
          name: "场地",
          deviceQuantity: 1,
          dailyHours: 23.41,
          spraySeconds: 1,
          pauseSeconds: 0,
          oilMlPerHourPerDevice: 1000,
          monthlyDays: 1,
          remark: ""
        }
      ]
    });

    expect(result.totalTheoreticalOilLiters).toBe(23.41);
    expect(result.recommendedOilLiters).toBe(23.5);
    expect(result.firstMonthOilAmount).toBe(1880);
  });

  it("calculates a yearly quotation from monthly usage", () => {
    const result = calculateQuote({
      customerName: "年度客户",
      quoteNumber: "GM-NDKH-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "",
      deviceUnitPrice: 100,
      oilName: "测试精油",
      oilDescription: "",
      oilUnitPrice: 80,
      quoteType: "standard",
      usageMode: "yearly",
      customOilLiters: 0,
      followUpDiscountPercent: 90,
      sites: [
        {
          id: "site-1",
          name: "场地",
          deviceQuantity: 2,
          dailyHours: 10,
          spraySeconds: 1,
          pauseSeconds: 1,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(result.monthlyTheoreticalOilLiters).toBe(1.5);
    expect(result.totalTheoreticalOilLiters).toBe(18);
    expect(result.recommendedOilLiters).toBe(18);
    expect(result.firstMonthOilAmount).toBe(1440);
    expect(result.usageUnitLabel).toBe("升/年");
    expect(result.purchaseTotalLabel).toBe("年度采购合计");
  });

  it("uses customer specified oil liters directly", () => {
    const result = calculateQuote({
      customerName: "指定客户",
      quoteNumber: "GM-ZDKH-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "",
      deviceUnitPrice: 100,
      oilName: "测试精油",
      oilDescription: "",
      oilUnitPrice: 80,
      quoteType: "standard",
      usageMode: "custom",
      customOilLiters: 12.34,
      followUpDiscountPercent: 100,
      sites: [
        {
          id: "site-1",
          name: "场地",
          deviceQuantity: 2,
          dailyHours: 10,
          spraySeconds: 1,
          pauseSeconds: 1,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(result.monthlyTheoreticalOilLiters).toBe(1.5);
    expect(result.totalTheoreticalOilLiters).toBe(12.34);
    expect(result.recommendedOilLiters).toBe(12.4);
    expect(result.firstMonthOilAmount).toBe(992);
    expect(result.usageBudgetLabel).toBe("客户指定用量");
    expect(result.usageUnitLabel).toBe("升");
  });

  it("calculates an annual package quote total", () => {
    const result = calculateQuote({
      customerName: "包年客户",
      quoteNumber: "GM-BNKH-20260629",
      quoteDate: "2026-06-29",
      validity: "15日内-因原料价格波动",
      quoteCompany: "GlassMartin 香薰工厂",
      deviceModel: "GAS-501F",
      deviceRemark: "插电款",
      deviceUnitPrice: 196,
      oilName: "测试精油",
      oilDescription: "",
      oilUnitPrice: 100,
      quoteType: "annualPackage",
      usageMode: "monthly",
      customOilLiters: 0,
      followUpDiscountPercent: 90,
      sites: [
        {
          id: "site-1",
          name: "场地",
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

    expect(result.usageMode).toBe("yearly");
    expect(result.quoteTypeLabel).toBe("包年报价");
    expect(result.totalTheoreticalOilLiters).toBe(288);
    expect(result.recommendedOilLiters).toBe(288);
    expect(result.firstMonthOilAmount).toBe(28800);
    expect(result.firstPurchaseTotal).toBe(32720);
    expect(result.purchaseTotalLabel).toBe("包年报价总价");
    expect(result.showFollowUpOilFee).toBe(false);
  });
});

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
      quoteType: "standard",
      usageMode: "monthly",
      customOilLiters: 0,
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

  it("requires positive customer specified oil liters in custom mode", () => {
    const errors = validateQuoteInput({
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
      quoteType: "standard",
      usageMode: "custom",
      customOilLiters: 0,
      followUpDiscountPercent: 100,
      sites: [
        {
          id: "site-1",
          name: "场地",
          deviceQuantity: 1,
          dailyHours: 10,
          spraySeconds: 1,
          pauseSeconds: 1,
          oilMlPerHourPerDevice: 5,
          monthlyDays: 30,
          remark: ""
        }
      ]
    });

    expect(errors).toContain("客户指定用量必须大于 0");
  });
});
