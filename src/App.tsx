import { useMemo, useState } from "react";
import { calculateQuote, type QuoteInput, validateQuoteInput } from "./domain/quote";
import { generateQuoteNumber } from "./domain/quoteNumber";
import { createExcelBlob } from "./export/excel";
import { createPdfBlob } from "./export/pdf";
import { downloadBlob } from "./utils/download";

const today = new Date().toISOString().slice(0, 10);

const initialQuote: QuoteInput = {
  customerName: "",
  quoteNumber: `GM-KH-${today.replaceAll("-", "")}`,
  quoteDate: today,
  validity: "15日内-因原料价格波动",
  quoteCompany: "GlassMartin 香薰工厂",
  deviceModel: "GAS-501F",
  deviceRemark: "插电款",
  deviceUnitPrice: 0,
  oilName: "",
  oilDescription: "",
  oilUnitPrice: 0,
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
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);

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

  const updateQuoteDate = (quoteDate: string) => {
    setQuote((current) => ({
      ...current,
      quoteDate,
      quoteNumber: generateQuoteNumber(current.customerName, quoteDate)
    }));
  };

  const updateQuoteType = (quoteType: QuoteInput["quoteType"]) => {
    setQuote((current) => ({
      ...current,
      quoteType,
      usageMode: quoteType === "annualPackage" ? "yearly" : current.usageMode
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

  const exportPdf = async () => {
    if (!result || isCreatingPdf) return;
    setIsCreatingPdf(true);

    try {
      const blob = await createPdfBlob(result);
      downloadBlob(blob, `${filenameBase}.pdf`);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  return (
    <main className="app">
      <section className="header">
        <p className="eyebrow">GlassMartin 香薰工厂</p>
        <h1>报价生成器</h1>
        <p>输入客户、设备、精油和用量方式，自动计算金额，并生成 Excel/PDF。</p>
      </section>

      <section className="panel">
        <h2>基础信息</h2>
        <label>
          客户名称
          <input value={quote.customerName} onChange={(event) => updateCustomerName(event.target.value)} />
        </label>
        <label>
          报价编号
          <input value={quote.quoteNumber} onChange={(event) => updateQuote("quoteNumber", event.target.value)} />
        </label>
        <label>
          报价日期
          <input type="date" value={quote.quoteDate} onChange={(event) => updateQuoteDate(event.target.value)} />
        </label>
        <label>
          有效期
          <input value={quote.validity} onChange={(event) => updateQuote("validity", event.target.value)} />
        </label>
        <label>
          报价单位
          <input value={quote.quoteCompany} onChange={(event) => updateQuote("quoteCompany", event.target.value)} />
        </label>
      </section>

      <section className="panel">
        <h2>设备与精油</h2>
        <label>
          机器型号
          <input value={quote.deviceModel} onChange={(event) => updateQuote("deviceModel", event.target.value)} />
        </label>
        <label>
          机器款式/备注
          <input value={quote.deviceRemark} onChange={(event) => updateQuote("deviceRemark", event.target.value)} />
        </label>
        <label>
          机器单价
          <input
            min="0"
            type="number"
            value={quote.deviceUnitPrice}
            onChange={(event) => updateQuote("deviceUnitPrice", numberValue(event.target.value))}
          />
        </label>
        <label>
          精油名称
          <input value={quote.oilName} onChange={(event) => updateQuote("oilName", event.target.value)} />
        </label>
        <label>
          精油说明
          <textarea value={quote.oilDescription} onChange={(event) => updateQuote("oilDescription", event.target.value)} />
        </label>
        <label>
          精油计价单位
          <select
            value={quote.oilPriceUnit}
            onChange={(event) => updateQuote("oilPriceUnit", event.target.value as QuoteInput["oilPriceUnit"])}
          >
            <option value="liter">每 L（升）的单价</option>
            <option value="halfLiter">每 500ml（毫升）的单价</option>
          </select>
        </label>
        <label>
          精油单价（{quote.oilPriceUnit === "halfLiter" ? "元/500ml" : "元/L"}）
          <input
            min="0"
            type="number"
            value={quote.oilUnitPrice}
            onChange={(event) => updateQuote("oilUnitPrice", numberValue(event.target.value))}
          />
        </label>
        <label>
          报价类型
          <select
            value={quote.quoteType}
            onChange={(event) => updateQuoteType(event.target.value as QuoteInput["quoteType"])}
          >
            <option value="standard">标准采购报价</option>
            <option value="annualPackage">包年报价</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={quote.includeDevices}
            onChange={(event) => updateQuote("includeDevices", event.target.checked)}
          />
          报价包含扩香机
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={quote.showSiteConfig}
            onChange={(event) => updateQuote("showSiteConfig", event.target.checked)}
          />
          报价单显示场地配置
        </label>
        {quote.quoteType === "standard" && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={quote.showFollowUpPurchase}
              onChange={(event) => updateQuote("showFollowUpPurchase", event.target.checked)}
            />
            显示后续精油采购
          </label>
        )}
        <label>
          用量报价方式
          <select
            disabled={quote.quoteType === "annualPackage"}
            value={quote.usageMode}
            onChange={(event) => updateQuote("usageMode", event.target.value as QuoteInput["usageMode"])}
          >
            <option value="monthly">按月测算</option>
            <option value="yearly">按年测算</option>
            <option value="custom">客户指定用量</option>
          </select>
        </label>
        {quote.usageMode === "custom" && (
          <label>
            客户指定用量（升）
            <input
              min="0"
              step="0.1"
              type="number"
              value={quote.customOilLiters}
              onChange={(event) => updateQuote("customOilLiters", numberValue(event.target.value))}
            />
          </label>
        )}
        {quote.quoteType === "standard" && (
          <label>
            后续折扣（%）
            <input
              max="100"
              min="0"
              type="number"
              value={quote.followUpDiscountPercent}
              onChange={(event) => updateQuote("followUpDiscountPercent", numberValue(event.target.value))}
            />
          </label>
        )}
      </section>

      <section className="panel">
        <div className="row-title">
          <h2>场地配置</h2>
          <button type="button" onClick={addSite}>
            添加场地
          </button>
        </div>
        {quote.sites.map((site, index) => (
          <div className="site" key={site.id}>
            <div className="row-title">
              <h3>场地 {index + 1}</h3>
              {quote.sites.length > 1 && (
                <button className="secondary" type="button" onClick={() => removeSite(site.id)}>
                  删除
                </button>
              )}
            </div>
            <label>
              场地名称
              <input value={site.name} onChange={(event) => updateSite(site.id, { name: event.target.value })} />
            </label>
            <label>
              设备台数
              <input
                min="0"
                type="number"
                value={site.deviceQuantity}
                onChange={(event) => updateSite(site.id, { deviceQuantity: numberValue(event.target.value) })}
              />
            </label>
            <label>
              每日运行小时
              <input
                max="24"
                min="0"
                type="number"
                value={site.dailyHours}
                onChange={(event) => updateSite(site.id, { dailyHours: numberValue(event.target.value) })}
              />
            </label>
            <label>
              喷香时间（秒）
              <input
                min="0"
                type="number"
                value={site.spraySeconds}
                onChange={(event) => updateSite(site.id, { spraySeconds: numberValue(event.target.value) })}
              />
            </label>
            <label>
              停机时间（秒）
              <input
                min="0"
                type="number"
                value={site.pauseSeconds}
                onChange={(event) => updateSite(site.id, { pauseSeconds: numberValue(event.target.value) })}
              />
            </label>
            <label>
              耗油量（ml/小时/台）
              <input
                min="0"
                type="number"
                value={site.oilMlPerHourPerDevice}
                onChange={(event) =>
                  updateSite(site.id, { oilMlPerHourPerDevice: numberValue(event.target.value) })
                }
              />
            </label>
            <label>
              每月运行天数
              <input
                min="0"
                type="number"
                value={site.monthlyDays}
                onChange={(event) => updateSite(site.id, { monthlyDays: numberValue(event.target.value) })}
              />
            </label>
            <label>
              备注
              <input value={site.remark} onChange={(event) => updateSite(site.id, { remark: event.target.value })} />
            </label>
          </div>
        ))}
      </section>

      <section className="panel preview">
        <h2>报价预览</h2>
        {errors.length > 0 && (
          <ul className="errors">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {result && (
          <dl className="summary">
            {result.includeDevices && (
              <div>
                <dt>设备总数</dt>
                <dd>{result.totalDeviceQuantity} 台</dd>
              </div>
            )}
            <div>
              <dt>报价类型</dt>
              <dd>{result.quoteTypeLabel}</dd>
            </div>
            <div>
              <dt>{result.usageMode === "custom" ? "客户指定用量" : `${result.usageLabel}理论耗油量`}</dt>
              <dd>{result.totalTheoreticalOilLiters} L</dd>
            </div>
            <div>
              <dt>建议采购量</dt>
              <dd>
                {result.recommendedOilLiters.toFixed(1)} {result.usageUnitLabel}
              </dd>
            </div>
            {result.includeDevices && (
              <div>
                <dt>设备金额</dt>
                <dd>{result.deviceAmount.toFixed(2)} 元</dd>
              </div>
            )}
            <div>
              <dt>精油计价</dt>
              <dd>
                {result.oilUnitPrice.toFixed(2)} {result.oilPriceUnitLabel}
              </dd>
            </div>
            <div>
              <dt>{result.oilAmountLabel}</dt>
              <dd>
                {result.oilSaleQuantity.toFixed(1)} {result.oilSaleUnitLabel} ·{" "}
                {result.firstMonthOilAmount.toFixed(2)} 元
              </dd>
            </div>
            <div className="summary-primary">
              <dt>{result.purchaseTotalLabel}</dt>
              <dd>{result.firstPurchaseTotal.toFixed(2)} 元</dd>
            </div>
            {result.showFollowUpOilFee && (
              <div className="summary-follow-up">
                <dt>{result.followUpOilFeeLabel}</dt>
                <dd>
                  {result.followUpOilUnitPrice.toFixed(2)} {result.oilPriceUnitLabel} ·{" "}
                  {result.followUpMonthlyOilFee.toFixed(2)} 元
                </dd>
              </div>
            )}
          </dl>
        )}
        <div className="actions">
          <button
            type="button"
            disabled={!result}
            onClick={() => result && downloadBlob(createExcelBlob(result), `${filenameBase}.xlsx`)}
          >
            导出 Excel
          </button>
          <button type="button" disabled={!result || isCreatingPdf} onClick={exportPdf}>
            {isCreatingPdf ? "生成中..." : "导出 PDF"}
          </button>
        </div>
      </section>
    </main>
  );
}
