import { supabase } from './supabaseClient.js';

// =========================================================================
// --- 1. GLOBAL SYSTEM STATE MEMORY & RUNTIME MATRIX ---
// =========================================================================
let allProducts = [];          // Stores your collection data from Supabase
let currentPage = 1;           // Tracks active viewing page frame
let itemsPerPage = 17;          // Controls how many luxury pieces show at once

window.atelierMemoryCart = window.atelierMemoryCart || [];
window.activeOrderSnapshot = window.activeOrderSnapshot || [];

// Read safe initialization layers instantly from persistent storage
(function initialAtelierSync() {
    try {
        const storedData = localStorage.getItem('cart');
        if (storedData) {
            window.atelierMemoryCart = JSON.parse(storedData);
        }
    } catch (e) {
        console.warn("Atelier Context Memory: Local storage isolated. Running on active cache.");
    }
})();

// =========================================================================
// --- 2. DATA ACQUISITION & INTEGRATION LAYER ---
// =========================================================================
async function fetchAtelierProducts() {
    console.log("Atelier System Core: Initializing Supabase secure download sequence...");
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Core Sync Interrupted:', error);
        return;
    }

    if (data && data.length > 0) {
        allProducts = data;
        console.log(`Atelier System Core: ${allProducts.length} premium pieces loaded.`);
        renderProducts(allProducts);
    } else {
        console.warn("Atelier System Core: Supabase table loaded empty. Generating design fallback frame.");
        // Internal placeholder matches luxury presentation schema rules
        allProducts = [{
            id: "fallback_01",
            title: "ATELIER LUXURY OVERCOAT",
            price: 125000,
            category: "clothing",
            images: ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"],
            status: "active",
            stock: 5,
            description: "STORY:\nCrafted for elite silhouettes.\n\nHIGHLIGHTS:\nPremium Custom Cotton\nHandmade in Lagos"
        }];
        renderProducts(allProducts);
    }
}

// =========================================================================
// --- 3. UNIFIED HIGH-CONTRAST PRODUCT RENDERING ENGINE (MOBILE OPTIMIZED) ---
// =========================================================================
function renderProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    // Updated Grid Rules: Standard layout switches to a clean 2-column pattern on mobile down to 160px
    productGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 25px 15px;
        width: 100%;
        box-sizing: border-box;
        padding: 0 10px;
    `;
    productGrid.innerHTML = '';

    const activeShowroomProducts = products.filter(p => p.status !== 'hidden');
    const totalItemsCount = activeShowroomProducts.length;
    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = activeShowroomProducts.slice(startIndex, endIndex);

    const editorialAdvertPool = [
        {
            subtitle: 'BESPOKE SERVICE',
            title: 'THE COUTURE ATELIER',
            text: 'Private measurements and hand-tailored curation for elite silhouettes. Available by direct salon booking only.',
            actionText: 'SCHEDULE CONSULTATION'
        },
        {
            subtitle: 'PRODUCTION LEGACY',
            title: 'HANDMADE IN LAGOS',
            text: 'Every garment passes through rigorous structural validation, finishing standards.',
            actionText: 'EXPLORE OUR STORY'
        }
    ];

    let advertIndex = 0;

    paginatedItems.forEach((product, loopIndex) => {
        
        // Dynamic Editorial Billboard Trigger
        if (loopIndex > 0 && loopIndex % 4 === 0) {
            const adData = editorialAdvertPool[advertIndex % editorialAdvertPool.length];
            advertIndex++;

            const adCard = document.createElement('div');
            adCard.className = 'atelier-product-card atelier-editorial-billboard';
            adCard.style.cssText = "background:#000; color:#fff; padding:25px 15px; display:flex; flex-direction:column; justify-content:space-between; border:1px solid #222; min-height:320px; box-sizing:border-box; text-align:center;";
            adCard.innerHTML = `
                <div style="margin: auto 0; display: flex; flex-direction: column; gap: 15px;">
                    <span style="font-size: 8px; letter-spacing: 2px; color: #888; text-transform: uppercase; font-weight: bold;">${adData.subtitle}</span>
                    <h2 style="font-size: 15px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; margin: 0; line-height: 1.3; color:#fff;">${adData.title}</h2>
                    <div style="width: 20px; height: 1px; background: #fff; margin: 5px auto;"></div>
                    <p style="font-size: 10px; font-weight: 300; line-height: 1.5; color: #ccc; margin: 0 auto; max-width: 100%;">${adData.text}</p>
                </div>
                <button type="button" onclick="openBespokeModal()" style="width:100%; background:#fff; color:#000; padding:10px; border:none; font-size:9px; font-weight:bold; letter-spacing:1px; cursor:pointer; text-transform:uppercase; margin-top: 15px;">${adData.actionText}</button>
            `;
            productGrid.appendChild(adCard);
        }

        const productTitle = product.title || product.name || "ATELIER PIECE";
        const productPrice = product.price || 0; 
        const rawDescription = product.description || '';
        const originalPrice = product.original_price || Math.round(productPrice * 1.35); 
        const discountPercentage = Math.round(((originalPrice - productPrice) / originalPrice) * 100);

        // --- SAFE DATA TYPE EXTRACTOR SYSTEM ---
        let imageArray = [];
        let rawSource = product.images || product.image;

        if (Array.isArray(rawSource) && rawSource.length > 0) {
            imageArray = rawSource;
        } else if (typeof rawSource === 'string' && rawSource.trim() !== '' && rawSource !== '[]') {
            try {
                // Try parsing structural array variations
                let cleanStr = rawSource.trim();
                if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
                    imageArray = JSON.parse(cleanStr);
                } else {
                    imageArray = [cleanStr];
                }
            } catch(e) { 
                imageArray = [rawSource.replace(/[\[\]\"]/g, '').trim()]; 
            }
        }

        // Clean out broken fallbacks
        imageArray = imageArray.filter(imgUrl => imgUrl && !imgUrl.includes('fashion.jpg') && imgUrl.startsWith('http'));

        // If the product still has an empty array list, use a clean live asset placeholder
        if (imageArray.length === 0) {
            imageArray = ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600'];
        }
        
        const mainImageUrl = imageArray[0];
        const secondaryImageUrl = imageArray[1] || mainImageUrl;

        let sizeOptions = '';
        const category = (product.category || '').toLowerCase();

        if (category.includes('slide') || category.includes('footwear') || category.includes('shoe')) {
            sizeOptions = `<option value="40">40</option><option value="41">41</option><option value="42" selected>42</option><option value="43">43</option><option value="44">44</option><option value="45">45</option>`;
        } else {
            sizeOptions = `<option value="S">S</option><option value="M" selected>M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>`;
        }

        const sizeHTML = `
            <select id="size-select-${product.id}" class="atelier-size-select" style="background:#000; color:#fff; border:1px solid #333; padding:8px; font-size:10px; width:100%; margin-top:4px; text-transform:uppercase; height:36px; -webkit-appearance:none; border-radius:0; box-sizing:border-box;">
                ${sizeOptions}
            </select>`;

        const isSoldOut = product.status === 'sold-out' || (product.stock !== undefined && product.stock <= 0);
        
        const actionButtonHTML = isSoldOut 
            ? `<button type="button" class="luxury-add-trigger" disabled style="background:#222; color:#555; border:1px solid #222; width:100%; padding:10px; font-size:9px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:6px; cursor:not-allowed; box-sizing:border-box;">ARCHIVE</button>`
            : `<button type="button" class="luxury-add-trigger" style="width:100%; background:#fff; color:#000; border:1px solid #fff; padding:10px; font-size:9px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:6px; cursor:pointer; box-sizing:border-box;">ADD TO BAG</button>`;

        let premiumLabelHTML = '';
        if (isSoldOut) {
            premiumLabelHTML = '<span style="position:absolute; top:8px; left:8px; background:#000; color:#fff; border:1px solid #fff; font-size:8px; padding:3px 6px; font-weight:bold; letter-spacing:1px; z-index:10; display:inline-block; text-transform:uppercase;">ARCHIVE</span>';
        } else if (product.stock <= 2) {
            premiumLabelHTML = '<span style="position:absolute; top:8px; left:8px; background:#fff; color:#000; font-size:8px; padding:3px 6px; font-weight:bold; letter-spacing:1px; z-index:10; display:inline-block; text-transform:uppercase;">LIMITED</span>';
        } else {
            premiumLabelHTML = '<span style="position:absolute; top:8px; left:8px; background:#fff; color:#000; font-size:8px; padding:3px 6px; font-weight:bold; letter-spacing:1px; z-index:10; display:inline-block; text-transform:uppercase;">SPECIAL RELEASE</span>';
        }

        const productCard = document.createElement('div');
        productCard.className = 'atelier-product-card'; 
        productCard.setAttribute('data-product-id', product.id); 
        productCard.style.cssText = "display:flex; flex-direction:column; width:100%; box-sizing:border-box;";

        productCard.innerHTML = `
            <div class="product-image-wrapper" style="position:relative; overflow:hidden; aspect-ratio:3/4; background:#111; cursor:pointer; width:100%;">
                <img src="${mainImageUrl}" alt="${productTitle}" class="product-main-img" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.4s ease;" onerror="this.src='https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600'">
                ${premiumLabelHTML}
            </div>
            <div class="product-info-wrapper" style="padding:10px 0 0 0; display:flex; flex-direction:column; gap:3px; width:100%; box-sizing:border-box;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; width:100%;">
                    <h4 style="margin:0; font-size:8px; letter-spacing:1px; color:#666; text-transform:uppercase;">ATELIER</h4>
                    ${discountPercentage > 0 && !isSoldOut ? `<span style="font-size: 7px; font-weight: bold; color:#c9a054;">VALUE (-${discountPercentage}%)</span>` : ''}
                </div>
                <h3 class="product-item-name" style="margin:0; font-size:12px; font-weight:400; letter-spacing:0.5px; color:#ffffff; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${productTitle}</h3>
                
                <div class="luxury-price-row" style="display:flex; align-items:center; gap:6px; margin: 1px 0; width:100%;">
                    <span class="current-price" style="font-size:12px; font-weight:700; font-family:monospace; color:#ffffff;">₦${Number(productPrice).toLocaleString()}</span>
                    ${discountPercentage > 0 && !isSoldOut ? `<span style="font-size:10px; font-family:monospace; color:#555555; text-decoration:line-through;">₦${Number(originalPrice).toLocaleString()}</span>` : ''}
                </div>
                ${sizeHTML}
                ${actionButtonHTML}
            </div>
        `;

        const imageEl = productCard.querySelector('.product-main-img');
        if (mainImageUrl !== secondaryImageUrl) {
            productCard.addEventListener('mouseenter', () => { imageEl.src = secondaryImageUrl; });
            productCard.addEventListener('mouseleave', () => { imageEl.src = mainImageUrl; });
        }

        productCard.querySelector('.product-image-wrapper').addEventListener('click', () => {
    // 1. MUST use 'imageArray' (the locally processed multi-image array)
    // 2. MUST pass 'product.category' at the end to auto-switch size matrices
    window.openQuickView(
        productTitle, 
        rawDescription, 
        imageArray, 
        productPrice, 
        product.category
    );
});
        if (!isSoldOut) {
            productCard.querySelector('.luxury-add-trigger').addEventListener('click', (e) => {
                e.stopPropagation(); 
                const selectedSize = productCard.querySelector(`#size-select-${product.id}`).value;
                window.addToBag(product.id, productTitle, productPrice, mainImageUrl, selectedSize);
            });
        }

        productGrid.appendChild(productCard);
    });

    renderPaginationControls(activeShowroomProducts.length);
}

// =========================================================================
// ATELIER RESHAPED & VIEWPORT-OPTIMIZED QUICK VIEW ENGINE
// =========================================================================
window.openQuickView = function(title, description, imageArray, price, category) {
    let modalContainer = document.getElementById('luxury-quickview-modal');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'luxury-quickview-modal';
        document.body.appendChild(modalContainer);
    }

    // Secure multi-image data array parsing execution
    let finalImages = [];
    if (Array.isArray(imageArray) && imageArray.length > 0) {
        finalImages = imageArray;
    } else if (typeof imageArray === 'string' && imageArray.trim() !== '' && imageArray !== '[]') {
        try {
            let cleanStr = imageArray.trim();
            if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
                finalImages = cleanStr.replace(/[{}]/g, '').split(',').map(url => url.replace(/["']/g, '').trim());
            } else if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
                finalImages = JSON.parse(cleanStr);
            } else {
                finalImages = [cleanStr];
            }
        } catch(e) {
            finalImages = [imageArray.replace(/[\[\]\{\}\"\']/g, '').trim()];
        }
    }
    finalImages = finalImages.filter(imgUrl => imgUrl && imgUrl.startsWith('http'));
    if (finalImages.length === 0) {
        finalImages = ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'];
    }

    // Format description text metrics safely
    let storyText = description || '';
    let specificationsHTML = '';
    if (storyText.includes('--- ATELIER SPECIFICATIONS ---')) {
        const structuralSplits = storyText.split('--- ATELIER SPECIFICATIONS ---');
        storyText = structuralSplits[0].trim();
        const highlightsList = structuralSplits[1].trim().split('\n').filter(line => line.trim() !== '');
        
        if (highlightsList.length > 0) {
            specificationsHTML = `
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #222;">
                    <h5 style="margin: 0 0 8px 0; font-size: 9px; letter-spacing: 2px; color: #888; text-transform: uppercase;">SPECIFICATIONS</h5>
                    <ul style="margin: 0; padding-left: 12px; font-size: 10px; color: #ccc; line-height: 1.5; display: flex; flex-direction: column; gap: 3px;">
                        ${highlightsList.map(item => `<li>${item.replace(/^-\s*/, '')}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // Size context selection processing
    let modalSizeOptions = '';
    const cleanCategoryString = (category || '').toLowerCase();
    if (cleanCategoryString.includes('footwear') || cleanCategoryString.includes('shoe') || cleanCategoryString.includes('slide')) {
        modalSizeOptions = `<option value="40">40</option><option value="41">41</option><option value="42" selected>42</option><option value="43">43</option><option value="44">44</option><option value="45">45</option>`;
    } else {
        modalSizeOptions = `<option value="S">SMALL (S)</option><option value="M" selected>MEDIUM (M)</option><option value="L">LARGE (L)</option><option value="XL">EXTRA LARGE (XL)</option><option value="XXL">XXL</option>`;
    }

    // Overlaid gray backdrop container workspace layout frame 
    modalContainer.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; animation: fadeIn 0.3s ease-out;";
    
    // UPDATED INTERFACE SHAPE MATRICES: Slimmer 760px frame configuration layout rules
    modalContainer.innerHTML = `
        <div class="atelier-modal-body" style="background:#000; border:1px solid #222; width:100%; max-width:760px; display:grid; grid-template-columns: 1.1fr 0.9fr; position:relative; box-sizing:border-box; color:#fff; height: 580px; max-height: 100vh; overflow: hidden;">
            
            <button onclick="closeLuxuryQuickView()" style="position:absolute; top:12px; right:15px; background:none; border:none; color:#fff; font-size:25px; cursor:pointer; font-weight:200; z-index:100; line-height:1;">&times;</button>
            
            <div style="display:flex; flex-direction:column; padding:15px; gap:12px; background:#0a0a0a; border-right:1px solid #111; justify-content: center; box-sizing: border-box; height: 100%; overflow: hidden;">
                <div class="main-viewport-wrapper" style="width:100%; height: 380px; background:#111; overflow:hidden; border:1px solid #222;">
                    <img id="modal-primary-display" src="${finalImages[0]}" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.2s ease;">
                </div>
                
                <div class="thumbnail-roller" style="display:flex; gap:8px; width:100%; overflow-x:auto; padding-bottom:4px; justify-content: flex-start; scrollbar-width: none; -ms-overflow-style: none;">
                    ${finalImages.map((imgUrl, idx) => `
                        <div class="thumb-frame" onclick="switchQuickViewDisplayImage(this, '${imgUrl}')" style="width:45px; height:55px; flex-shrink:0; cursor:pointer; border:${idx === 0 ? '2px solid #fff' : '1px solid #333'}; background:#111; transition:all 0.2s;">
                            <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=100'">
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="padding:25px 20px 20px 20px; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; height: 100%; overflow: hidden; background:#000;">
                
                <div class="roller-content-container" style="overflow-y:auto; flex:1; padding-right:6px; margin-bottom:12px; scrollbar-width: thin; scrollbar-color: #333 #000;">
                    <h4 style="margin:0 0 4px 0; font-size:9px; letter-spacing:2px; color:#888; text-transform:uppercase;">ATELIER LABS</h4>
                    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:300; letter-spacing:0.5px; text-transform:uppercase; line-height:1.2;">${title}</h2>
                    <div style="font-size:16px; font-weight:bold; font-family:monospace; margin-bottom:12px; color:#fff;">₦${Number(price).toLocaleString()}</div>
                    
                    <div style="font-size:11px; color:#ccc; line-height:1.5; font-weight:300; white-space: pre-wrap;">
                        ${storyText}
                    </div>
                    
                    ${specificationsHTML}
                </div>

                <div class="persistent-actions-anchor" style="background:#000; padding-top:10px; border-top:1px solid #111; display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label style="font-size:8px; font-weight:bold; letter-spacing:1px; color:#888; display:block; margin-bottom:4px; text-transform:uppercase;">Select Execution Size</label>
                        <select id="modal-size-select" style="width:100%; background:#111; color:#fff; border:1px solid #333; padding:10px; font-size:10px; font-weight:bold; letter-spacing:1px; border-radius:0; -webkit-appearance:none; height:38px; box-sizing:border-box;">
                            ${modalSizeOptions}
                        </select>
                    </div>

                    <button type="button" onclick="executeModalBagInsertion('${title}', ${price}, '${finalImages[0]}')" style="width:100%; background:#fff; color:#000; border:none; padding:12px; font-size:10px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:background 0.2s;">
                        ADD TO COLLECTION BAG
                    </button>
                </div>

            </div>
        </div>
    `;

    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) window.closeLuxuryQuickView();
    });
};

window.closeLuxuryQuickView = function() {
    const modalContainer = document.getElementById('luxury-quickview-modal');
    if (modalContainer) {
        modalContainer.style.animation = "fadeOut 0.2s ease-out forwards";
        setTimeout(() => { modalContainer.remove(); }, 200);
    }
};

window.switchQuickViewDisplayImage = function(selectedThumbFrame, targetImgUrl) {
    const mainDisplay = document.getElementById('modal-primary-display');
    if (mainDisplay) {
        mainDisplay.style.opacity = '0.3';
        setTimeout(() => {
            mainDisplay.src = targetImgUrl;
            mainDisplay.style.opacity = '1';
        }, 150);
    }
    document.querySelectorAll('.thumb-frame').forEach(frame => { frame.style.border = '1px solid #333'; });
    selectedThumbFrame.style.border = '2px solid #fff';
};

window.executeModalBagInsertion = function(title, price, image) {
    const chosenSize = document.getElementById('modal-size-select').value;
    if (typeof window.addToBag === 'function') {
        window.addToBag('qv_' + Date.now(), title, price, image, chosenSize);
        if (typeof window.updateCartSidebar === 'function') window.updateCartSidebar();
        if (typeof window.renderCart === 'function') window.renderCart();
        window.closeLuxuryQuickView();
    } else {
        console.error("Atelier Core Error: E-commerce cart data-layer architecture missing.");
    }
};
// =========================================================================
// --- AUTOMATED BOUTIQUE COUTURE INTAKE PIPELINE ---
// =========================================================================
function handleBespokeSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        tier: formData.get('couture_tier'),
        name: formData.get('client_name'),
        instagram: formData.get('client_instagram'),
        email: formData.get('client_email'),
        location: formData.get('client_location'),
        height: formData.get('client_height'),
        size: formData.get('client_size'),
        footwear: formData.get('client_footwear'),
        brief: formData.get('client_brief')
    };

    // 1. DYNAMIC CONCIERGE WHATSAPP STRING BUILDER
    const whatsappText = `Hello ATELIER Salon Concierge,\n\n` +
                         `I would like to reserve a Private Measurement Consultation.\n\n` +
                         `• PROFILE: ${data.name.toUpperCase()} (${data.instagram})\n` +
                         `• SERVICE: Bespoke ${data.tier}\n` +
                         `• REGION: ${data.location}\n` +
                         `• METRICS: Sizing ${data.size} | Footwear ${data.footwear} | Height ${data.height}\n\n` +
                         `• BRIEF CONFIGURATION:\n"${data.brief}"`;

    const encodedMessage = encodeURIComponent(whatsappText);
    
    // REPLACE WITH YOUR ACTUAL REGISTERED NIGERIAN WHATSAPP BUSINESS PHONE NUMBER
    const atelierWhatsAppNumber = "08138116238"; 
    const whatsappRedirectUrl = `https://wa.me/${atelierWhatsAppNumber}?text=${encodedMessage}`;

    // 2. BACKGROUND EMAILJS BACKUP TRANSMISSION
    if (typeof emailjs !== 'undefined') {
        emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
            from_name: data.name,
            client_email: data.email,
            instagram_handle: data.instagram,
            tier_requested: data.tier,
            location: data.location,
            client_metrics: `Size: ${data.size}, Shoe: ${data.footwear}, Height: ${data.height}`,
            design_brief: data.brief
        })
        .then(() => {
            console.log("Atelier design ledger securely synced to office database.");
        })
        .catch((error) => {
            console.error("EmailJS background notice queue delayed:", error);
        });
    }

    // 3. EXECUTE VIP HANDOFF
    form.reset();
    window.open(whatsappRedirectUrl, '_blank');
}
// =========================================================================
// --- 5. PREMIUM CATALOG INTERFACE NAVIGATION ENGINE ---
// =========================================================================
function renderPaginationControls(totalItems) {
    // Target the specific static pagination wrapper present in your HTML markup
    const container = document.getElementById('pagination-controls');
    if (!container) return console.error("Pagination controls container (#pagination-controls) missing from DOM!");
    
    container.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return; // Completely hide controls if everything fits beautifully on one screen

    // --- Dynamic Slider Constraints ---
    let maxVisibleButtons = 3; 
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    // Adjust boundaries dynamically to always ensure 3 options are clickable if available
    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // --- Helper Component Generator ---
    function createNavButton(label, targetPage, isDisabled, additionalClass = '') {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.className = `page-btn ${additionalClass}`.trim();
        
        // Inline luxury styles for consistency across light/dark responsive views
        btn.style.cssText = "background:#000; color:#fff; border:1px solid #333; padding:10px 15px; font-size:10px; font-weight:bold; cursor:pointer; text-transform:uppercase; font-family:monospace; min-width:40px;";
        
        if (isDisabled) {
            btn.disabled = true;
            btn.style.color = '#333';
            btn.style.borderColor = '#111';
            btn.style.cursor = 'not-allowed';
            btn.classList.add('disabled');
        } else {
            btn.addEventListener('click', () => {
                currentPage = targetPage;
                // Synchronized with your global database data array variable
                renderProducts(allProducts);
                scrollToShopHeader();
            });
        }
        return btn;
    }

    // 1. FIRST PAGE MASTER TRIGGER (|<)
    container.appendChild(createNavButton('&#10092;&#10092;', 1, currentPage === 1, 'arrow-btn first-page'));

    // 2. PREVIOUS STEP TRIGGER (<)
    container.appendChild(createNavButton('&#10092;', currentPage - 1, currentPage === 1, 'arrow-btn prev-page'));

    // 3. DYNAMIC NUMBER MATRIX ROW
    for (let i = startPage; i <= endPage; i++) {
        const numBtn = document.createElement('button');
        numBtn.innerText = i;
        numBtn.className = (i === currentPage) ? 'page-btn active' : 'page-btn';
        
        // Dynamic numbering styles
        if (i === currentPage) {
            numBtn.style.cssText = "background:#fff; color:#000; border:1px solid #fff; padding:10px 15px; font-size:10px; font-weight:bold; font-family:monospace; min-width:40px; cursor:default;";
        } else {
            numBtn.style.cssText = "background:#000; color:#fff; border:1px solid #333; padding:10px 15px; font-size:10px; font-weight:bold; font-family:monospace; min-width:40px; cursor:pointer;";
        }
        
        numBtn.addEventListener('click', () => {
            currentPage = i;
            renderProducts(allProducts);
            scrollToShopHeader();
        });
        container.appendChild(numBtn);
    }

    // 4. NEXT STEP TRIGGER (>)
    container.appendChild(createNavButton('&#10093;', currentPage + 1, currentPage === totalPages, 'arrow-btn next-page'));

    // 5. LAST PAGE MASTER TRIGGER (>|)
    container.appendChild(createNavButton('&#10093;&#10093;', totalPages, currentPage === totalPages, 'arrow-btn last-page'));
}

// Viewport Anchor Handler
function scrollToShopHeader() {
    const targetShopPage = document.getElementById('shop-page');
    if (targetShopPage) {
        targetShopPage.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// =========================================================================
// --- 6. BAG CONTROLS, EXECUTIONS & INTERFACE DRAW ---
// =========================================================================
window.handleDirectBagInsertion = function(productId, selectedSize = null) {
    console.log(`Atelier Sync Core: Direct insertion request processed for item: ${productId}`);
    const cardElement = document.querySelector(`[data-product-id="${productId}"]`);
    
    if (!selectedSize) {
        const sizeDropdown = cardElement ? cardElement.querySelector('.atelier-size-select') : null;
        selectedSize = sizeDropdown ? sizeDropdown.value : 'M';
    }
    
    const productData = allProducts.find(p => p.id === productId);
    if (productData) {
        window.addToBag(productData.id, productData.name, productData.base_price, productData.images?.[0] || productData.image_url, selectedSize);
    }
};

window.addToBag = function(id, title, price, imageUrl, selectedSize) {
    if (!selectedSize) {
        alert("Please select your custom size baseline.");
        return;
    }

    let cleanTitle = String(title).replace(/['">\\\/]/g, '').trim();
    let cleanImg = String(imageUrl).trim();
    
    if (cleanImg.includes(".costoragev1")) {
        cleanImg = cleanImg.replace(".costoragev1", ".co/storage/v1/");
    }
    if (cleanImg.endsWith('/')) {
        cleanImg = cleanImg.slice(0, -1);
    }

    let parsedPrice = parseFloat(price) || 0;
    const cartItemId = `${id}-${selectedSize}`;
    const existingItem = window.atelierMemoryCart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        window.atelierMemoryCart.push({
            cartId: cartItemId,
            id: id,
            title: cleanTitle,
            price: parsedPrice,
            image_url: cleanImg,
            size: selectedSize,
            quantity: 1
        });
    }

    try { 
        localStorage.setItem('cart', JSON.stringify(window.atelierMemoryCart)); 
    } catch (e) {}
    
    window.updateCartUI();
    
    const cardElement = document.querySelector(`[data-product-id="${id}"]`);
    const originalTriggerBtn = cardElement ? cardElement.querySelector('.luxury-add-trigger') : null;
    
    if (originalTriggerBtn) {
        originalTriggerBtn.innerText = "ADDED TO BAG";
        originalTriggerBtn.style.backgroundColor = "#000000";
        originalTriggerBtn.style.color = "#ffffff";
        originalTriggerBtn.style.borderColor = "#ffffff";
        
        // Return back to initial layout state smoothly after brief microsecond delay
        setTimeout(() => {
            originalTriggerBtn.innerText = "ADD TO BAG";
            originalTriggerBtn.style.backgroundColor = "#ffffff";
            originalTriggerBtn.style.color = "#000000";
        }, 1200);
    }
};



// Pure Vertical Ledger Layout Renderer for Your Bag Drawer
window.updateCartUI = function() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const bagCountElements = document.querySelectorAll('#bag-count, .bag-count, #bag-count-mobile');

    if (!container) return;

    const totalQuantity = window.atelierMemoryCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    bagCountElements.forEach(badge => { badge.innerText = totalQuantity; });

    if (window.atelierMemoryCart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="margin: 0; font-family: serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;">Your Bag is Empty</p>
            </div>
        `;
        if (totalEl) totalEl.innerText = "₦0.00";
        window.calculatedTotal = 0;
        window.activeOrderSnapshot = [];
        return;
    }

    container.innerHTML = window.atelierMemoryCart.map((item) => {
        const currentItemTitle = item.name || item.title || 'Bespoke Piece';
        let currentVisualSource = item.image || item.image_url || '';
        
        if (currentVisualSource.includes(".costoragev1")) {
            currentVisualSource = currentVisualSource.replace(".costoragev1", ".co/storage/v1/");
        }
        if (currentVisualSource.endsWith('/')) {
            currentVisualSource = currentVisualSource.slice(0, -1);
        }

        const itemSubtotal = Number(item.price) * Number(item.quantity);
        const fallbackHTML = `<div style="width: 70px; height: 90px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: serif; font-size: 14px; border: 1px solid #333; margin-top: 8px;">${currentItemTitle.charAt(0).toUpperCase()}</div>`;
        const activeItemVisual = currentVisualSource ? 
            `<img src="${currentVisualSource}" style="width: 70px; height: 90px; object-fit: cover; border: 1px solid #333; display: block; margin-top: 8px;" onerror="this.outerHTML='${fallbackHTML}'">` : fallbackHTML;

        return `
            <div class="cart-item" style="display: flex; flex-direction: column; padding: 18px 0; border-bottom: 1px solid #222; background: transparent; position: relative;" data-id="${item.cartId}">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 15px;">
                    <h4 style="margin: 0; font-family: serif; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; line-height: 1.2; white-space: normal; word-break: break-word; max-width: 85%;">
                        ${currentItemTitle}
                    </h4>
                    <button onclick="removeFromCart('${item.cartId}')" style="color: #888888; background: none; border: none; cursor: pointer; font-size: 24px; line-height: 1; padding: 6px; margin: 0; z-index: 9999;">&times;</button>
                </div>
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px; font-family: sans-serif; font-size: 10px; color: #aaaaaa; letter-spacing: 0.5px; text-transform: uppercase;">
                    <span>Size: <strong style="color: #ffffff;">${item.size || 'N/A'}</strong></span>
                    <span style="color: #444444;">|</span>
                    <span>Qty: <strong style="color: #ffffff;">${item.quantity}</strong></span>
                </div>
                <div style="margin-top: 6px; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #ffffff;">
                    ₦${itemSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div style="margin-top: 4px;">
                    ${activeItemVisual}
                </div>
            </div>
        `;
    }).join('');

    const total = window.atelierMemoryCart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    if (totalEl) totalEl.innerText = `₦${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    window.calculatedTotal = total;

    // Snapshot arrays instantly for payment reference pipelines
    window.activeOrderSnapshot = window.atelierMemoryCart.map(item => ({
        id: item.id,
        name: item.name || item.title,
        price: Number(item.price),
        quantity: Number(item.quantity),
        size: item.size || 'N/A',
        image: item.image || item.image_url || ''
    }));
};

window.removeFromCart = function(cartId) {
    window.atelierMemoryCart = window.atelierMemoryCart.filter(item => String(item.cartId) !== String(cartId));
    try { localStorage.setItem('cart', JSON.stringify(window.atelierMemoryCart)); } catch (e) {}
    updateCartUI();
};

window.openCart = () => { document.getElementById('cart-panel')?.classList.add('active'); };
window.closeCart = () => { document.getElementById('cart-panel')?.classList.remove('active'); };

// Call UI update once script evaluation mounts
document.addEventListener("DOMContentLoaded", () => { updateCartUI(); });

// --- UPDATE ORDER SUMMARY ---
function updateOrderSummaryInstant() {
    const stateDropdown = document.getElementById('state');
    const subtotalEl = document.getElementById('display-subtotal');
    const shippingEl = document.getElementById('display-shipping');
    const totalEl = document.getElementById('display-total');

    if (!subtotalEl || !shippingEl || !totalEl) return;

    // 1. Pull the absolute freshest cart snapshot from storage to ensure image/price synchronization
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];

    // 2. Calculate stable numerical subtotal
    let subtotal = currentCart.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        return sum + (itemPrice * itemQty);
    }, 0);

    subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;

    // 3. Handle default state where no shipping destination is selected yet
    let shippingFee = 0;
    const destinationState = stateDropdown ? stateDropdown.value : '';

    if (destinationState && typeof calculateSmallItemShipping === 'function') {
        shippingFee = calculateSmallItemShipping("Lagos", destinationState);
        shippingEl.textContent = `₦${shippingFee.toLocaleString()}`;
    } else {
        shippingEl.textContent = "Select State";
    }

    // 4. Calculate definitive transaction total
    const totalAmount = subtotal + shippingFee;
    totalEl.textContent = `₦${totalAmount.toLocaleString()}`;

    // 5. Secure global registration variables safely for payment gateways (like Paystack/Flutterwave)
    window.calculatedSubtotal = subtotal;
    window.calculatedShippingFee = shippingFee;
    window.calculatedTotal = totalAmount;
}


// --- SHIPPING CALCULATION ---
const calculateSmallItemShipping = (origin, destination) => {
    const rates = {
        "lagos-lagos": 1400,
        "lagos-abuja": 2000,
        "lagos-port harcourt": 2500,
        "lagos-ibadan": 1700,
        "lagos-kano": 3000,
        "lagos-enugu": 2500,
        "lagos-ogun": 1800,
    };

    const key = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
    const baseRate = rates[key] || 3000;
    const vat = baseRate * 0.075;

    return baseRate + vat;
};
// Update summary when state changes
document.getElementById('state')?.addEventListener('change', updateOrderSummaryInstant);

// =========================================================================
// --- 1. DATA COLLECTION ENGINE (EXACT PROPERTY MAPPING) ---
// =========================================================================
function collectCheckoutFormData() {
    console.log("Atelier System Core: Querying exact shipping form name maps.");

    const fullName = document.querySelector('input[name="full_name"]')?.value?.trim() || 'Atelier Client';
    const email = document.querySelector('input[name="email_address"]')?.value?.trim() || '';
    const phone = document.querySelector('input[name="phone"]')?.value?.trim() || '';
    const address = document.querySelector('input[name="street_address"]')?.value?.trim() || '';
    const city = document.querySelector('input[name="city"]')?.value?.trim() || '';
    const state = document.getElementById('state')?.value || '';

    console.log("Atelier Form Mapping Results:", { fullName, email, phone, address, city, state });

    if (!email || !email.includes('@')) {
        alert("Enter a valid email address.");
        return null;
    }

    if (!phone || !address || !city || !state) {
        alert("Complete all shipping fields.");
        return null;
    }

    const calculatedTotal = Number(window.calculatedTotal || 0);
    if (calculatedTotal <= 0) {
        alert("Invalid transaction total valuation calculation.");
        return null;
    }

    const orderSnapshot = (window.atelierMemoryCart || []).map(item => ({
        id: String(item.id || item.cartId || ''),
        name: String(item.name || item.title || 'Bespoke Piece').replace(/['"<>]/g, '').trim(),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        size: String(item.size || 'N/A'),
        image: String(item.image || item.image_url || '')
    }));

    if (orderSnapshot.length === 0) {
        alert("Your shopping bag is empty.");
        return null;
    }

    return { email, fullName, phone, address, city, state, calculatedTotal, orderSnapshot };
}

// =========================================================================
// --- 2. THE MAIN INITIALIZATION LIFECYCLE MANAGEMENT ---
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {

    // --- STEP 1: OPEN SHIPPING FORM DRAWER LINK ---
    const checkoutButtons = document.querySelectorAll('.checkout-btn:not(#pay-btn)');
    checkoutButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!window.atelierMemoryCart || window.atelierMemoryCart.length === 0) {
                alert("Your bag is empty.");
                return;
            }

            ['shop-page', 'about-page'].forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) section.style.display = 'none';
            });

            const hero = document.querySelector('.hero');
            if (hero) hero.style.display = 'none';

            if (typeof window.closeCart === 'function') {
                window.closeCart();
            }

            const checkoutSection = document.getElementById('checkout-section');
            if (checkoutSection) {
                checkoutSection.style.display = 'block';
                checkoutSection.scrollIntoView({ behavior: 'smooth' });

                if (typeof updateOrderSummaryInstant === 'function') {
                    updateOrderSummaryInstant();
                }
            }
        });
    });

    // --- STEP 2: ATTACH INTELLIGENT ROUTER TO DUAL ACTION CHECKOUT BUTTON ---
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Look for checked high-contrast payment method select button or input field
            // Expected UI field element names: 'payment_method' values: 'online' or 'pay_on_delivery'
            const selectedMethodEl = document.querySelector('input[name="payment_method"]:checked') || document.getElementById('payment-method-select');
            const paymentMethod = selectedMethodEl ? selectedMethodEl.value : 'online';

            if (paymentMethod === 'pay_on_delivery') {
                console.log("Atelier Interface Trigger: Forwarding request to Postpaid Engine.");
                window.executePayOnDeliveryWorkflow();
            } else {
                console.log("Atelier Interface Trigger: Forwarding request to Paystack Engine.");
                window.payWithPaystack();
            }
        });
    }

    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
});

// =========================================================================
// --- 3. PAYSTACK GATEWAY LIFECYCLE SEQUENCE (PREPAID ENGINE) ---
// =========================================================================
window.payWithPaystack = function () {
    console.log("Atelier: Prepaid Payment Sequence Initiated");

    const checkoutData = collectCheckoutFormData();
    if (!checkoutData) return; 

    if (typeof PaystackPop === 'undefined' || !PaystackPop.setup) {
        alert("Paystack SDK failed to load.");
        return;
    }

    const executePayloadSynchronization = function(referenceCode) {
        const orderTotal = Number(checkoutData.calculatedTotal);
        
        // --- REVENUE SPLIT MATH LOGIC ---
        const platformCommission = Math.round(orderTotal * 0.10); // 10% Platform Cut
        const vendorNetPayout = orderTotal - platformCommission;

        // --- DYNAMIC SELLER ID LOOKUP ---
        // Extract the seller_id from the first item in the bag snapshot, fallback safely if empty
        const dynamicSellerId = (checkoutData.orderSnapshot && checkoutData.orderSnapshot[0] && checkoutData.orderSnapshot[0].seller_id) 
            ? checkoutData.orderSnapshot[0].seller_id 
            : "00000000-0000-0000-0000-000000000001";

        const compiledOrderPayload = {
            id: referenceCode,
            email: checkoutData.email,
            name: checkoutData.fullName,
            phone: checkoutData.phone,
            total_amount: orderTotal,
            status: 'Paid',
            payment_method: 'online',
            seller_id: dynamicSellerId, // Dynamic assignment fix
            commission_fee: platformCommission, // Dynamic assignment fix
            shipping_fee_seller: 0,
            net_payout: vendorNetPayout, // Dynamic assignment fix
            shipping_region: checkoutData.state,
            address: `${checkoutData.address}, ${checkoutData.city}`,
            items: checkoutData.orderSnapshot
        };

        window.saveOrderToSupabase(compiledOrderPayload);
    };

    const handler = PaystackPop.setup({
        key: 'pk_test_f530e65d4cebf50a588673f69d1512b7cae51e02',
        email: checkoutData.email,
        amount: Math.round(checkoutData.calculatedTotal * 100),
        currency: 'NGN',
        ref: 'T' + Date.now(),
        callback: function (response) {
            executePayloadSynchronization(response.reference);
        }
    });
    handler.openIframe();
};

// =========================================================================
// --- 3B. PAY ON DELIVERY ENGINE MODULE (POSTPAID ENGINE) ---
// =========================================================================
window.executePayOnDeliveryWorkflow = function() {
    console.log("Atelier: Postpaid Payment Sequence Initiated");

    const checkoutData = collectCheckoutFormData();
    if (!checkoutData) return; 

    const orderReferenceCode = 'POD' + Date.now();
    const orderTotal = Number(checkoutData.calculatedTotal);

    // --- REVENUE SPLIT MATH LOGIC ---
    const platformCommission = Math.round(orderTotal * 0.10); // 10% Platform Cut
    const vendorNetPayout = orderTotal - platformCommission;

    // --- DYNAMIC SELLER ID LOOKUP ---
    const dynamicSellerId = (checkoutData.orderSnapshot && checkoutData.orderSnapshot[0] && checkoutData.orderSnapshot[0].seller_id) 
        ? checkoutData.orderSnapshot[0].seller_id 
        : "00000000-0000-0000-0000-000000000001";

    const compiledOrderPayload = {
        id: orderReferenceCode,
        email: checkoutData.email,
        name: checkoutData.fullName,
        phone: checkoutData.phone,
        total_amount: orderTotal,
        status: 'pending_delivery',
        payment_method: 'pay_on_delivery',
        seller_id: dynamicSellerId, // Dynamic assignment fix
        commission_fee: platformCommission, // Dynamic assignment fix
        shipping_fee_seller: 0,
        net_payout: vendorNetPayout, // Dynamic assignment fix
        shipping_region: checkoutData.state,
        address: `${checkoutData.address}, ${checkoutData.city}`,
        items: checkoutData.orderSnapshot
    };

    window.saveOrderToSupabase(compiledOrderPayload);
};

// =========================================================================
// --- 4. SUPABASE TRANSACTIONAL INTEGRATION ENGINE ---
// =========================================================================
window.saveOrderToSupabase = async function (orderData) {
    console.log("Atelier Sync Core: Opening channel transaction for ID:", orderData.id);
    const clientDbEngine = window.supabaseClientInstance;

    if (!clientDbEngine || typeof clientDbEngine.from !== 'function') {
        await processPostPaymentAutomations(orderData);
        return;
    }

    try {
        const { data, error } = await clientDbEngine
            .from('orders')
            .insert([
                {
                    id: orderData.id,
                    customer_email: orderData.email,
                    customer_name: orderData.name,
                    customer_phone: orderData.phone,
                    total_amount: Number(orderData.total_amount),
                    status: orderData.status,
                    payment_method: orderData.payment_method,
                    seller_id: orderData.seller_id, // Saved accurately to target specific vendors
                    commission_fee: Number(orderData.commission_fee), // Split logged correctly
                    shipping_fee_seller: Number(orderData.shipping_fee_seller),
                    net_payout: Number(orderData.net_payout), // Split logged correctly
                    tracking_number: orderData.id,
                    shipping_region: orderData.shipping_region,
                    address: orderData.address,
                    items: orderData.items
                }
            ]);

        if (error) throw error;
        console.log("Atelier Sync Core: Database ledger logging complete.", data);

    } catch (err) {
        console.error("Atelier Critical Core Ledger Sync Exception:", err);
        alert(`Database Sync Error: ${err.message || err}`);
    } finally {
        await processPostPaymentAutomations(orderData);
    }
};

// =========================================================================
// --- 5. POST-TRANSACTION WORKFLOW AUTOMATIONS ---
// =========================================================================
async function processPostPaymentAutomations(orderData) {
    console.log("Atelier Core Lifecycle: Processing order teardown and notification sequences.");

    window.atelierMemoryCart = [];
    localStorage.removeItem('cart');

    if (typeof window.updateCartUI === 'function') {
        try { window.updateCartUI(); } catch(e) { console.error(e); }
    }

    if (typeof window.sendAtelierEmail === 'function' || typeof sendAtelierEmail === 'function') {
        try {
            console.log("Atelier Sync Core: Triggering EmailJS operational channels.");
            const emailFn = window.sendAtelierEmail || sendAtelierEmail;
            
            await emailFn(orderData.id, orderData.email, orderData.total_amount, orderData.payment_method);
            
            // Dynamic alert messaging based on payment choice architecture rules
            if (orderData.payment_method === 'pay_on_delivery') {
                alert(`Order Confirmed via Pay on Delivery!\nYour Atelier Order ID is: ${orderData.id}\nOur team will contact you on ${orderData.phone} before delivery dispatch.`);
            } else {
                alert(`Payment Received & Order Confirmed!\nYour Atelier Order ID is: ${orderData.id}\nCheck your inbox for confirmation.`);
            }
        } catch (emailErr) {
            console.error("Atelier Email Automation Trigger Exception:", emailErr);
            alert(`Order Saved successfully (ID: ${orderData.id}), but confirmation email failed to dispatch. Our admin team will process manually.`);
        }
    } else {
        console.warn("Atelier Warning: Global email routing channel unmapped on lifecycle thread.");
        alert(`Order Received Successfully!\nYour Atelier Order ID is: ${orderData.id}`);
    }

    window.location.href = window.location.origin + window.location.pathname;
}

// =========================================================================
// --- 7. EMAIL CONFIRMATION (WITH DUAL METHOD TRACKING TYPE VALUES) ---
// =========================================================================
function sendAtelierEmail(ref, customerEmail, amount, paymentMethod) {
    if (!customerEmail) {
        console.error("Atelier Error: No recipient email found.");
        return Promise.reject("Missing customer email address.");
    }

    emailjs.init("0pSpit0Eoff3xV_O9"); 

    // Convert method parameter string values into crystal clear display descriptors
    const methodDisplay = paymentMethod === 'pay_on_delivery' ? 'Pay on Delivery (Cash/Transfer)' : 'Online Secured Payment';

    const templateParams = {
        to_email: customerEmail, 
        order_id: ref,          
        total_amount: `₦${Number(amount).toLocaleString()}`,
        payment_type: methodDisplay, // <-- Passes method clean label straight to your EmailJS parameters wrapper template
        track_link: `https://atelier-shop-psi.vercel.app/track-order.html?id=${ref}`
    };

    console.log("Atelier: Attempting email dispatch...", templateParams);

    return emailjs.send('service_zi3z4lm', 'template_9lhj8aj', templateParams)
        .then((res) => {
            console.log("Atelier: Email SUCCESS", res.status, res.text);
            return res;
        })
        .catch(err => {
            console.error("Atelier Email Detailed Error:", err);
            throw err;
        });
}
// B. BACK TO SHOP (From Shipping back to Store)
window.backToShop = function() {
    // 1. Hide Checkout
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) checkoutSection.style.display = 'none';

    // 2. Show Shop and Hero
    const shopPage = document.getElementById('shop-page');
    const hero = document.querySelector('.hero');
    
    if (shopPage) shopPage.style.display = 'block';
    if (hero) hero.style.display = 'flex';

    // 3. Reset Scroll to top so the header looks right
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
    const trackBtn = document.getElementById('track-btn');
    const trackingInput = document.getElementById('tracking-number');
    const resultContainer = document.getElementById('tracking-result');
    const currentStatusSpan = document.getElementById('current-status');
    const displayOrderIdSpan = document.getElementById('display-order-id');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const progressFill = document.getElementById('progress-fill');

    if (!trackBtn || !trackingInput) return;

    trackBtn.addEventListener('click', async () => {
        let rawInput = trackingInput.value.trim();
        if (!rawInput) {
            alert('Please enter a valid order reference code.');
            return;
        }

        let searchId = rawInput.replace(/#/g, '').replace(/ATL-/i, '').trim();
        const activeDatabaseClient = window.db || window.supabaseClientInstance || window.supabase;
        
        if (!activeDatabaseClient) {
            alert('System connectivity offline. Please reload and try again.');
            return;
        }

        trackBtn.innerText = 'LOCATING LOG...';
        trackBtn.disabled = true;

        try {
            const { data: orders, error } = await activeDatabaseClient
                .from('orders')
                .select('*');

            if (error) throw error;

            const foundOrder = orders.find(o => 
                o.id.toString().toLowerCase() === searchId.toLowerCase() ||
                o.id.toString().toUpperCase().includes(searchId.toUpperCase())
            );

            if (!foundOrder) {
                alert(`No matching package found for tracking token: "${rawInput}"`);
                resultContainer.style.display = 'none';
                return;
            }

            // 1. Process Status & Progress Tracking States
            const statusStr = foundOrder.status ? String(foundOrder.status).toLowerCase().trim() : 'pending_delivery';
            let statusText = 'ORDER PENDING';
            let progressPercentage = '25%';
            let barColor = '#0091ff'; // Default to blue for early stages
            
            let step1 = '●', step2 = '○', step3 = '○';

            if (statusStr === 'shipped' || statusStr === 'closed') {
                statusText = 'ORDER SHIPPED';
                progressPercentage = '65%';
                step1 = '✓'; step2 = '●';
            } else if (statusStr === 'delivered') {
                statusText = 'DELIVERED';
                progressPercentage = '100%';
                step1 = '✓'; step2 = '✓'; step3 = '✓';
            } else if (statusStr === 'cancelled') {
                statusText = 'CANCELLED';
                progressPercentage = '0%';
                barColor = '#dc3545';
                step1 = '✕'; step2 = '✕'; step3 = '✕';
            }

            // 2. Parse Manifest Items
            let items = [];
            try {
                items = typeof foundOrder.items === 'string' ? JSON.parse(foundOrder.items) : foundOrder.items;
                if (!Array.isArray(items)) items = [];
            } catch(e) { }

            // Build Horizontal Spread Items Rows with High-Contrast Size Badges
            let manifestItemsHTML = '';
            if (items.length > 0) {
                manifestItemsHTML = items.map(item => {
                    const imgUrl = item.image || item.img || '';
                    const imgTag = imgUrl 
                        ? `<img src="${imgUrl}" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid #000;" />`
                        : `<div style="width: 50px; height: 50px; background: #f0f0f0; border: 1px solid #000; font-size: 8px; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold;">ATELIER</div>`;
                    
                    return `
                        <div style="display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; font-size: 11px;">
                            <div style="width: 60px;">${imgTag}</div>
                            <div style="flex: 2.5; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">${item.name || 'Luxury Custom Piece'}</div>
                            <div style="flex: 1; text-align: center;">
                                <span style="background: #000000; color: #ffffff; padding: 4px 10px; font-weight: bold; font-family: monospace; font-size: 10px; letter-spacing: 0.5px; display: inline-block; min-width: 25px;">${item.size || item.selectedSize || '—'}</span>
                            </div>
                            <div style="flex: 1; text-align: center; font-weight: bold; color: #000;">x${item.quantity || 1}</div>
                            <div style="flex: 1; text-align: right; font-family: monospace; font-weight: bold; color: #000;">₦${Number(item.price || 0).toLocaleString()}</div>
                        </div>
                    `;
                }).join('');
            } else {
                manifestItemsHTML = `<div style="color: #666; font-style: italic; font-size: 11px; padding: 15px 0;">Standard Atelier Package Container</div>`;
            }

            // 3. Clean Formatting Dates
            const parsedDate = foundOrder.updated_at || foundOrder.created_at
                ? new Date(foundOrder.updated_at || foundOrder.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : 'Recent Log Update';

            // Core card structural assignments
            currentStatusSpan.textContent = statusText;
            currentStatusSpan.style.color = barColor;
            displayOrderIdSpan.textContent = `ATL-${foundOrder.id.toString().substring(0, 10).toUpperCase()}`;
            lastUpdatedSpan.textContent = parsedDate;
            progressFill.style.width = progressPercentage;
            progressFill.style.backgroundColor = barColor;

            // Clear previous append logs to prevent duplication layout stacking
            const oldExtendedBlock = document.getElementById('tracking-extended-details');
            if (oldExtendedBlock) oldExtendedBlock.remove();

            // FIXED: Targeted correct database schema values -> foundOrder.name & foundOrder.delivery_address
            const clientName = foundOrder.customer_name || 'Verified Client';
            const clientPhone = foundOrder.customer_phone || 'No Contact Number Attached';
            const shippingRegion = foundOrder.shipping_region || 'Lagos';
            const detailedAddress = foundOrder.address || 'No Detailed Address Specified';

            // 4. Premium Structural Layout Injection Matrix
            const extendedLayoutHTML = `
                <div id="tracking-extended-details" style="margin-top: 40px; border-top: 2px solid #000; padding-top: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    
                    <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 40px; text-align: center; color: #777;">
                        <div style="flex: 1; color: #000;"><span style="font-size: 16px; display: block; margin-bottom: 6px; font-weight: bold; color: #000;">${step1}</span> ORDER PLACED</div>
                        <div style="flex: 1; color: ${(statusStr === 'shipped' || statusStr === 'closed' || statusStr === 'delivered') ? '#000' : '#ccc'};"><span style="font-size: 16px; display: block; margin-bottom: 6px;">${step2}</span> DEPARTED HUB</div>
                        <div style="flex: 1; color: ${statusStr === 'delivered' ? '#000' : '#ccc'};"><span style="font-size: 16px; display: block; margin-bottom: 6px;">${step3}</span> ARRIVED DESTINATION</div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; margin-top: 20px; align-items: start;">
                        
                        <div style="background: #ffffff; border: 1px solid #000; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
                            <h4 style="margin: 0 0 15px 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #000; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px;">LOGISTICS ROUTING PROFILE</h4>
                            
                            <div style="margin-bottom: 12px;">
                                <span style="font-size: 9px; color: #777; letter-spacing: 0.5px; display: block; text-transform: uppercase;">Consignee Client</span>
                                <span style="font-size: 12px; font-weight: bold; color: #000; text-transform: uppercase;">${clientName}</span>
                            </div>
                            
                            <div style="margin-bottom: 12px;">
                                <span style="font-size: 9px; color: #777; letter-spacing: 0.5px; display: block; text-transform: uppercase;">Contact Assignment</span>
                                <span style="font-size: 11px; font-weight: 500; color: #000; font-family: monospace;">${clientPhone}</span>
                            </div>
                            
                            <div style="margin-bottom: 5px;">
                                <span style="font-size: 9px; color: #777; letter-spacing: 0.5px; display: block; text-transform: uppercase;">Hub Dispatch Region</span>
                                <span style="font-size: 11px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 0.5px;">${shippingRegion}</span>
                            </div>
                            
                            <div>
                                <span style="font-size: 9px; color: #777; letter-spacing: 0.5px; display: block; text-transform: uppercase;">Destination Address</span>
                                <span style="font-size: 11px; color: #222; font-weight: 500; line-height: 16px; text-transform: uppercase; display: block; margin-top: 2px;">${detailedAddress}</span>
                            </div>
                        </div>

                        <div style="background: #ffffff; border: 1px solid #000; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.01);">
                            <h4 style="margin: 0 0 10px 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #000; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 8px;">CONSOLIDATED PACKAGE MANIFEST</h4>
                            
                            <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #000; font-weight: bold; font-size: 8px; letter-spacing: 1px; color: #555; text-transform: uppercase;">
                                <div style="width: 60px;">Item</div>
                                <div style="flex: 2.5;">Description</div>
                                <div style="flex: 1; text-align: center;">Size</div>
                                <div style="flex: 1; text-align: center;">Qty</div>
                                <div style="flex: 1; text-align: right;">Price</div>
                            </div>

                            <div style="overflow-y: auto; max-height: 220px; padding-right: 5px;">
                                ${manifestItemsHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            resultContainer.insertAdjacentHTML('beforeend', extendedLayoutHTML);
            resultContainer.style.display = 'block';

        } catch (err) {
            console.error("Tracking Framework Runtime Exception:", err);
            alert("Error connecting to real-time manifest routing layers.");
        } finally {
            trackBtn.innerText = 'Track Package';
            trackBtn.disabled = false;
        }
    });

    trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') trackBtn.click();
    });
});

// ATELIER NAVIGATION FIX:
// This ensures that clicking "SHOP" at the top always shows the products
document.querySelectorAll('a[href="#shop"]').forEach(link => {
    link.addEventListener('click', (_e) => {
        const shopPage = document.getElementById('shop-page') || document.getElementById('shop');
        const checkoutSection = document.getElementById('checkout-section');
        
        if (shopPage) {
            shopPage.style.display = 'block'; // Make sure it's visible
            if (checkoutSection) checkoutSection.style.display = 'none'; // Hide checkout if open
            
            // Smoothly scroll down to the clothes
            shopPage.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
// This starts the whole process
fetchAtelierProducts();

// Function to show About Us specifically
window.showAbout = function() {
    // Hide everything else
    const hero = document.querySelector('.hero');
    const shop = document.getElementById('shop-page');
    const checkout = document.getElementById('checkout-section');
    const about = document.getElementById('about-page');

    if (hero) hero.style.display = 'none';
    if (shop) shop.style.display = 'none';
    if (checkout) checkout.style.display = 'none';

    // Show about section and scroll to it
    if (about) {
        about.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Update your existing backToShop to hide about page too
const originalBackToShop = window.backToShop;
window.backToShop = function() {
    const about = document.getElementById('about-page');
    if (about) about.style.display = 'none';
    
    // Call the rest of the original function
    if (originalBackToShop) originalBackToShop();
};
// Function to handle the "ABOUT" link click
window.scrollToAbout = function(_e) {
    // 1. First, make sure the shop and hero are visible
    window.backToShop(); 
    
    // 2. Wait a tiny fraction of a second for the page to appear, then scroll
    setTimeout(() => {
        const aboutSection = document.getElementById('about-us-section');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
};
// =========================================================================
// --- SEARCH FUNCTIONALITY WITH SYSTEM FALLBACK ALERTS ---
// =========================================================================
window.filterProducts = function() {
    const input = document.getElementById('product-search');
    if (!input) return;
    
    const searchTerm = input.value.trim().toLowerCase();
    
    // 1. Filter items cleanly across structural title & category baselines
    const filteredResults = allProducts.filter(product => {
        const title = (product.name || product.title || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const  tags = (product.tags || '').toLowerCase();
        return title.includes(searchTerm) || category.includes(searchTerm) || tags.includes(searchTerm);
    });

    // 2. Structural Interception: Check if search query yields empty result arrays
    if (filteredResults.length === 0) {
        const productGrid = document.querySelector('.product-grid');
        const paginationContainer = document.getElementById('pagination-controls');
        
        if (productGrid) {
            // Injects a minimal, luxury-aligned message instead of a broken blank row layout
            productGrid.innerHTML = `
                <div class="atelier-empty-search-container" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; font-family: inherit;">
                    <h3 style="font-size: 14px; letter-spacing: 3px; font-weight: 500; text-transform: uppercase; margin-bottom: 10px; color: #fff;">PRODUCT NOT FOUND</h3>
                    <p style="font-size: 11px; letter-spacing: 1px; color: #666; text-transform: uppercase; margin: 0;">We couldn't find matches for "${searchTerm}". Try adjusting your keywords.</p>
                </div>
            `;
        }
        
        // Hide pagination controls completely during an empty fallback view
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    } else {
        // Items found! Pass them directly into the standard rendering loop matrix
        renderProducts(filteredResults);
    }

    // 3. High-Contrast Search Bar UI Feedback Loops
    if (searchTerm === "") {
        input.style.borderBottomColor = "#222222"; // Premium subtle outline baseline
    } else {
        input.style.borderBottomColor = "#ffffff"; // Bold, high-contrast active state line
    }
};

    // ATELIER STORE - script.js

