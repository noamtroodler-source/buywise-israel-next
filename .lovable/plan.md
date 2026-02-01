
# Comprehensive Testing Plan: Agent Property Wizard

## Executive Summary
I will systematically test the Agent Add Property Wizard through all possible flows, combinations, edge cases, and error scenarios using browser automation. This includes testing each of the 6 steps, all property type variations, rental vs sale paths, validation logic, image handling, and the full submission process.

---

## Current Architecture Overview

The wizard consists of:
- **6 Steps**: Basics → Details → Features → Photos → Description → Review
- **Context Provider**: `PropertyWizardContext.tsx` manages state and validation
- **Property Types**: apartment, house, penthouse, cottage, land
- **Listing Types**: for_sale, for_rent

---

## Known Issue Detected

**Console Error Found**: `StepDescription` component has a ref forwarding issue:
```
Function components cannot be given refs. Check the render method of WizardContent.
```
This occurs because `AnimatePresence` is trying to pass a ref to `StepDescription`, which is not wrapped in `forwardRef()`. This needs to be fixed.

---

## Test Categories & Scenarios

### Phase 1: Step-by-Step Navigation Testing

#### Step 0 - Basics
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T1.1 | Empty form - click Next | Button disabled, cannot proceed |
| T1.2 | Title only entered | Button disabled |
| T1.3 | Title + Price (no address) | Button disabled |
| T1.4 | Valid title, price, address without street number | "Please select address with street number" warning |
| T1.5 | Valid title, price, typed address but not selected from dropdown | "Must select from dropdown" warning |
| T1.6 | Select address from unsupported city | "Not a supported city" error, address cleared |
| T1.7 | Complete all fields with valid address | Next enabled, map shows pin |
| T1.8 | Property type selection cycling | All 5 types selectable |
| T1.9 | Listing status toggle (Sale/Rent) | Price label changes appropriately |
| T1.10 | Price formatting with commas | Displays formatted, stores raw number |
| T1.11 | Character counter for title | Shows X/100 characters |

#### Step 1 - Details
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T2.1 | Apartment type - rooms/baths fields | Required fields visible |
| T2.2 | Land type - lot size required | Only lot size + parking visible |
| T2.3 | House type - no floor fields | Building section hidden |
| T2.4 | Floor number validation | Accepts 0 (ground floor) |
| T2.5 | Decimal bathroom values | Accepts 0.5 increments |
| T2.6 | Year built future date | Accepts up to current year +5 |
| T2.7 | Negative parking value | Should not allow or show 0 |
| T2.8 | Land without lot_size | Cannot proceed |

#### Step 2 - Features
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T3.1 | Toggle all feature checkboxes | Visual feedback, updates state |
| T3.2 | Rental mode - Lease Details section | Shows lease term, subletting, agent fee |
| T3.3 | Sale mode - no Lease Details | Section hidden |
| T3.4 | Property Terms (both modes) | Furnished status, pets policy visible |
| T3.5 | Immediate entry checked | Date picker hidden |
| T3.6 | Immediate entry unchecked | Date picker shown, min date = today |
| T3.7 | Va'ad Bayit input formatting | Shekel prefix, number formatting |
| T3.8 | AC type selection | All 4 options work |
| T3.9 | Condition dropdown | All 5 conditions selectable |
| T3.10 | Feature sync with explicit booleans | balcony → has_balcony, etc. |

#### Step 3 - Photos
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T4.1 | No photos - click Next | Button disabled |
| T4.2 | 1-2 photos uploaded | Warning "minimum 3 required" |
| T4.3 | 3 photos uploaded | Can proceed |
| T4.4 | 5+ photos uploaded | "Great length" or similar |
| T4.5 | Drag to reorder | Order updates, first = cover |
| T4.6 | "Set as Cover" button | Moves image to first position |
| T4.7 | Remove image | Image deleted from list |
| T4.8 | Max 20 images | Upload button hidden at 20 |
| T4.9 | Invalid image file | Error state shown |
| T4.10 | Large file upload | Loading state displays |

#### Step 4 - Description
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T5.1 | Empty description | Cannot proceed |
| T5.2 | < 100 chars description | Character feedback red |
| T5.3 | 300-500 chars | "Great length!" feedback |
| T5.4 | > 2000 chars | Truncated at max |
| T5.5 | AI Grammar Check button | Calls edge function, shows feedback |
| T5.6 | Apply improved version | Updates description text |
| T5.7 | Add highlight | Appears in list |
| T5.8 | Remove highlight | Removed from list |
| T5.9 | 5 highlights max | Input hidden after 5 |
| T5.10 | Highlight Enter key | Adds highlight |

#### Step 5 - Review
| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T6.1 | All data displays correctly | Shows summary of all steps |
| T6.2 | Edit buttons per section | Navigates to correct step |
| T6.3 | "Preview as Buyer" button | Opens PropertyPreviewDialog |
| T6.4 | Cover image shown | First uploaded image |
| T6.5 | All features/badges display | Correct labels |
| T6.6 | Description truncated | Shows first ~4 lines |

---

### Phase 2: Cross-Step Validation Testing

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T7.1 | Change property type after Step 1 | Details step updates conditionally |
| T7.2 | Change listing status after Step 2 | Features step shows/hides lease details |
| T7.3 | Navigate back and forward | State preserved |
| T7.4 | Remove all photos after reaching Step 5 | Cannot submit |
| T7.5 | Clear description after reaching Step 5 | Cannot submit |

---

### Phase 3: Property Type Matrix Testing

| Property Type | Listing Status | Special Behaviors |
|---------------|----------------|-------------------|
| Apartment | For Sale | Standard flow |
| Apartment | For Rent | + Lease Details section |
| House | For Sale | No floor fields, no building section |
| House | For Rent | No floor fields + Lease Details |
| Penthouse | For Sale | Standard floor fields |
| Penthouse | For Rent | Standard + Lease Details |
| Cottage | For Sale | Cottage/Garden Apartment label |
| Cottage | For Rent | + Lease Details |
| Land | For Sale | Only lot_size, no rooms/baths/floor/year |
| Land | For Rent | Lot size + Lease Details |

---

### Phase 4: Submission Flow Testing

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T8.1 | Save Draft button | Creates property with verification_status='draft' |
| T8.2 | Submit for Review (verified agent) | Creates with verification_status='pending_review' |
| T8.3 | Submit for Review (unverified agent) | Button disabled, warning banner shown |
| T8.4 | Submission success | PropertySubmittedDialog appears |
| T8.5 | Dialog "Add Another" button | Wizard resets |
| T8.6 | Dialog "Go to Dashboard" button | Navigates to /agent/properties |
| T8.7 | Network error during save | Toast error message |
| T8.8 | Loading state during submission | Spinner, buttons disabled |

---

### Phase 5: Edge Cases & Error States

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T9.1 | Special characters in title | Accepted, displayed correctly |
| T9.2 | Hebrew text in description | Renders correctly (RTL) |
| T9.3 | Very long address | Truncates or wraps appropriately |
| T9.4 | Price = 0 | Cannot proceed from Step 0 |
| T9.5 | Extremely high price | Formats with commas correctly |
| T9.6 | Rapid step navigation | No UI glitches |
| T9.7 | Browser back button | Handled gracefully |
| T9.8 | Page refresh mid-wizard | Auto-save preserves data (localStorage) |
| T9.9 | Multiple tabs open | Session-unique storage keys |

---

### Phase 6: UI/UX Consistency Checks

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| T10.1 | Mobile viewport | Responsive layout, usable |
| T10.2 | Progress bar accuracy | Reflects current step |
| T10.3 | Animation transitions | Smooth between steps |
| T10.4 | Scroll to top on step change | Window scrolls up |
| T10.5 | Disabled button styling | Visually distinct |
| T10.6 | Error state styling | Consistent red/destructive theme |
| T10.7 | Success state styling | Consistent primary/green theme |

---

## Technical Issues to Fix

### Issue 1: React Ref Warning
**File**: `src/components/agent/wizard/steps/StepDescription.tsx`
**Problem**: Component not wrapped in `forwardRef()` but receives ref from AnimatePresence
**Fix**: Wrap component with `React.forwardRef()` or ensure parent doesn't pass ref

### Issue 2: Potential Data Sync Issues
**Files**: `PropertyWizardContext.tsx`, `useAgentProperties.tsx`
**Check**: Verify all lease reality fields are being sent to DB correctly
**Fields**: `lease_term`, `subletting_allowed`, `furnished_status`, `pets_policy`, `agent_fee_required`

### Issue 3: Missing Fields in Submission
**File**: `src/pages/agent/NewPropertyWizard.tsx`
**Check**: Verify `parking`, `condition`, `lot_size_sqm` are included in mutation payload

---

## Test Execution Plan

1. **Setup**: Open browser, navigate to `/agent/properties/new`
2. **Authentication**: Ensure logged in as agent user
3. **Execute**: Run through each test category systematically
4. **Document**: Screenshot failures, log unexpected behaviors
5. **Report**: Compile findings with severity levels

---

## Success Criteria

- All validation rules enforce correctly
- No console errors during normal flow
- All property type/listing status combinations work
- Photos upload, reorder, and delete properly
- Description AI check integrates smoothly
- Preview dialog shows accurate data
- Save draft and submit for review both function
- Mobile responsiveness adequate
- No data loss on navigation

