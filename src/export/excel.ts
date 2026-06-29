import * as XLSX from "xlsx";
import type { QuoteResult } from "../domain/quote";

export function buildExcelRows(result: QuoteResult) {
  return {
    meta: [
      [
        "报价对象",
        result.customerName,
        "需求概况",
        `${result.deviceModel} 共${result.totalDeviceQuantity}台 ${result.deviceRemark}`.trim()
      ],
      [
        "报价单位",
        result.quoteCompany,
        "香型",
        `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`
      ],
      ["报价编号", result.quoteNumber, "月度精油预算", `约${result.recommendedOilLiters}升/月`],
      ["报价日期", result.quoteDate, "报价有效期", result.validity]
    ],
    quoteLines: [
      ["序号", "产品 / 服务", "规格 / 香型", "单位", "数量", "单价（元）", "金额（元）", "说明"],
      [
        1,
        "香薰扩香机",
        `${result.deviceModel}${result.deviceRemark ? `（${result.deviceRemark}）` : ""}`,
        "台",
        result.totalDeviceQuantity,
        result.deviceUnitPrice,
        result.deviceAmount,
        "一次性设备采购"
      ],
      [
        2,
        "香薰精油",
        `${result.oilName}${result.oilDescription ? `（${result.oilDescription}）` : ""}`,
        "升/月",
        result.recommendedOilLiters,
        result.oilUnitPrice,
        result.firstMonthOilAmount,
        "建议月度采购量"
      ],
      ["", "采购合计", "", "", "", "", result.firstPurchaseTotal, "设备 + 首月建议精油"],
      [
        "",
        "后续月度精油费用",
        "",
        "",
        "",
        "",
        result.followUpMonthlyOilFee,
        `按${result.followUpDiscountPercent}%折扣计算`
      ]
    ],
    siteRows: [
      [
        "场地",
        "设备数量（台）",
        "每日运行时长",
        "喷停设置",
        "有效喷香比例",
        "理论月耗油量（L）",
        "设备金额（元）",
        "配置说明"
      ],
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
      [
        "合计",
        result.totalDeviceQuantity,
        "",
        "",
        "",
        result.totalTheoreticalOilLiters,
        result.deviceAmount,
        `建议按约${result.recommendedOilLiters}L/月采购`
      ]
    ],
    businessNotes: [
      ["商务说明"],
      ["1. 精油理论耗量按设备台数、每日运行小时、喷停比例、持续喷香耗油量和每月运行天数测算。"],
      [
        `2. 月度采购建议按理论耗量向上取整至整数升：${result.totalTheoreticalOilLiters}L -> ${result.recommendedOilLiters}L。`
      ],
      [
        "3. 报价币种为人民币（CNY）；税费、运输费用、安装费用、付款方式及交货周期请以双方最终确认的销售合同为准。"
      ],
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
