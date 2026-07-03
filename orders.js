// orders.js - ATELIER Production Ledger Engine - Verified Master
let currentActiveView = 'pending'; 

async function renderOrdersSection() {
    const stage = document.getElementById('content-stage');
    if (!stage) return;

    stage.innerHTML = `
        <div style="padding: 40px; animation: fadeIn 0.5s; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; min-height: 100vh;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <div>
                    <h2 style="letter-spacing: 3px; font-size: 13px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase;">ORDER PIPELINE LEDGER</h2>
                    <p style="margin: 5px 0 0 0; font-size: 10px; color: #666; letter-spacing: 0.5px;">Monitor package routing pipelines and manage settlement verification actions.</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="fetchAndDisplayOrders('pending')" style="border: 1px solid #000; background: #000; color: #fff; padding: 8px 16px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;" id="btn-pending">PENDING(<span id="count-pending">0</span>)</button>
                    <button onclick="fetchAndDisplayOrders('shipped')" style="border: 1px solid #000; background: #fff; color: #000; padding: 8px 16px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;" id="btn-shipped">SHIPPED(<span id="count-shipped">0</span>)</button>
                    <button onclick="fetchAndDisplayOrders('delivered')" style="border: 1px solid #000; background: #fff; color: #000; padding: 8px 16px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;" id="btn-delivered">DELIVERED</button>
                    <button onclick="fetchAndDisplayOrders('cancelled')" style="border: 1px solid #000; background: #fff; color: #000; padding: 8px 16px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;" id="btn-cancelled">CANCELLED</button>
                </div>
            </div>

            <div id="logistics-scanner-console" style="display: none; background: #fff; border: 1px solid #000; padding: 20px; margin-bottom: 25px;">
                <div style="font-size: 10px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; color: #000;">
                    📦 DELIVERY COMPLETION HUB (MANUAL BYPASS REFERENCE)
                </div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="scanner-waybill-input" placeholder="ENTER COURIER WAYBILL REFERENCE ID TO FORCE VERIFY..." 
                           style="flex: 1; padding: 10px; border: 1px solid #ccc; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;" />
                    <button onclick="executeLogisticsBarcodeScan()" 
                            style="background: #000; color: #fff; border: none; padding: 10px 20px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;">
                        VERIFY DELIVERY
                    </button>
                </div>
                <div id="scanner-feedback-msg" style="margin-top: 8px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;"></div>
            </div>
            
            <div style="background: #fff; border: 1px solid #000; box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
                    <thead>
                        <tr style="background: #000; color: #fff; text-transform: uppercase; letter-spacing: 2px; font-size: 10px;">
                            <th style="padding: 18px 15px; width: 60px; text-align: center;">Actions</th>
                            <th style="padding: 18px 15px;">Order Ref</th>
                            <th style="padding: 18px 15px;">Date Placed</th>
                            <th style="padding: 18px 15px;">Client / Contact</th>
                            <th style="padding: 18px 15px;">Address</th>
                            <th style="padding: 18px 15px;">Settlement Type</th>
                            <th style="padding: 18px 15px;">Total Amount</th>
                            <th style="padding: 18px 15px; text-align: center;">Logistics / Settlement Action</th>
                        </tr>
                    </thead>
                    <tbody id="order-table-body">
                        <tr><td colspan="8" style="padding: 50px; text-align: center; color: #888; letter-spacing: 1px;">Syncing with workspace routing channels...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetchAndDisplayOrders('pending');
}

async function fetchAndDisplayOrders(viewType) {
    const tbody = document.getElementById('order-table-body');
    const scannerConsole = document.getElementById('logistics-scanner-console');
    if (!tbody) return;

    currentActiveView = viewType; 

    // 1. Synchronize control tab navigation element highlights
    const tabs = {
        'pending': document.getElementById('btn-pending'),
        'shipped': document.getElementById('btn-shipped'),
        'delivered': document.getElementById('btn-delivered'),
        'cancelled': document.getElementById('btn-cancelled')
    };

    Object.keys(tabs).forEach(key => {
        if (tabs[key]) {
            if (key === viewType) {
                tabs[key].style.background = '#000';
                tabs[key].style.color = '#fff';
            } else {
                tabs[key].style.background = '#fff';
                tabs[key].style.color = '#000';
            }
        }
    });

    // 2. Control visibility parameters for the mobile override dispatch bar console
    if (scannerConsole) {
        scannerConsole.style.display = (viewType === 'shipped') ? 'block' : 'none';
    }

    try {
        // 3. Connect live transaction database channels
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        if (!activeDatabaseClient) {
            tbody.innerHTML = `<tr><td colspan="8" style="padding: 40px; text-align: center; color: red; font-weight: bold;">CONNECTION OFFLINE</td></tr>`;
            return;
        }

        const { data: orders, error } = await activeDatabaseClient
            .from('orders')
            .select('*');

        if (error) throw error;

        // 4. Update memory caches sorted cleanly from most recent down
        window.cachedAtelierOrdersList = (orders || []).sort((a, b) => {
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        // Calculate dynamic dashboard navigation indicator counts safely
        const pendingCount = window.cachedAtelierOrdersList.filter(o => {
            const status = o.status ? String(o.status).toLowerCase().trim() : 'pending';
            return status !== 'shipped' && status !== 'delivered' && status !== 'cancelled';
        }).length;

        const shippedCount = window.cachedAtelierOrdersList.filter(o => {
            const status = o.status ? String(o.status).toLowerCase().trim() : '';
            return status === 'shipped';
        }).length;

        if (document.getElementById('count-pending')) document.getElementById('count-pending').textContent = pendingCount;
        if (document.getElementById('count-shipped')) document.getElementById('count-shipped').textContent = shippedCount;

        // Filter the rows matching the active layout viewport status
        const filtered = window.cachedAtelierOrdersList.filter(o => {
            const cleanStatus = o.status ? String(o.status).toLowerCase().trim() : 'pending';
            
            if (viewType === 'pending') {
                return cleanStatus !== 'shipped' && cleanStatus !== 'delivered' && cleanStatus !== 'cancelled';
            }
            if (viewType === 'shipped') return cleanStatus === 'shipped';
            if (viewType === 'delivered') return cleanStatus === 'delivered';
            if (viewType === 'cancelled') return cleanStatus === 'cancelled';
            return false;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="padding: 60px; text-align: center; color: #888; letter-spacing: 2px; font-weight: 300;">
                        THE SELECTED PIPELINE IS CURRENTLY EMPTY.
                    </td>
                </tr>`;
            return;
        }

        // 5. Construct structural output table loops
        tbody.innerHTML = filtered.map((order) => {
            const rawIdString = String(order.id || '').trim();
            const orderStatus = String(order.status || 'pending').toLowerCase().trim();
            const orderAmount = Number(order.total_amount || 0);

            let payMethod = String(order.payment_method || '').toLowerCase().trim();
            if (orderStatus === 'paid' && !payMethod) {
                payMethod = 'online';
            } else if (!payMethod) {
                payMethod = 'pay_on_delivery';
            }

            const settlementStatus = String(order.settlement_status || (payMethod === 'online' || orderStatus === 'paid' ? 'paid' : 'unpaid')).toLowerCase().trim();

            let cleanAddress = order.address || 'No Address Logged';
            let referenceLabel = rawIdString.startsWith('#') ? rawIdString : `#${rawIdString}`;
            let datePlaced = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '---';

            // --- REDEFINED LOGISTICS / SETTLEMENT WORKFLOW SEGREGATION ---
            let actionButtonMarkup = '';

            if (viewType === 'pending') {
                actionButtonMarkup = `
                    <div style="display: flex; gap: 5px; justify-content: center; align-items: center;">
                        <button onclick="printWaybillDirect('${rawIdString}')" style="background: #fff; color: #000; border: 1px solid #000; padding: 6px 10px; font-size: 9px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                            PRINT WAYBILL
                        </button>
                        <button onclick="triggerManualShipTransition('${rawIdString}')" style="background: #000; color: #fff; border: 1px solid #000; padding: 6px 12px; font-size: 9px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                            MARK SHIP
                        </button>
                        <button onclick="triggerOrderCancellation('${rawIdString}')" style="background: #fff; color: #ca5151; border: 1px solid #ca5151; padding: 6px 10px; font-size: 9px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                            CANCEL
                        </button>
                    </div>
                `;
            } else if (viewType === 'shipped') {
                // FIXED: Dispatches strictly wait for courier delivery verification scan tracking loops
                actionButtonMarkup = `
                    <span style="font-size: 11px; color: #666; font-style: italic; letter-spacing: 0.5px;">
                        待 Awaiting Mobile QR Scan...
                    </span>
                `;
            } else if (viewType === 'delivered') {
                // FIXED: Settlement selectors execute strictly upon delivery confirmation
                if (settlementStatus === 'paid') {
                    actionButtonMarkup = `<span style="color: #155724; font-weight: bold; font-size: 9px; letter-spacing: 0.5px;">✓ FULLY SETTLED</span>`;
                } else if (settlementStatus === 'paystack_pod') {
                    actionButtonMarkup = `<span style="color: #4a90e2; font-weight: bold; font-size: 9px; letter-spacing: 0.5px;">⚡ PAYSTACK POD</span>`;
                } else {
                    actionButtonMarkup = `
                        <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                            <button onclick="processQuickSettlement('${rawIdString}', 'paid')" style="background: #000; color: #fff; border: 1px solid #000; padding: 6px 10px; font-size: 9px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                                COLLECTED CASH
                            </button>
                            <button onclick="processQuickSettlement('${rawIdString}', 'paystack_pod')" style="background: #fff; color: #000; border: 1px solid #000; padding: 6px 10px; font-size: 9px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                                PAYSTACK TRANSFER
                            </button>
                        </div>
                    `;
                }
            } else if (viewType === 'cancelled') {
                actionButtonMarkup = `<span style="color: #ca5151; font-weight: bold; font-size: 9px; text-transform: uppercase;">CANCELLED</span>`;
            }

            // 6. Assemble sub-compartment item descriptions mappings
            let itemsHtml = '';
            if (order.items) {
                try {
                    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    if (Array.isArray(parsedItems)) {
                        itemsHtml = parsedItems.map(item => {
                            let imgUrl = item.image || item.image_url || item.thumbnail || '';
                            let imgHtml = imgUrl ? `<img src="${imgUrl}" style="width: 40px; height: 45px; object-fit: cover; border: 1px solid #eee; margin-right: 12px;" onerror="this.style.display='none'"/>` : '';
                            return `
                                <div style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 11px;">
                                    ${imgHtml}
                                    <div>
                                        📦 <strong>${String(item.name || item.product_name || 'Item').toUpperCase()}</strong> 
                                        ${item.size ? `<span style="margin-left: 8px; color: #666;">Size: ${item.size}</span>` : ''} 
                                        ${item.quantity ? `<span style="margin-left: 8px; color: #666;">x${item.quantity}</span>` : 'x1'}
                                        <div style="font-family: monospace; font-weight: bold; margin-top: 2px;">₦${Number(item.price || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else if (typeof parsedItems === 'object') {
                        itemsHtml = `<div style="padding: 4px 0;">📦 ${JSON.stringify(parsedItems)}</div>`;
                    }
                } catch (e) {
                    itemsHtml = `<div style="padding: 4px 0; color:#666;">${order.items}</div>`;
                }
            }
            if (!itemsHtml) itemsHtml = `<div style="color: #999;">No specific items summary map logged.</div>`;

            // Return table markup structure with working custom dropdown details compartments intact
            return `
                <tr style="border-bottom: 1px solid #eee; background: #fff;">
                    <td style="padding: 15px; text-align: center;">
                        <button id="toggle-btn-${rawIdString}" onclick="toggleOrderManifestCompartment('${rawIdString}')" style="background: none; border: 1px solid #000; width: 20px; height: 20px; font-weight: bold; cursor: pointer; font-size: 11px; padding: 0;">+</button>
                    </td>
                    <td style="padding: 15px; font-family: monospace; font-weight: bold;">${referenceLabel}</td>
                    <td style="padding: 15px; color: #555; font-family: monospace;">${datePlaced}</td>
                    <td style="padding: 15px;">
                        <div style="font-weight: bold; text-transform: uppercase;">${order.customer_name || 'Anonymous Client'}</div>
                        <div style="color: #666; font-size: 10px; font-family: monospace; margin-top: 2px;">${order.customer_phone || '---'}</div>
                    </td>
                    <td style="padding: 15px; max-width: 220px; font-size: 10px; line-height: 1.4; color: #333; word-wrap: break-word; white-space: pre-line;">${cleanAddress}</td>
                    <td style="padding: 15px; font-family: monospace; text-transform: uppercase; font-weight: bold;">
                        ${payMethod === 'online' || orderStatus === 'paid' ? 'PREPAID (ONLINE)' : 'PAY ON DELIVERY'}
                    </td>
                    <td style="padding: 15px; font-family: monospace; font-weight: bold;">
                        ₦${orderAmount.toLocaleString()}
                    </td>
                    <td style="padding: 15px; text-align: center;">
                        ${actionButtonMarkup}
                    </td>
                </tr>
                <tr id="manifest-row-${rawIdString}" style="display: none; background: #fafafa;">
                    <td colspan="8" style="padding: 20px 40px; border-left: 3px solid #000;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 40px;">
                            <div style="flex: 1;">
                                <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Order Inventory Items Mapping</div>
                                <div style="font-family: monospace; font-size: 11px; color: #333; margin-bottom: 15px;">
                                    ${itemsHtml}
                                </div>
                                <div style="font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">Manifest Route Parameters</div>
                                <div style="font-family: monospace; font-size: 11px; line-height: 1.6; color: #555;">
                                    <strong>Delivery Notes:</strong> ${order.notes || 'None Specified'}<br>
                                    <strong>Tracking reference ID:</strong> ${order.tracking_number || 'Awaiting Logistics Processing'}<br>
                                    <strong>Full System Destination Address:</strong> ${cleanAddress}
                                </div>
                            </div>
                            <div>
                                <button class="print-btn" onclick="printWaybillDirect('${order.id || order.tracking_number}')" style="background: #000; color: #fff; border: 1px solid #000; padding: 8px 16px; font-size: 10px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase; white-space: nowrap;">
                                    🖨️ PRINT WAYBILL
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Orders Panel Runtime Error:", err);
        tbody.innerHTML = `<tr><td colspan="8" style="padding: 40px; text-align: center; color: red;">FAILED TO EXTRACT PIPELINE HISTORY.</td></tr>`;
    }
}

async function processQuickSettlement(orderId, statusMode) {
    try {
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        if (!activeDatabaseClient) return;

        const { error } = await activeDatabaseClient
            .from('orders')
            .update({ 
                status: 'delivered', 
                settlement_status: statusMode 
            })
            .eq('id', String(orderId));

        if (error) throw error;
        fetchAndDisplayOrders(currentActiveView);
    } catch (err) {
        console.error("Settlement Error:", err);
    }
}

function toggleOrderManifestCompartment(orderId) {
    const targetRow = document.getElementById(`manifest-row-${orderId}`);
    const actionBtn = document.getElementById(`toggle-btn-${orderId}`);
    if (!targetRow || !actionBtn) return;

    if (targetRow.style.display === 'none') {
        targetRow.style.display = 'table-row';
        actionBtn.textContent = '−';
        actionBtn.style.background = '#000';
        actionBtn.style.color = '#fff';
    } else {
        targetRow.style.display = 'none';
        actionBtn.textContent = '+';
        actionBtn.style.background = 'none';
        actionBtn.style.color = '#000';
    }
}

async function triggerManualShipTransition(orderId) {
    try {
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        const { error } = await activeDatabaseClient.from('orders').update({ status: 'shipped' }).eq('id', String(orderId));
        if (error) throw error;
        fetchAndDisplayOrders(currentActiveView);
    } catch(err) {
        alert("Pipeline state shift failed: " + err.message);
    }
}

// FIXED: Order cancellation state handler
async function triggerOrderCancellation(orderId) {
    const confirmCancel = confirm(`Are you sure you want to cancel Order Reference #${orderId}?`);
    if (!confirmCancel) return;

    try {
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        const { error } = await activeDatabaseClient
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', String(orderId));

        if (error) throw error;
        fetchAndDisplayOrders(currentActiveView);
    } catch(err) {
        alert("Cancellation processing failed: " + err.message);
    }
}

window.printWaybillDirect = async function(orderIdString) {
    // 1. Parameter guard clause
    if (!orderIdString || typeof orderIdString !== 'string') {
        console.error("[ATELIER ENGINE] Invalid type passed to print pipeline:", orderIdString);
        return alert("System Error: Cannot print manifest without a valid tracking string identifier.");
    }

    // 2. Open pop-up instantly to avoid generic browser security blockades
    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) return alert("Popup blocked! Please allow popups for the warehouse print engine.");
    
    // Write dynamic placeholder state while database loads
    printWindow.document.write(`
        <html><body>
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; text-align:center; margin-top:150px; font-size:11px; letter-spacing:3px; color:#555;">
                ⏳ LOADING SECURE ATELIER MANIFEST LOGS REFRESH...
            </div>
        </body></html>
    `);

    try {
        // 3. Resolve active database client interface
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        if (!activeDatabaseClient) {
            throw new Error("Supabase context instance offline or unreachable from global execution framework.");
        }

        const cleanSearchKey = orderIdString.replace('#', '').trim();

        // 4. Query Database by Primary ID sequence
        let { data: orderDataRecord, error } = await activeDatabaseClient
            .from('orders')
            .select('*')
            .eq('id', cleanSearchKey)
            .maybeSingle();

        // Fallback secondary lookup via tracking_number column if primary query returns void
        if (error || !orderDataRecord) {
            const fallback = await activeDatabaseClient
                .from('orders')
                .select('*')
                .eq('tracking_number', cleanSearchKey)
                .maybeSingle();
            if (fallback.data) {
                orderDataRecord = fallback.data;
            }
        }

        if (!orderDataRecord) {
            throw new Error(`Reference record #${cleanSearchKey} not found in database registry rows.`);
        }

        // 5. Deconstruct structures safely for view pipeline rendering
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

        const cleanOrderIdString = String(orderDataRecord.id || orderDataRecord.tracking_number || '').trim();
        const vercelVerificationUrl = `https://seller-center-nu.vercel.app/verify-delivery.html?id=${cleanOrderIdString}`;
        const qrEngineSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vercelVerificationUrl)}`;

        // 6. Overwrite layout wrapper canvas completely with production view template
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>ATELIER WAYBILL - #${cleanOrderIdString.substring(0,8).toUpperCase()}</title>
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
                            <strong>WAYBILL REFERENCE:</strong> <span style="font-family:monospace; font-weight:bold;">#${cleanOrderIdString.toUpperCase()}</span><br>
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
        console.error("[ATELIER PRINT ERROR]", err);
        alert("Print Pipeline Failure: " + err.message);
    }
};

/**
 * LOGISTICS REGISTRY COURIER BARCODE INPUT EVENT HANDLER
 */
async function executeLogisticsBarcodeScan() {
    const inputElement = document.getElementById('scanner-waybill-input');
    const feedbackElement = document.getElementById('scanner-feedback-msg');
    
    if (!inputElement || !feedbackElement) return;

    const rawInput = inputElement.value.trim().toUpperCase();
    const cleanReferenceKey = rawInput.replace('#', '');

    if (!cleanReferenceKey) {
        feedbackElement.style.color = '#ca5151';
        feedbackElement.innerText = '❌ ERROR: PLEASE SCAN A VALID QR CODE OR ENTER A TRACKING REFERENCE ID.';
        return;
    }

    feedbackElement.style.color = '#000';
    feedbackElement.innerText = '⏳ VERIFYING DELIVERY ROUTE IN DATABASE CHANNELS...';

    try {
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase || window.supabaseClient;
        if (!activeDatabaseClient) {
            feedbackElement.style.color = '#ca5151';
            feedbackElement.innerText = '❌ DATABASE CONNECTION OFFLINE.';
            return;
        }

        const { data, error } = await activeDatabaseClient
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', cleanReferenceKey)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            feedbackElement.style.color = '#ca5151';
            feedbackElement.innerText = `❌ VERIFICATION FAILED: REF #${cleanReferenceKey} NOT FOUND IN ACTIVE TRANSIT LOGS.`;
            return;
        }

        feedbackElement.style.color = '#155724';
        feedbackElement.innerText = `✅ SUCCESS: ORDER #${cleanReferenceKey} ROUTE VERIFIED. ROUTED TO DELIVERED TAB FOR SETTLEMENT AUDIT.`;
        
        inputElement.value = '';
        inputElement.focus();

        if (typeof fetchAndDisplayOrders === 'function') {
            await fetchAndDisplayOrders(currentActiveView);
        }

    } catch (err) {
        console.error("Logistics Verification Runtime Exception:", err);
        feedbackElement.style.color = '#ca5151';
        feedbackElement.innerText = '❌ RUNTIME EXCEPTION SECURING COURIER MANIFEST ATTEMPT.';
    }
}

// Global scope initialization binding maps (Removes conflicting re-declarations)
window.renderOrdersSection = renderOrdersSection;
window.fetchAndDisplayOrders = fetchAndDisplayOrders;
window.toggleOrderManifestCompartment = toggleOrderManifestCompartment;
window.triggerManualShipTransition = triggerManualShipTransition;
window.triggerOrderCancellation = triggerOrderCancellation;
window.executeLogisticsBarcodeScan = executeLogisticsBarcodeScan;
window.processQuickSettlement = processQuickSettlement;