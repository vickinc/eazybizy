# Testing Account Selection for Invoice Mark as Paid

## Test Plan

### 1. Prerequisites
- Have at least one company with bank accounts or digital wallets
- Have at least one invoice that can be marked as paid
- Development server running on http://localhost:3003

### 2. UI Testing Steps

1. **Navigate to invoices page**
   - Go to `/sales/invoices`
   - Select a specific company (not "All Companies")

2. **Test account selection dialog**
   - Find an invoice with status "SENT" or "OVERDUE"
   - Click the "Mark as Paid" option from the invoice actions menu
   - **Expected**: Account selection dialog should appear
   - **Expected**: Dialog should show available bank accounts and digital wallets for the selected company

3. **Test account selection**
   - Select a bank account or digital wallet from the dropdown
   - **Expected**: Preview of selected account should appear
   - Click "Confirm Payment"
   - **Expected**: Invoice should be marked as paid and success message should appear

4. **Verify revenue entry**
   - Navigate to `/accounting/bookkeeping/entries`
   - Find the newly created revenue entry for the invoice
   - **Expected**: Account Type should show "bank" or "wallet" (not "Not Specified")
   - **Expected**: Account ID should show the actual account ID (not "Not specified")

### 3. API Testing

You can test the API directly using curl:

```bash
# Test without account information (should fail)
curl -X POST http://localhost:3003/api/invoices/[INVOICE_ID]/mark-paid \
  -H "Content-Type: application/json" \
  -d '{"paidDate": "2025-07-25T18:00:00.000Z"}'

# Expected: 400 error "Account ID and account type are required"

# Test with account information (should succeed)
curl -X POST http://localhost:3003/api/invoices/[INVOICE_ID]/mark-paid \
  -H "Content-Type: application/json" \
  -d '{
    "paidDate": "2025-07-25T18:00:00.000Z",
    "accountId": "[BANK_ACCOUNT_OR_WALLET_ID]",
    "accountType": "bank"
  }'

# Expected: 200 success with invoice and bookkeeping entry
```

### 4. Edge Cases to Test

1. **No accounts available**
   - Select a company with no bank accounts or digital wallets
   - Try to mark an invoice as paid
   - **Expected**: Dialog should show warning message about no accounts

2. **Invalid account**
   - Manually send API request with account ID from different company
   - **Expected**: 400 error "Selected account does not belong to the invoice company"

3. **Already paid invoice**
   - Try to mark an already paid invoice as paid again
   - **Expected**: Info message "Invoice is already marked as paid"

### 5. Success Criteria

✅ Account selection dialog appears when marking invoice as paid
✅ Dialog shows only accounts belonging to the selected company  
✅ Account selection works with both bank accounts and digital wallets
✅ Revenue entries now show correct Account Type and Account ID
✅ API validates account ownership
✅ Error handling works for edge cases

## Notes

- The bulk mark paid functionality still uses the old flow (no account selection)
- This is intentional as bulk operations typically have different UX considerations
- Individual invoice marking now requires account selection for proper tracking