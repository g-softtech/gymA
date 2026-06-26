export function generateReceiptHtml({
  gymName,
  receiptNumber,
  transactionReference,
  memberName,
  memberEmail,
  planName,
  amountFormatted,
  paymentDate,
  subscriptionStart,
  subscriptionEnd,
  tenantEmail,
}: {
  gymName: string;
  receiptNumber: string;
  transactionReference: string;
  memberName: string;
  memberEmail: string;
  planName: string;
  amountFormatted: string;
  paymentDate: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  tenantEmail: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #111827; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; }
    .content { padding: 32px; }
    .receipt-title { font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 15px; }
    .label { color: #6b7280; font-weight: 500; }
    .value { font-weight: 600; text-align: right; }
    .total-row { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: 700; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; }
    
    @media only screen and (max-width: 480px) {
      .row { flex-direction: column; }
      .value { text-align: left; margin-top: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${gymName}</h1>
    </div>
    <div class="content">
      <div class="receipt-title">Payment Receipt</div>
      
      <div class="row">
        <span class="label">Receipt Number</span>
        <span class="value">${receiptNumber}</span>
      </div>
      <div class="row">
        <span class="label">Transaction Reference</span>
        <span class="value">${transactionReference}</span>
      </div>
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${paymentDate}</span>
      </div>
      
      <div style="margin: 32px 0;"></div>
      
      <div class="row">
        <span class="label">Billed To</span>
        <span class="value">${memberName}<br/><span style="font-size:13px; color:#6b7280; font-weight:normal;">${memberEmail}</span></span>
      </div>
      
      <div style="margin: 32px 0;"></div>

      <div class="row">
        <span class="label">Membership Plan</span>
        <span class="value">${planName}</span>
      </div>
      <div class="row">
        <span class="label">Billing Cycle</span>
        <span class="value">${subscriptionStart} - ${subscriptionEnd}</span>
      </div>
      <div class="row">
        <span class="label">Payment Method</span>
        <span class="value">Paystack</span>
      </div>
      
      <div class="total-row">
        <span>Total Paid</span>
        <span>${amountFormatted}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>If you have any questions concerning this receipt, contact us at ${tenantEmail}</p>
    </div>
  </div>
</body>
</html>
  `;
}
