# GlassMartin Quote PWA Design

Date: 2026-06-29
Status: approved for implementation planning

## Goal

Build a mobile-first offline PWA for generating GlassMartin commercial scent-system quotations on site.

The app lets the user enter customer, device, fragrance oil, scent schedule, and pricing parameters, then generates both:

- Editable Excel file
- Formal customer-facing PDF

Accuracy is the priority. Excel and PDF must be generated from the same calculated quotation result so totals cannot drift between outputs.

## Source Template Findings

The provided Excel template has two sheets:

- Formal quotation
- Usage calculation

The template includes old price values in several places, including 196, 197, and 210 yuan per device. Future generated quotations must not reuse those fixed old values. All device and fragrance oil amounts must use prices entered for the current quotation.

The current template also shows the expected business structure:

- Customer and quotation metadata
- Device line item
- Fragrance oil line item
- First purchase total
- Follow-up monthly fragrance oil fee
- Project/site usage summary
- Business notes
- Customer confirmation area

## Product Approach

Use a mobile-first PWA:

- Installable to a phone home screen
- Works offline after initial installation
- No required computer at customer site
- Stores quotation drafts locally on the device
- Exports Excel and PDF directly from the browser

PDF layout does not need to exactly copy the Excel template. It should be a formal customer-facing quotation with consistent content, calculations, and GlassMartin branding.

## App Structure

The app has three clear layers:

- Form layer: captures user input and validates it.
- Calculation layer: derives usage, quantities, totals, and summaries.
- Export layer: creates Excel and PDF from the same calculation result.

The calculation layer must be independent and unit tested.

## Form Fields

### Basic Information

- Customer name: required.
- Quotation number: default generated as `GM-(customer name pinyin initials)-YYYYMMDD`, editable.
- Quotation date: defaults to the current date, editable.
- Validity period: defaults to `15日内-因原料价格波动`, editable.
- Quotation company: defaults to `GlassMartin 香薰工厂`, editable.

### Device Information

- Device model: required.
- Device style or remark: optional, for values such as 插电款, 黑/白.
- Device unit price: required, non-negative.
- Device quantity: required for single-site quotes.

For multi-site quotes, each site has its own device quantity and total device quantity is calculated automatically.

### Fragrance Oil Information

- Fragrance oil name: required.
- Fragrance oil description: optional.
- Fragrance oil unit price per liter: required, non-negative.
- Follow-up monthly discount: defaults to 90%, editable.

### Usage Parameters

Defaults:

- Daily running hours: user-entered per quote.
- Spray seconds: user-entered per quote.
- Pause seconds: user-entered per quote.
- Continuous oil consumption: defaults to 5 ml/hour/device, editable.
- Monthly running days: defaults to 30, editable.

### Site Configuration

The app defaults to one site.

Each site includes:

- Site name
- Device quantity
- Daily running hours
- Spray seconds
- Pause seconds
- Continuous oil consumption
- Monthly running days
- Remark

Most quotes use a single site. For rare combined quotations, the user can add multiple sites. Site fields can inherit global usage parameters, but can be adjusted per site.

## Calculation Rules

Effective spray ratio:

```text
spraySeconds / (spraySeconds + pauseSeconds)
```

Theoretical monthly oil consumption for each site:

```text
deviceQuantity
  * dailyRunningHours
  * effectiveSprayRatio
  * oilConsumptionMlPerHourPerDevice
  * monthlyRunningDays
  / 1000
```

Total theoretical monthly oil consumption:

```text
sum(site theoretical monthly oil consumption)
```

Recommended fragrance oil purchase quantity:

```text
ceil(total theoretical monthly oil consumption)
```

Device amount:

```text
totalDeviceQuantity * deviceUnitPrice
```

First-month fragrance oil amount:

```text
recommendedOilLiters * oilUnitPrice
```

First purchase total:

```text
deviceAmount + firstMonthOilAmount
```

Follow-up monthly fragrance oil fee:

```text
firstMonthOilAmount * followUpMonthlyDiscount
```

Tax, freight, and installation fees are not included in automatic calculations. They appear only in business notes as subject to final contract confirmation.

## Validation Rules

Required fields:

- Customer name
- Device model
- Device quantity or per-site device quantities
- Device unit price
- Fragrance oil name
- Fragrance oil unit price

Numeric fields must be valid numbers and cannot be negative:

- Device quantity
- Device unit price
- Fragrance oil unit price
- Daily running hours
- Spray seconds
- Pause seconds
- Continuous oil consumption
- Monthly running days
- Follow-up monthly discount

Additional validation:

- Spray seconds and pause seconds cannot both be 0.
- Daily running hours should not exceed 24.
- Follow-up monthly discount should be between 0 and 100%.
- At least one site is required.
- Total device quantity must be greater than 0 before export.

When validation fails, export buttons remain disabled and the app shows specific field-level messages.

## Output Design

### Excel

The Excel export contains:

- Customer and quotation metadata
- Device and fragrance oil quotation lines
- First purchase total
- Follow-up monthly fragrance oil fee
- Site usage summary
- Calculation parameters
- Business notes

Excel should be editable after export.

### PDF

The PDF export contains:

- GlassMartin title and brand description
- Customer and quotation metadata
- Device and fragrance oil quotation table
- First purchase total
- Follow-up monthly fragrance oil fee
- Site usage summary
- Business notes
- Customer confirmation area

The PDF should be clean and suitable for direct customer sharing from a phone.

## Testing Strategy

Calculation tests must cover:

- Single-site quotation
- Multi-site quotation
- Effective spray ratio
- Monthly oil consumption
- Recommended oil liters rounded up to an integer
- Device amount from user-entered price
- First-month oil amount from user-entered price
- First purchase total
- Follow-up monthly discount at 90%, 85%, and 100%
- Invalid spray/pause values
- Invalid negative values
- Zero quantity handling

Export tests should verify that Excel and PDF receive the same calculated quotation result.

## Implementation Notes

Recommended technical direction:

- Vite + React + TypeScript for the PWA UI.
- Vitest for calculation tests.
- A browser-side Excel library for `.xlsx` generation.
- A browser-side PDF library for customer PDF generation.
- Local storage or IndexedDB for drafts.
- Service worker and manifest for offline installation.

The exact package choices should be confirmed during implementation planning based on dependency availability and mobile-browser compatibility.

## Out Of Scope For First Version

- Native iOS or Android app packaging.
- Cloud accounts or team sharing.
- Backend server.
- CRM integration.
- Perfect visual replication of the original Excel template in PDF.
- Automatic tax, freight, or installation fee calculation.
