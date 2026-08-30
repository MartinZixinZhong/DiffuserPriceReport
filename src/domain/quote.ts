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

export type QuoteUsageMode = "monthly" | "yearly" | "custom";
export type QuoteType = "standard" | "annualPackage";

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
  quoteType: QuoteType;
  usageMode: QuoteUsageMode;
  customOilLiters: number;
  followUpDiscountPercent: number;
  sites: QuoteSiteInput[];
};

export type QuoteSiteResult = QuoteSiteInput & {
  effectiveSprayRatio: number;
  effectiveDailyHours: number;
  theoreticalOilLiters: number;
  deviceAmount: number;
};

export type QuoteResult = Omit<QuoteInput, "sites"> & {
  sites: QuoteSiteResult[];
  totalDeviceQuantity: number;
  monthlyTheoreticalOilLiters: number;
  totalTheoreticalOilLiters: number;
  recommendedOilLiters: number;
  deviceAmount: number;
  firstMonthOilAmount: number;
  firstPurchaseTotal: number;
  followUpOilUnitPrice: number;
  followUpMonthlyOilFee: number;
  usageLabel: string;
  usageUnitLabel: string;
  usageBudgetLabel: string;
  quoteTypeLabel: string;
  oilAmountLabel: string;
  purchaseTotalLabel: string;
  followUpOilFeeLabel: string;
  showFollowUpOilFee: boolean;
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundLiters = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;
const ceilLitersToOneDecimal = (value: number) => Math.ceil(value * 10 - Number.EPSILON) / 10;

const usageLabels: Record<
  QuoteUsageMode,
  Pick<
    QuoteResult,
    | "usageLabel"
    | "usageUnitLabel"
    | "usageBudgetLabel"
    | "quoteTypeLabel"
    | "oilAmountLabel"
    | "purchaseTotalLabel"
    | "followUpOilFeeLabel"
    | "showFollowUpOilFee"
  >
> = {
  monthly: {
    usageLabel: "月度",
    usageUnitLabel: "升/月",
    usageBudgetLabel: "月度精油预算",
    quoteTypeLabel: "标准采购报价",
    oilAmountLabel: "首月精油金额",
    purchaseTotalLabel: "首月采购合计",
    followUpOilFeeLabel: "后续月度精油费用",
    showFollowUpOilFee: true
  },
  yearly: {
    usageLabel: "年度",
    usageUnitLabel: "升/年",
    usageBudgetLabel: "年度精油预算",
    quoteTypeLabel: "标准采购报价",
    oilAmountLabel: "年度精油金额",
    purchaseTotalLabel: "年度采购合计",
    followUpOilFeeLabel: "后续年度精油费用",
    showFollowUpOilFee: true
  },
  custom: {
    usageLabel: "指定用量",
    usageUnitLabel: "升",
    usageBudgetLabel: "客户指定用量",
    quoteTypeLabel: "标准采购报价",
    oilAmountLabel: "指定用量精油金额",
    purchaseTotalLabel: "指定用量采购合计",
    followUpOilFeeLabel: "指定用量折后精油费用",
    showFollowUpOilFee: true
  }
};

export function calculateQuote(input: QuoteInput): QuoteResult {
  const usageMode = input.quoteType === "annualPackage" ? "yearly" : input.usageMode;
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
  const monthlyTheoreticalOilLiters = roundLiters(
    sites.reduce((sum, site) => sum + site.theoreticalOilLiters, 0)
  );
  const totalTheoreticalOilLiters =
    usageMode === "yearly"
      ? roundLiters(monthlyTheoreticalOilLiters * 12)
      : usageMode === "custom"
        ? roundLiters(input.customOilLiters)
        : monthlyTheoreticalOilLiters;
  const recommendedOilLiters = ceilLitersToOneDecimal(totalTheoreticalOilLiters);
  const deviceAmount = roundCurrency(totalDeviceQuantity * input.deviceUnitPrice);
  const firstMonthOilAmount = roundCurrency(recommendedOilLiters * input.oilUnitPrice);
  const firstPurchaseTotal = roundCurrency(deviceAmount + firstMonthOilAmount);
  const followUpOilUnitPrice = roundCurrency(
    input.oilUnitPrice * (input.followUpDiscountPercent / 100)
  );
  const followUpMonthlyOilFee = roundCurrency(recommendedOilLiters * followUpOilUnitPrice);

  const labels =
    input.quoteType === "annualPackage"
      ? {
          ...usageLabels.yearly,
          quoteTypeLabel: "包年报价",
          oilAmountLabel: "包年精油金额",
          purchaseTotalLabel: "包年报价总价",
          showFollowUpOilFee: false
        }
      : usageLabels[usageMode];

  return {
    ...input,
    usageMode,
    sites,
    totalDeviceQuantity,
    monthlyTheoreticalOilLiters,
    totalTheoreticalOilLiters,
    recommendedOilLiters,
    deviceAmount,
    firstMonthOilAmount,
    firstPurchaseTotal,
    followUpOilUnitPrice,
    followUpMonthlyOilFee,
    ...labels
  };
}

export function validateQuoteInput(input: QuoteInput): string[] {
  const errors: string[] = [];

  if (!input.customerName.trim()) errors.push("客户名称必填");
  if (!input.deviceModel.trim()) errors.push("机器型号必填");
  if (!input.oilName.trim()) errors.push("精油名称必填");

  if (input.deviceUnitPrice < 0) errors.push("设备单价不能小于 0");
  if (input.oilUnitPrice < 0) errors.push("精油单价不能小于 0");
  if (input.customOilLiters < 0) errors.push("客户指定用量不能小于 0");
  if (input.usageMode === "custom" && input.customOilLiters <= 0) {
    errors.push("客户指定用量必须大于 0");
  }
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
