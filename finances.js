// finances.js - ATELIER Luxury Accounting & Revenue Reconciliation Dashboard

async function renderFinancesSection() {
    const stage = document.getElementById('content-stage');
    if (!stage) return;

    stage.innerHTML = `
        <div style="padding: 40px; animation: fadeIn 0.5s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; min-height: 100vh;">
            
            <div style="margin-bottom: 30px;">
                <h2 style="letter-spacing: 3px; font-size: 13px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase;">FINANCIAL SETTLEMENT LEDGER</h2>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #666; letter-spacing: 0.5px;">Audit payment channels, reconcile point-of-collection transfers, and balance company accounts.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 35px;">
                <div style="background: #000; color: #fff; border: 1px solid #000; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #aaa;">TOTAL BANKED REVENUE</div>
                    <div style="font-size: 22px; font-weight: bold; font-family: monospace; margin-top: 10px;" id="metric-banked">₦0</div>
                </div>
                <div style="background: #fff; color: #000; border: 1px solid #000; padding: 25px;">
                    <div style="font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #666;">COURIER COLD CASH (UNSETTLED)</div>
                    <div style="font-size: 22px; font-weight: bold; font-family: monospace; margin-top: 10px; color: #856404;" id="metric-escrow">₦0</div>
                </div>
                <div style="background: #fff; color: #000; border: 1px solid #000; padding: 25px;">
                    <div style="font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #666;">POD PAYSTACK TRANSFERS</div>
                    <div style="font-size: 22px; font-weight: bold; font-family: monospace; margin-top: 10px; color: #155724;" id="metric-paystack-pod">₦0</div>
                </div>
            </div>

            <div style="background: #fff; border: 1px solid #000; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 9px;">
                    <thead>
                        <tr style="background: #000; color: #fff; text-transform: uppercase; letter-spacing: 2px; font-size: 10px;">
                            <th style="padding: 18px 15px;">Transaction Ref</th>
                            <th style="padding: 18px 15px;">Customer Account</th>
                            <th style="padding: 18px 15px;">Original Method</th>
                            <th style="padding: 18px 15px;">Fulfillment Status</th>
                            <th style="padding: 18px 15px;">Gross Total</th>
                            <th style="padding: 18px 15px;">Comm. Fee</th>
                            <th style="padding: 18px 15px;">Logistics Fee</th>
                            <th style="padding: 18px 15px;">Net Earnings</th>
                            <th style="padding: 18px 15px;">Settlement</th>
                            <th style="padding: 18px 15px; text-align: center;">Audit Status</th>
                        </tr>
                    </thead>
                    <tbody id="finance-table-body">
                        <tr><td colspan="10" style="padding: 50px; text-align: center; color: #888; letter-spacing: 1px;">Balancing account auditing columns...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    loadFinancialLedgerData();
}

async function loadFinancialLedgerData() {
    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return;

    try {
        const activeDatabaseClient = window.supabaseClient || window.supabaseClientInstance || window.db || window.supabase;
        
        if (!activeDatabaseClient) {
            console.error("Atelier Data Router Error: Global Supabase instance could not be found by finances.js.");
            tbody.innerHTML = `<tr><td colspan="10" style="padding: 50px; text-align: center; color: red; font-family: monospace;">DATABASE INITIALIZATION ERROR: CHECK SCRIPT ORDER</td></tr>`;
            return;
        }

        const { data: transactions, error } = await activeDatabaseClient
            .from('orders')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        let totalBanked = 0;
        let courierEscrow = 0;
        let paystackPodTotal = 0;

        if (!transactions || transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="padding: 60px; text-align: center; color: #888; letter-spacing: 2px;">NO RECORDED TRANSACTIONS FOUND.</td></tr>`;
            return;
        }

        let tableRowsHTML = "";

        for (const t of transactions) {
            const amount = Number(t.total_amount || 0);
            const commFee = Number(t.commission_fee || 0);
            const shippingFee = Number(t.shipping_fee_seller || 0);
            const netPayout = Number(t.net_payout || 0);

            const rawIdString = String(t.id || '').trim();
            const orderStatus = String(t.status || 'pending_delivery').toLowerCase().trim();
            const payMethod = String(t.payment_method || 'pay_on_delivery').toLowerCase().trim();
            const settlementStatus = String(
                t.settlement_status || (payMethod === 'online' ? 'paid' : 'unpaid')
            ).toLowerCase().trim();

            // --- ACCOUNTING METRICS CALCULATION ---
            if (orderStatus === "delivered") {
                if (payMethod === "online") {
                    totalBanked += amount;
                }
                if (payMethod === "pay_on_delivery" && settlementStatus === "paid") {
                    totalBanked += amount;
                }
                if (payMethod === "pay_on_delivery" && settlementStatus === "paystack_pod") {
                    paystackPodTotal += amount;
                    totalBanked += amount;
                }
                if (payMethod === "pay_on_delivery" && settlementStatus === "unpaid") {
                    courierEscrow += amount;
                }
            }

            // --- FINANCIAL BADGES COMPILATION ---
            let financialBadge = '';

            if (orderStatus !== "delivered") {
                financialBadge = `
                    <span style="background:#EAEAEA; color:#666; padding:5px 8px; font-size:9px; font-weight:bold;">
                        IN TRANSIT
                    </span>
                `;
            }
            else if (payMethod === "online") {
                financialBadge = `
                    <span style="background:#D4EDDA; color:#155724; border:1px solid #C3E6CB; padding:5px 8px; font-size:9px; font-weight:bold;">
                        ✓ ONLINE PAID
                    </span>
                `;
            }
            else if (settlementStatus === "paid") {
                financialBadge = `
                    <span style="background:#D4EDDA; color:#155724; border:1px solid #C3E6CB; padding:5px 8px; font-size:9px; font-weight:bold;">
                        ✓ FULLY SETTLED
                    </span>
                `;
            }
            else if (settlementStatus === "paystack_pod") {
                financialBadge = `
                    <span style="background:#E2F0D9; color:#155724; border:1px solid #C3E6CB; padding:5px 8px; font-size:9px; font-weight:bold;">
                        ⚡ PAYSTACK POD
                    </span>
                `;
            }
            else {
                financialBadge = `
                    <span style="background:#FFF3CD; color:#856404; border:1px solid #FFEBAA; padding:5px 8px; font-size:9px; font-weight:bold;">
                        ⚠️ COURIER ESCROW
                    </span>
                `;
            }

            let printableReferenceLabel = rawIdString.startsWith('#') ? rawIdString : `#${rawIdString}`;
            let auditStatusMarkup = `<span style="color:#888; font-size:10px; font-family: monospace; letter-spacing: 0.5px; text-transform: uppercase;">AUDITED</span>`;

            tableRowsHTML += `
                <tr style="border-bottom: 1px solid #eee; background: #fff;">
                    <td style="padding: 15px; font-family: monospace; font-weight: bold; letter-spacing:0.5px;">${printableReferenceLabel}</td>
                    <td style="padding: 15px; text-transform: uppercase; font-weight: bold;">${t.customer_name || 'Private Buyer'}</td>
                    <td style="padding: 15px; text-transform: uppercase; font-family: monospace; color: #555;">${t.payment_method || 'PAY_ON_DELIVERY'}</td>
                    <td style="padding: 15px; text-transform: uppercase; font-weight: bold; color: #444;">• ${orderStatus}</td>
                    <td style="padding: 15px; font-family: monospace; font-weight: bold;">₦${amount.toLocaleString()}</td>
                    <td style="padding: 15px; font-family: monospace; color: #ca5151;">₦${commFee.toLocaleString()}</td>
                    <td style="padding: 15px; font-family: monospace; color: #666;">₦${shippingFee.toLocaleString()}</td>
                    <td style="padding: 15px; font-family: monospace; font-weight: bold; color: #2e7d32;">₦${netPayout.toLocaleString()}</td>
                    <td style="padding: 15px;">${financialBadge}</td>
                    <td style="padding: 15px; text-align: center;">
                        ${auditStatusMarkup}
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = tableRowsHTML;

        document.getElementById('metric-banked').textContent = `₦${totalBanked.toLocaleString()}`;
        document.getElementById('metric-escrow').textContent = `₦${courierEscrow.toLocaleString()}`;
        document.getElementById('metric-paystack-pod').textContent = `₦${paystackPodTotal.toLocaleString()}`;

    } catch (err) {
        console.error("Finances Panel Compilation Failure:", err);
    }
}

window.renderFinancesSection = renderFinancesSection;
window.loadFinancialLedgerData = loadFinancialLedgerData;