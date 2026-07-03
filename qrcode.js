// qrcode.js - ATELIER Document Engine with Vercel Logistics Verification Integration

window.printWaybillDirect = async function(inputData) {
    // 1. Instantly open window tab to satisfy mobile/desktop browser secure pop-up blocks
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return alert("Popup blocked! Please allow popups for the warehouse print engine.");
    
    printWindow.document.write(`
        <html><body>
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; margin-top:150px; font-size:11px; letter-spacing:3px; color:#555;">
                ⏳ INITIALIZING ATELIER SECURE PRINT PIPELINE...
            </div>
        </body></html>
    `);

    try {
        let orderDataRecord = null;

        // 2. Fallback check: extract the pure string reference code if passed an object or string
        let cleanSearchKey = "";
        if (inputData && typeof inputData === 'object') {
            cleanSearchKey = String(inputData.id || inputData.tracking_number || '').replace('#', '').trim();
        } else if (inputData && typeof inputData === 'string') {
            cleanSearchKey = inputData.replace('#', '').trim();
        }

        if (!cleanSearchKey) {
            throw new Error("No tracking reference identifier provided to the print pipeline.");
        }

        // 3. Query your active database client engine dynamically
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        if (!activeDatabaseClient) throw new Error("Database reference client proxy is unreachable.");

        // Check ID column first
        let { data, error } = await activeDatabaseClient
            .from('orders')
            .select('*')
            .eq('id', cleanSearchKey)
            .maybeSingle();

        // Fallback to tracking_number if column mismatch occurs
        if (error || !data) {
            const fallback = await activeDatabaseClient
                .from('orders')
                .select('*')
                .eq('tracking_number', cleanSearchKey)
                .maybeSingle();
            data = fallback.data;
        }
        
        orderDataRecord = data;

        if (!orderDataRecord) {
            throw new Error(`Manifest Reference #${cleanSearchKey} not found within system records.`);
        }

        // 4. Safely process layout structures and item strings
        const isPod = orderDataRecord.payment_method === 'pay_on_delivery';
        const methodLabel = isPod ? "PAY ON DELIVERY (COLLECT CASH/TRANSFER)" : "PREPAID - DO NOT COLLECT CASH";
        const badgeColor = isPod ? "#000000" : "#555555";
        
        let orderItems = [];
        try {
            orderItems = typeof orderDataRecord.items === 'string' ? JSON.parse(orderDataRecord.items) : orderDataRecord.items;
        } catch(e) { 
            orderItems = orderDataRecord.items || []; 
        }

        const manifestLinesHtml = (orderItems || []).map(item => `
            <div style="display:flex; justify-content:space-between; font-size:11px; padding:8px 0; border-bottom:1px dashed #ccc; font-family:monospace;">
                <span>${(item.name || item.title || 'ATELIER PIECE').toUpperCase()} (Size: ${item.size || 'Standard'}) <strong>x${item.quantity || 1}</strong></span>
                <span>₦${Number(item.price || 0).toLocaleString()}</span>
            </div>
        `).join('');

        // 5. Force exact absolute URL string matching what your Vercel site parameters expect
        const vercelVerificationUrl = `https://seller-center-nu.vercel.app/verify-delivery.html?id=${encodeURIComponent(cleanSearchKey)}`;
        const qrEngineSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vercelVerificationUrl)}`;

        // 6. Build the clear printable layout canvas
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>ATELIER WAYBILL - #${cleanSearchKey.substring(0,8).toUpperCase()}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #000; padding: 30px; margin: 0; background: #fff; }
                    .container { border: 2px solid #000; padding: 30px; max-width: 600px; margin: 0 auto; position: relative; }
                    .header-title { font-size: 26px; font-weight: 900; letter-spacing: 6px; text-align: center; margin-bottom: 5px; }
                    .routing-badge { background: ${badgeColor}; color: #fff; text-align: center; padding: 12px; font-size: 11px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border: 1px solid #000; text-transform: uppercase; }
                    .data-block { margin-bottom: 18px; border-bottom: 1px dashed #000; padding-bottom: 15px; font-size: 12px; line-height: 1.6; }
                    .flex-structure { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-title">A T E L I E R</div>
                    <div style="text-align:center; font-size:9px; letter-spacing:2px; color:#555; text-transform:uppercase;">LOGISTICS & FULFILLMENT MANIFESTATION</div>
                    
                    <div class="routing-badge">${methodLabel}</div>
                    
                    <div class="flex-structure data-block">
                        <div>
                            <strong>WAYBILL REFERENCE:</strong> <span style="font-family:monospace; font-weight:bold;">#${cleanSearchKey.toUpperCase()}</span><br>
                            <strong>DISPATCH DATE:</strong> ${new Date().toLocaleDateString('en-GB')}<br>
                            <strong>SYSTEM STATUS:</strong> DISPATCHED VIA COURIER CHANNEL
                        </div>
                        <div style="text-align: center; border: 1px solid #000; padding: 8px; background: #fff;">
                            <img src="${qrEngineSource}" style="width:110px; height:110px; display:block;" alt="Logistics Scan Code" />
                            <div style="font-size:7px; font-weight:bold; margin-top:5px; letter-spacing:0.5px; text-transform:uppercase; color:#333;">SCAN TO VERIFY DELIVERY</div>
                        </div>
                    </div>

                    <div class="data-block">
                        <span style="font-weight:bold; letter-spacing:1px; text-transform:uppercase; display:block; margin-bottom:5px; color:#555; font-size:10px;">Consignee Destination:</span>
                        <strong>RECIPIENT:</strong> ${String(orderDataRecord.customer_name || 'Private Client').toUpperCase()}<br>
                        <strong>CONTACT:</strong> ${orderDataRecord.customer_phone || 'N/A'}<br>
                        <strong>REGION:</strong> ${String(orderDataRecord.shipping_region || 'Lagos').toUpperCase()}<br>
                        <strong>DELIVERY ADDRESS:</strong> ${String(orderDataRecord.address || '').toUpperCase()}
                    </div>

                    <div class="data-block" style="border-bottom:none; margin-bottom:0;">
                        <span style="font-weight:bold; letter-spacing:1px; text-transform:uppercase; display:block; margin-bottom:8px; color:#555; font-size:10px;">Package Contents Manifest:</span>
                        ${manifestLinesHtml}
                    </div>

                    <div style="margin-top:25px; display:flex; justify-content:space-between; align-items:center; border-top:2px solid #000; padding-top:15px; font-weight:bold; font-size:14px;">
                        <span>TOTAL AMOUNT:</span>
                        <span style="font-family:monospace;">₦${Number(orderDataRecord.total_amount || 0).toLocaleString()}</span>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 300);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();

    } catch (err) {
        if (printWindow) printWindow.close();
        alert("Print Pipeline Failure: " + err.message);
    }
};