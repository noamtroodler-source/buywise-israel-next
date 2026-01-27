

# Remove "Calls" from Analytics Tracking

## Overview

Since the platform only allows WhatsApp and Email contact methods (Call buttons were removed), we need to remove the "Calls" metric from all analytics dashboards and related components to avoid showing confusing empty stats.

---

## Files to Modify

### 1. `src/pages/agent/AgentLeads.tsx`
**Remove the Calls stat card and update the grid**

- **Lines 14, 148-156**: Remove the `Phone` import and the Calls stat card
- **Lines 192**: Remove `call` from the `InquiryPieChart` data prop
- **Lines 98**: Change grid from `lg:grid-cols-6` to `lg:grid-cols-5` (removing one column)

### 2. `src/components/agent/analytics/InquiryPieChart.tsx`
**Remove call from the chart data and interface**

- **Line 9**: Remove `call: number;` from interface
- **Lines 17-18**: Remove "Phone Calls" from `chartData` array
- **Lines 36-37, 62-63**: Update tooltip text to remove "phone calls" reference

### 3. `src/hooks/useAgentInquiryAnalytics.tsx`
**Remove call tracking from analytics hook**

- **Line 10**: Remove `callClicks: number;` from interface
- **Lines 67-72**: Remove `call` from `typeCounts` object
- **Line 147**: Remove `callClicks` from return object

### 4. `src/hooks/useAgentAnalytics.tsx`
**Remove call from agent analytics interface and calculations**

- **Lines 18-24**: Remove `call` from `inquiriesByType` interface
- **Line 41, 71**: Remove `call: 0` from default return objects
- **Line 143**: Remove call filter line

### 5. `src/hooks/useAgencyAnalytics.tsx`
**Remove call from agency analytics interface and calculations**

- **Lines 22-27**: Remove `call` from `inquiriesByType` interface
- **Line 43, 73**: Remove `call: 0` from default return objects
- **Line 166**: Remove call filter line

### 6. `src/hooks/useInquiryMetrics.tsx`
**Remove call from type formatting**

- **Line 127**: Remove `call: 'Phone Call'` from `typeMap`

### 7. `src/hooks/useInquiryTracking.tsx`
**Remove call from InquiryType**

- **Line 5**: Change `'whatsapp' | 'call' | 'email' | 'form'` to `'whatsapp' | 'email' | 'form'`

### 8. `src/hooks/useProjectInquiryTracking.tsx`
**Remove call from ProjectInquiryType**

- **Line 5**: Change `'whatsapp' | 'call' | 'email' | 'form'` to `'whatsapp' | 'email' | 'form'`

---

## Detailed Changes

### AgentLeads.tsx - Stats Grid Update

```text
Before (6 columns):
┌────────┬────────┬────────┬────────┬────────┬────────┐
│ Views  │ Saves  │ Clicks │WhatsApp│ Calls  │ Emails │
└────────┴────────┴────────┴────────┴────────┴────────┘

After (5 columns):
┌────────┬────────┬────────┬────────┬────────┐
│ Views  │ Saves  │ Clicks │WhatsApp│ Emails │
└────────┴────────┴────────┴────────┴────────┘
```

### InquiryPieChart - Data Update

```text
Before:
- WhatsApp
- Phone Calls  ← removed
- Emails
- Forms

After:
- WhatsApp
- Emails
- Forms
```

---

## Note on Database

The database still stores `call` as a valid inquiry type (for historical data or future use), but we simply won't display it in the UI since users can't generate new call inquiries anymore. This is a UI-only change that aligns with the existing platform strategy.

---

## Summary

| File | Change |
|------|--------|
| `AgentLeads.tsx` | Remove Calls stat card, update grid to 5 columns |
| `InquiryPieChart.tsx` | Remove `call` from interface and chart data |
| `useAgentInquiryAnalytics.tsx` | Remove `callClicks` from interface and return |
| `useAgentAnalytics.tsx` | Remove `call` from `inquiriesByType` |
| `useAgencyAnalytics.tsx` | Remove `call` from `inquiriesByType` |
| `useInquiryMetrics.tsx` | Remove `call` from type formatting map |
| `useInquiryTracking.tsx` | Remove `call` from `InquiryType` type |
| `useProjectInquiryTracking.tsx` | Remove `call` from `ProjectInquiryType` type |

This cleans up the analytics UI to only show the contact methods that are actually available to users (WhatsApp, Email, and Form submissions).

