// This controller manages which "App" you are looking at
function showSection(section) {
    const stage = document.getElementById('content-stage');
    const title = document.getElementById('section-title');
    
    // Update active state in sidebar
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    
    switch(section) {
        case 'dashboard':
            title.innerText = "OVERVIEW";
            stage.innerHTML = `<h1>Welcome back, Atelier.</h1><p>Your performance at a glance...</p>`;
            break;
        case 'inventory':
            title.innerText = "PRODUCT MANAGEMENT";
            stage.innerHTML = ``;
            break;
        case 'orders':
            title.innerText = "ORDER PIPELINE";
            stage.innerHTML = ``;
            break;
    }
}

// Initial Load
window.onload = () => showSection('dashboard');

// inventory.js - The ATELIER Multi-Image Engine

function renderInventorySection() {
    const stage = document.getElementById('content-stage');
    stage.innerHTML = `
        <div class="inventory-wrapper" style="padding: 40px; animation: fadeIn 0.5s;">
            <div style="background: #fff; border: 1px solid #000; padding: 40px;">
                <h2 style="letter-spacing: 5px; font-size: 14px; margin-bottom: 30px;">+ NEW COLLECTION ENTRY</h2>
                
                <form id="multi-upload-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <input type="text" id="p-name" placeholder="PIECE TITLE" required class="noir-input">
                    <input type="number" id="p-price" placeholder="VALUATION (₦)" required class="noir-input">
                    
                    <select id="p-category" class="noir-input" style="grid-column: span 2;">
                        <option value="ready-to-wear">READY TO WEAR</option>
                        <option value="bespoke">BESPOKE / COUTURE</option>
                        <option value="accessories">ACCESSORIES</option>
                    </select>

                    <textarea id="p-desc" placeholder="THE STORY / DESCRIPTION" class="noir-input" style="grid-column: span 2; height: 100px;"></textarea>

                    <div style="grid-column: span 2; border: 2px dashed #eee; padding: 30px; text-align: center;">
                        <label for="p-files" style="cursor: pointer; letter-spacing: 2px; font-size: 11px;">
                            CLICK TO UPLOAD GALLERY (MULTIPLE)
                        </label>
                        <input type="file" id="p-files" multiple accept="image/*" style="display: none;">
                        <div id="image-preview-zone" style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;"></div>
                    </div>

                    <button type="submit" id="publish-btn" class="noir-btn-wide">PUBLISH TO ATELIER</button>
                </form>
            </div>
        </div>
    `;

    // Handle Image Previews (UX)
    document.getElementById('p-files').addEventListener('change', function(e) {
        const zone = document.getElementById('image-preview-zone');
        zone.innerHTML = '';
        Array.from(this.files).forEach(file => {
            const url = URL.createObjectURL(file);
            zone.innerHTML += `<img src="${url}" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid #000;">`;
        });
    });

    setupUploadLogic();
}

async function setupUploadLogic() {
    const form = document.getElementById('multi-upload-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('publish-btn');
        const files = document.getElementById('p-files').files;
        
        if (files.length === 0) return alert("Select images first.");

        btn.innerText = "PUBLISHING...";
        btn.disabled = true;

        try {
            let uploadedUrls = [];
            for (let file of files) {
                const path = `collection/${Date.now()}-${file.name}`;
                const { error: uploadErr } = await window.db.storage
                    .from('product-images').upload(path, file);
                if (uploadErr) throw uploadErr;
                const { data } = window.db.storage.from('product-images').getPublicUrl(path);
                uploadedUrls.push(data.publicUrl);
            }

            // WE ARE MERGING INTO PLAIN TEXT HERE
            const storyText = document.getElementById('p-desc').value;
            const highlightsText = document.getElementById('p-highlights').value;
            
            // Format it neatly for the "Text" column
            const plainTextDescription = `STORY:\n${storyText}\n\nHIGHLIGHTS:\n${highlightsText}`;

            const { error: dbErr } = await window.db.from('products').insert([{
                title: document.getElementById('p-name').value,
                price: parseFloat(document.getElementById('p-price').value),
                description: plainTextDescription, // Sent as simple text
                category: document.getElementById('p-category').value,
                images: uploadedUrls,
                status: 'active'
            }]);

            if (dbErr) throw dbErr;

            alert("ATELIER PIECE PUBLISHED.");
            renderInventorySection();

        } catch (err) {
            alert("Error: " + err.message);
            btn.disabled = false;
            btn.innerText = "PUBLISH TO ATELIER";
        }
    });
}



// --- 3. LOGISTICS & WAYBILL ---
async function generateWaybill(orderId) {
    const { data: order, error } = await window.db
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) return alert("Order not found");

    // Populate Print Template
    document.getElementById('wb-tracking').innerText = order.tracking_number || "T-000";
    document.getElementById('wb-order').innerText = order.id;
    document.getElementById('wb-customer').innerText = order.customer_email;
    document.getElementById('wb-region').innerText = order.shipping_region;

    // FIX: Clear and generate ONE QR code
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = ""; 
    new QRCode(qrContainer, {
        text: `https://atelier-shop-psi.vercel.app/logistics.html?id=${order.id}`,
        width: 140,
        height: 140
    });

    // Print
    const printArea = document.getElementById('waybill-print-area');
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';

    // Update Status
    await supabase.from('orders').update({ status: 'ready_to_ship' }).eq('id', orderId);
    activateLiveDashboard(); // Refresh
}

// --- 4. INITIALIZE ---
document.addEventListener('DOMContentLoaded', activateLiveDashboard);