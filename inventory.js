// =========================================================================
// INVENTORY.JS - THE ATELIER LIVE INVENTORY & CATALOG MANAGEMENT SYSTEM
// =========================================================================

// Global memory caching & pagination layer
let cachedProductsList = [];
let targetEditingProductId = null; 

// Pagination State Variables
let currentInventoryPage = 1;
const itemsPerPage = 7; 

async function renderInventorySection() {
    const stage = document.getElementById('content-stage');
    if (!stage) return;

    // High-Contrast Dual Workspace Interface
    stage.innerHTML = `
        <div style="padding: 40px; animation: fadeIn 0.4s ease-out; max-width: 1400px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: 450px 1fr; gap: 40px; align-items: start;">
                
                <div style="background: #fff; border: 1px solid #000; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <h2 id="form-action-title" style="letter-spacing: 4px; font-size: 13px; margin: 0 0 25px 0; text-transform: uppercase; font-weight: bold;">
                        + New Collection Entry
                    </h2>
                    
                    <form id="multi-upload-form" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Product Title</label>
                            <input type="text" id="p-title" required style="width: 100%; padding: 12px; border: 1px solid #000; box-sizing: border-box; font-size: 12px;">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Price (₦)</label>
                                <input type="number" id="p-price" required style="width: 100%; padding: 12px; border: 1px solid #000; box-sizing: border-box; font-size: 12px;">
                            </div>
                            <div>
                                <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Stock Level</label>
                                <input type="number" id="p-stock" required value="1" style="width: 100%; padding: 12px; border: 1px solid #000; box-sizing: border-box; font-size: 12px;">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Collection Category</label>
                                <select id="p-category" style="width: 100%; padding: 12px; border: 1px solid #000; background: white; font-size: 11px; font-weight: bold;">
                                    <option value="ready-to-wear">READY TO WEAR</option>
                                    <option value="bespoke">BESPOKE / COUTURE</option>
                                    <option value="accessories">ACCESSORIES</option>
                                    <option value="footwear">FOOTWEAR</option>
                                    <option value="slide">SLIDE SLIPPERS</option>
                                    <option value="clothing">CLOTHING</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Availability Status</label>
                                <select id="p-status" style="width: 100%; padding: 12px; border: 1px solid #000; background: white; font-size: 11px; font-weight: bold;">
                                    <option value="active">ACTIVE SHOWROOM</option>
                                    <option value="hidden">ARCHIVED / HIDDEN</option>
                                    <option value="sold-out">SOLD OUT</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Search Tags (Comma-separated)</label>
                            <input type="text" id="p-tag" placeholder="luxury, summer, velvet" style="width: 100%; padding: 12px; border: 1px solid #000; box-sizing: border-box; font-size: 12px;">
                        </div>

                        <div>
                            <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">The Story / Main Description</label>
                            <textarea id="p-desc" style="width: 100%; height: 70px; padding: 12px; border: 1px solid #000; box-sizing: border-box; font-size: 12px; resize: none; font-family: inherit;"></textarea>
                        </div>

                        <div>
                            <label style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color:#666; text-transform:uppercase; display:block; margin-bottom:5px;">Product Highlights (New line per point)</label>
                            <textarea id="p-highlights" placeholder="- 100% Premium Cotton&#10;- Hand-stitched in Lagos" style="width: 100%; height: 80px; padding: 12px; border: 1px solid #000; border-left: 3px solid #000; box-sizing: border-box; font-size: 11px; line-height:1.4; font-family: inherit;"></textarea>
                        </div>

                        <div style="border: 1px dashed #000; padding: 20px; text-align: center; background: #fafafa;">
                            <label for="p-files" style="cursor: pointer; letter-spacing: 1px; font-size: 10px; font-weight: bold; display: block;">
                                UPLOAD GALLERY IMAGES
                            </label>
                            <input type="file" id="p-files" multiple accept="image/*" style="display: none;">
                            <div id="image-preview-zone" style="display: flex; gap: 8px; margin-top: 15px; justify-content: center; flex-wrap: wrap;"></div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 5px;">
                            <button type="submit" id="publish-btn" style="flex: 1; background: #000; color: #fff; padding: 16px; border: none; letter-spacing: 2px; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase;">
                                Publish to Atelier
                            </button>
                            <button type="button" id="cancel-edit-btn" style="display: none; background: #eee; color: #000; padding: 16px; border: 1px solid #000; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase;" onclick="clearInventoryFormState()">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                <div style="background: #fff; border: 1px solid #000; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                        <h3 style="letter-spacing: 4px; font-size: 13px; margin: 0; text-transform: uppercase; font-weight: bold;">
                            Live Showroom Inventory Stock
                        </h3>
                        <div id="inventory-counter-badge" style="font-size: 10px; font-weight: bold; letter-spacing: 1px; background: #000; color: #fff; padding: 4px 10px; border-radius: 20px;">
                            Syncing...
                        </div>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #000; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #555;">
                                    <th style="padding: 12px 10px; width: 60px;">Image</th>
                                    <th style="padding: 12px 10px;">Item Details</th>
                                    <th style="padding: 12px 10px; width: 90px;">Stock</th>
                                    <th style="padding: 12px 10px; width: 140px;">Live Price (₦)</th>
                                    <th style="padding: 12px 10px; width: 140px; text-align: center;">Controls</th>
                                </tr>
                            </thead>
                            <tbody id="inventory-table-body">
                                <tr>
                                    <td colspan="5" style="padding: 40px; text-align: center; color: #888; letter-spacing: 1px;">
                                        Establishing connection to live showroom tables...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="inventory-pagination-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;"></div>
                </div>

            </div>
        </div>
    `;

    document.getElementById('p-files').addEventListener('change', function() {
        const zone = document.getElementById('image-preview-zone');
        zone.innerHTML = '';
        Array.from(this.files).forEach(file => {
            const url = URL.createObjectURL(file);
            zone.innerHTML += `<img src="${url}" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid #000;">`;
        });
    });

    document.getElementById('multi-upload-form').addEventListener('submit', handleFormInventorySubmission);

    currentInventoryPage = 1;
    syncVendorInventory();
}

// --- PULL LIVE INVENTORY DATA FROM SUPABASE ---
async function syncVendorInventory() {
    const tableBody = document.getElementById('inventory-table-body');
    const counterBadge = document.getElementById('inventory-counter-badge');
    const activeDatabaseClient = window.db;

    if (!activeDatabaseClient) {
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="color:red; padding:20px; text-align:center;">Database Link Offline</td></tr>`;
        return;
    }

    const { data: records, error } = await activeDatabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Showroom Table Fetch Error:", error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="color:red; padding:20px; text-align:center;">Sync Fault: ${error.message}</td></tr>`;
        return;
    }

    cachedProductsList = records || [];
    if (counterBadge) counterBadge.innerText = `${cachedProductsList.length} PIECES`;

    buildInventoryTableRows();
}

// --- RENDERS THE PAGINATED SLICE OF DATA ROW TILES ---
function buildInventoryTableRows() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    if (cachedProductsList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="padding:40px; text-align:center; color:#888;">No active collection items found inside showroom database.</td></tr>`;
        document.getElementById('inventory-pagination-controls').innerHTML = '';
        return;
    }

    const totalPagesCount = Math.ceil(cachedProductsList.length / itemsPerPage);
    if (currentInventoryPage > totalPagesCount) currentInventoryPage = totalPagesCount;
    if (currentInventoryPage < 1) currentInventoryPage = 1;

    const startIndex = (currentInventoryPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedProductsPage = cachedProductsList.slice(startIndex, endIndex);

    tableBody.innerHTML = slicedProductsPage.map(product => {
        // --- SECURE SCHEMATIC EXTRACTOR FOR IMAGES COLUMN ---
        let displayImg = '';
        let rawImagesSource = product.images || product.image;

        if (Array.isArray(rawImagesSource) && rawImagesSource.length > 0) {
            displayImg = rawImagesSource[0];
        } else if (typeof rawImagesSource === 'string' && rawImagesSource.trim() !== '') {
            displayImg = rawImagesSource;
        }

        // ABSOLUTE FALLBACK CONTROL: If it doesn't point to a real external URL, use a hosted placeholder 
        // to prevent local Live Server 404 loop spam.
        if (!displayImg || !displayImg.startsWith('http')) {
            displayImg = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&auto=format&fit=crop&q=60';
        }

        let statusStyle = "color: #000; font-weight: bold;";
        if (product.status === 'sold-out') statusStyle = "color: #cc0000; font-weight: bold;";
        if (product.status === 'hidden') statusStyle = "color: #888; font-style: italic;";

        return `
            <tr style="border-bottom: 1px solid #eee; transition: background 0.2s;">
                <td style="padding: 12px 10px; vertical-align: middle;">
                    <img src="${displayImg}" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid #000; background:#f5f5f5;" onerror="this.src='https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&auto=format&fit=crop&q=60'">
                </td>
                
                <td style="padding: 12px 10px; vertical-align: middle;">
                    <div style="font-weight: bold; text-transform: uppercase; font-size:12px; color:#000;">${product.title || 'UNTITLED PIECE'}</div>
                    <div style="font-size: 9px; color:#555; text-transform: uppercase; letter-spacing: 0.5px; margin-top:3px; display: flex; gap: 10px;">
                        <span>Category: <strong style="color:#000;">${product.category || 'READY TO WEAR'}</strong></span>
                        <span>Status: <strong style="${statusStyle}">${product.status || 'ACTIVE'}</strong></span>
                    </div>
                    ${product.tags ? `<div style="font-size:9px; color:#888; margin-top:2px;">Tags: ${product.tags}</div>` : ''}
                </td>

                <td style="padding: 12px 10px; vertical-align: middle;">
                    <input type="number" id="inline-stock-${product.id}" value="${product.stock ?? 0}" 
                        style="width: 60px; padding: 6px; border: 1px solid #000; font-weight:bold; font-size:12px; text-align:center;"
                        onchange="saveInlineStockUpdate('${product.id}')">
                </td>
                
                <td style="padding: 12px 10px; vertical-align: middle;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span style="font-size:11px; font-weight:bold; color:#666;">₦</span>
                        <input type="number" id="inline-price-${product.id}" value="${product.price || 0}" 
                            style="width: 100%; padding: 6px; border: 1px solid #000; font-family:monospace; font-weight:bold; font-size:12px;"
                            onchange="saveInlinePriceUpdate('${product.id}')">
                    </div>
                </td>
                
                <td style="padding: 12px 10px; vertical-align: middle; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button onclick="loadProductIntoFormWorkbench('${product.id}')" 
                            style="background: #000; color: #fff; border: none; padding: 6px 12px; font-size: 9px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;">
                            Edit Full
                        </button>
                        <button onclick="deleteProductFromShowroom('${product.id}')" 
                            style="background: #fff; color: #cc0000; border: 1px solid #cc0000; padding: 6px 12px; font-size: 9px; font-weight: bold; letter-spacing: 1px; cursor: pointer; text-transform: uppercase;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPaginationFooterControls(totalPagesCount);
}

function renderPaginationFooterControls(totalPages) {
    const controlsContainer = document.getElementById('inventory-pagination-controls');
    if (!controlsContainer) return;

    const startNum = ((currentInventoryPage - 1) * itemsPerPage) + 1;
    const endNum = Math.min(currentInventoryPage * itemsPerPage, cachedProductsList.length);

    controlsContainer.innerHTML = `
        <div style="font-size: 11px; color: #666; font-weight: 500;">
            Showing <strong>${startNum}-${endNum}</strong> of <strong>${cachedProductsList.length}</strong> luxury entries
        </div>
        <div style="display: flex; gap: 5px; align-items: center;">
            <button onclick="changeInventoryPageTrack(${currentInventoryPage - 1})" ${currentInventoryPage === 1 ? 'disabled' : ''} 
                style="background: ${currentInventoryPage === 1 ? '#f5f5f5' : '#000'}; color: ${currentInventoryPage === 1 ? '#aaa' : '#fff'}; border: none; padding: 8px 14px; font-size: 10px; font-weight: bold; cursor: ${currentInventoryPage === 1 ? 'not-allowed' : 'pointer'}; text-transform: uppercase; letter-spacing:1px;">
                PREV
            </button>
            
            <div style="font-family: monospace; font-weight: bold; font-size: 12px; padding: 0 15px; color: #000;">
                PAGE ${currentInventoryPage} / ${totalPages}
            </div>

            <button onclick="changeInventoryPageTrack(${currentInventoryPage + 1})" ${currentInventoryPage === totalPages ? 'disabled' : ''} 
                style="background: ${currentInventoryPage === totalPages ? '#f5f5f5' : '#000'}; color: ${currentInventoryPage === totalPages ? '#aaa' : '#fff'}; border: none; padding: 8px 14px; font-size: 10px; font-weight: bold; cursor: ${currentInventoryPage === totalPages ? 'not-allowed' : 'pointer'}; text-transform: uppercase; letter-spacing:1px;">
                NEXT
            </button>
        </div>
    `;
}

window.changeInventoryPageTrack = function(targetPage) {
    currentInventoryPage = targetPage;
    buildInventoryTableRows();
    document.getElementById('inventory-table-body').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// --- POPULATE FORMS WITH CHOSEN SHOWROOM DATA ---
window.loadProductIntoFormWorkbench = function(productId) {
    const product = cachedProductsList.find(p => p.id.toString() === productId.toString());
    if (!product) return;

    targetEditingProductId = product.id;

    document.getElementById('form-action-title').innerText = `✏️ Edit: ${product.title}`;
    document.getElementById('publish-btn').innerText = "SAVE REVISIONS";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";

    document.getElementById('p-title').value = product.title || '';
    document.getElementById('p-price').value = product.price || '';
    document.getElementById('p-stock').value = product.stock ?? 1;
    document.getElementById('p-category').value = (product.category || 'ready-to-wear').toLowerCase().trim();
    document.getElementById('p-status').value = product.status || 'active';
    document.getElementById('p-tag').value = product.tags || '';

    const fullDesc = product['description '] || product.description || '';
    if (fullDesc.includes('--- ATELIER SPECIFICATIONS ---')) {
        const parts = fullDesc.split('--- ATELIER SPECIFICATIONS ---');
        document.getElementById('p-desc').value = parts[0].trim();
        document.getElementById('p-highlights').value = parts[1].trim();
    } else {
        document.getElementById('p-desc').value = fullDesc;
        document.getElementById('p-highlights').value = '';
    }

    const previewZone = document.getElementById('image-preview-zone');
    let existingImg = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&auto=format&fit=crop&q=60';
    let rawImagesSource = product.images || product.image;

    if (Array.isArray(rawImagesSource) && rawImagesSource.length > 0) {
        existingImg = rawImagesSource[0];
    } else if (typeof rawImagesSource === 'string' && rawImagesSource.trim() !== '') {
        existingImg = rawImagesSource;
    }

    previewZone.innerHTML = `<img src="${existingImg}" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid #000; opacity: 0.6;" onerror="this.style.display='none';">`;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function clearInventoryFormState() {
    targetEditingProductId = null;
    document.getElementById('form-action-title').innerText = "+ New Collection Entry";
    document.getElementById('publish-btn').innerText = "PUBLISH TO ATELIER";
    document.getElementById('cancel-edit-btn').style.display = "none";
    document.getElementById('multi-upload-form').reset();
    document.getElementById('image-preview-zone').innerHTML = '';
}

window.saveInlinePriceUpdate = async function(productId) {
    const inputField = document.getElementById(`inline-price-${productId}`);
    if (!inputField) return;

    const newPriceValue = parseFloat(inputField.value);
    if (isNaN(newPriceValue) || newPriceValue < 0) return;

    const activeDatabaseClient = window.db;
    if (!activeDatabaseClient) return;

    const { error } = await activeDatabaseClient
        .from('products')
        .update({ price: newPriceValue })
        .eq('id', productId);

    if (error) {
        alert("Failed to update price: " + error.message);
    } else {
        inputField.style.background = "#fffdd0";
        setTimeout(() => { inputField.style.background = "#fff"; }, 600);
        const cachedItem = cachedProductsList.find(p => p.id.toString() === productId.toString());
        if (cachedItem) cachedItem.price = newPriceValue;
    }
};

window.saveInlineStockUpdate = async function(productId) {
    const inputField = document.getElementById(`inline-stock-${productId}`);
    if (!inputField) return;

    const newStockValue = parseInt(inputField.value);
    if (isNaN(newStockValue) || newStockValue < 0) return;

    const activeDatabaseClient = window.db;
    if (!activeDatabaseClient) return;

    const { error } = await activeDatabaseClient
        .from('products')
        .update({ stock: newStockValue })
        .eq('id', productId);

    if (error) {
        alert("Failed to update stock: " + error.message);
    } else {
        inputField.style.background = "#fffdd0";
        setTimeout(() => { inputField.style.background = "#fff"; }, 600);
        const cachedItem = cachedProductsList.find(p => p.id.toString() === productId.toString());
        if (cachedItem) cachedItem.stock = newStockValue;
    }
};

// --- AUTOMATED FILE UPLOAD & CATLOG FORM SUBMISSION ROUTINE ---
async function handleFormInventorySubmission(event) {
    event.preventDefault();

    const activeDatabaseClient = window.db;
    if (!activeDatabaseClient) {
        alert("Database connection is offline.");
        return;
    }

    // Capture standard form input nodes
    const titleField = document.getElementById('p-title');
    const productTitleInput = titleField ? titleField.value.trim() : "UNNAMED PIECE";

    const priceField = document.getElementById('p-price');
    const priceInput = priceField ? priceField.value.trim() : "0";

    const stockField = document.getElementById('p-stock');
    const stockInput = stockField ? stockField.value.trim() : "1";

    const categorySelect = document.getElementById('p-category');
    const categorySelection = categorySelect ? categorySelect.value : 'ready-to-wear';

    const statusSelect = document.getElementById('p-status');
    const statusSelection = statusSelect ? statusSelect.value : 'active';

    const tagInput = document.getElementById('p-tag');
    const tagsCommaSeparatedString = tagInput ? tagInput.value.trim() : '';

    const descInput = document.getElementById('p-desc');
    const highlightsInput = document.getElementById('p-highlights');

    let finalDescriptionStr = descInput ? descInput.value.trim() : '';
    if (highlightsInput && highlightsInput.value.trim()) {
        finalDescriptionStr += `\n\n--- ATELIER SPECIFICATIONS ---\n${highlightsInput.value.trim()}`;
    }
    const cleanDescriptionText = finalDescriptionStr;

    // Change button state to show real-time upload progress 
    const publishBtn = document.getElementById('publish-btn');
    const originalBtnText = publishBtn.innerText;
    publishBtn.innerText = "UPLOADING ASSETS TO STORAGE...";
    publishBtn.disabled = true;

    let imageArrayUrls = [];

    try {
        // Handle file inputs automatically 
        const fileInputEl = document.getElementById('p-files');
        
        if (fileInputEl && fileInputEl.files.length > 0) {
            const filesToUpload = Array.from(fileInputEl.files);
            
            for (const file of filesToUpload) {
                // Generate a clean, unique filename to avoid overwriting existing bucket assets
                const fileExtension = file.name.split('.').pop();
                const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
                
                // Upload raw file straight into your established Supabase bucket folder
                const { data: storageData, error: storageError } = await activeDatabaseClient
                    .storage
                    .from('product-images')
                    .upload(uniqueFileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (storageError) throw storageError;

                // Extract the permanent public download URL from the successful upload path
                const { data: publicUrlData } = activeDatabaseClient
                    .storage
                    .from('product-images')
                    .getPublicUrl(uniqueFileName);

                if (publicUrlData && publicUrlData.publicUrl) {
                    imageArrayUrls.push(publicUrlData.publicUrl);
                }
            }
        } 
        
        // Retention Fallback Matrix: If no new files were uploaded but we're editing, maintain existing photos
        if (imageArrayUrls.length === 0 && targetEditingProductId) {
            const product = cachedProductsList.find(p => p.id.toString() === targetEditingProductId.toString());
            let rawImagesSource = product ? (product.images || product.image) : null;
            if (rawImagesSource) {
                imageArrayUrls = Array.isArray(rawImagesSource) ? rawImagesSource : [rawImagesSource];
            }
        }

        // Global safeguard placeholder if no image was provided anywhere
        if (imageArrayUrls.length === 0) {
            imageArrayUrls = ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"];
        }

        const productPayload = {
            title: productTitleInput,
            description: cleanDescriptionText,
            price: Number(priceInput), 
            stock: Number(stockInput),
            category: categorySelection,
            status: statusSelection,
            images: imageArrayUrls, // Clean native array containing verified public storage links
            tags: tagsCommaSeparatedString
        };

        if (targetEditingProductId) {
            // Update Existing Product Row
            const { error } = await activeDatabaseClient
                .from('products')
                .update(productPayload)
                .eq('id', targetEditingProductId);

            if (error) throw error;
            alert("Showroom collection item safely modified!");
        } else {
            // Inject Brand New Product Row
            productPayload.created_at = new Date();
            const { error } = await activeDatabaseClient
                .from('products')
                .insert([productPayload]);

            if (error) throw error;
            alert("Luxury collection item added to showroom catalog!");
        }

        clearInventoryFormState();
        syncVendorInventory();

    } catch (err) {
        console.error("Atelier Inventory Sync Fault:", err);
        alert(`Process halted: ${err.message || err}`);
    } finally {
        // Reset interactive execution controls safely
        publishBtn.innerText = originalBtnText;
        publishBtn.disabled = false;
    }
}

// --- DELETE SHOWROOM CATALOG ITEM ---
window.deleteProductFromShowroom = async function(productId) {
    if (!confirm("Are you sure you want to remove this piece? This action is permanent.")) return;

    const activeDatabaseClient = window.db;
    if (!activeDatabaseClient) return;

    const { error } = await activeDatabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        alert("Failed to delete item: " + error.message);
    } else {
        alert("Catalog piece dropped successfully.");
        if (targetEditingProductId && targetEditingProductId.toString() === productId.toString()) {
            clearInventoryFormState();
        }
        syncVendorInventory();
    }
};