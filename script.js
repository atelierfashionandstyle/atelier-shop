import { supabase } from './supabaseClient.js';

// =========================================================================
// --- 1. GLOBAL SYSTEM STATE MEMORY & RUNTIME MATRIX ---
// =========================================================================
let allProducts = [];          // Stores your collection data from Supabase
let currentPage = 1;           // Tracks active viewing page frame
let itemsPerPage = 8;          // Controls how many luxury pieces show at once

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
        // Internal structured fallback array so your page never layout-collapses
        allProducts = [{
            id: "fallback_01",
            name: "ATELIER LUXURY OVERCOAT",
            base_price: 125000,
            category: "clothing",
            images: ["fashion.jpg.jpg"],
            limited_stock: true,
            description: "STORY:\nCrafted for elite silhouettes.\n\nHIGHLIGHTS:\nPremium Custom Cotton\nHandmade in Lagos"
        }];
        renderProducts(allProducts);
    }
}

// =========================================================================
// --- 3. CORE PRODUCT RENDERING ENGINE ---
// =========================================================================
function renderProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = '';

    const totalItemsCount = products.length;
    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = products.slice(startIndex, endIndex);

    paginatedItems.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'atelier-product-card'; 
        productCard.setAttribute('data-product-id', product.id); // Fixed missing lookup link layer

        const productTitle = product.name || product.title || "ATELIER Piece";
        const productPrice = product.base_price || product.price || 0;
        
        const originalPrice = product.original_price || Math.round(productPrice * 1.35); 
        const discountPercentage = Math.round(((originalPrice - productPrice) / originalPrice) * 100);

        let imageArray = [];
        if (Array.isArray(product.images) && product.images.length > 0) {
            imageArray = product.images;
        } else if (product.image_url) {
            imageArray = [product.image_url];
        } else {
            imageArray = ['https://via.placeholder.com/600x800?text=ATELIER'];
        }
        
        const mainImageUrl = imageArray[0];
        const secondaryImageUrl = imageArray[1] || mainImageUrl;

        let sizeOptions = '';
        const category = (product.category || '').toLowerCase();

        if (category.includes('slide') || category.includes('footwear') || category.includes('shoe')) {
            sizeOptions = `
                <option value="40">40</option>
                <option value="41">41</option>
                <option value="42" selected>42</option>
                <option value="43">43</option>
                <option value="44">44</option>
                <option value="45">45</option>`;
        } else if (category.includes('tee') || category.includes('shirt') || category.includes('clothing') || category.includes('suit')) {
            sizeOptions = `
                <option value="S">S</option>
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>`;
        }

        const sizeHTML = sizeOptions ? `
            <select id="size-select-${product.id}" class="atelier-size-select">
                ${sizeOptions}
            </select>` 
            : '<div class="size-select-spacer"></div>';

        productCard.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${mainImageUrl}" alt="${productTitle}" class="product-main-img">
                ${product.limited_stock ? '<span class="luxury-stock-badge">LIMITED PIECES</span>' : ''}
            </div>
            <div class="product-info-wrapper">
                <h3 class="product-brand-title">ATELIER</h3>
                <p class="product-item-name">${productTitle}</p>
                <div class="luxury-price-row">
                    <span class="current-price">₦${Number(productPrice).toLocaleString()}</span>
                    <span class="original-strike-price">₦${Number(originalPrice).toLocaleString()}</span>
                    <span class="percentage-pill">-${discountPercentage}%</span>
                </div>
                ${sizeHTML}
                <button type="button" class="luxury-add-trigger">ADD TO BAG</button>
            </div>
        `;

        const imageEl = productCard.querySelector('.product-main-img');
        if (mainImageUrl !== secondaryImageUrl) {
            productCard.addEventListener('mouseenter', () => { imageEl.src = secondaryImageUrl; });
            productCard.addEventListener('mouseleave', () => { imageEl.src = mainImageUrl; });
        }

        const imageWrapper = productCard.querySelector('.product-image-wrapper');
        imageWrapper.addEventListener('click', () => {
            window.openQuickView(productTitle, product.description || '', imageArray, productPrice);
        });

        const bagBtn = productCard.querySelector('.luxury-add-trigger');
        bagBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const sizeSelect = productCard.querySelector(`#size-select-${product.id}`);
            const selectedSize = sizeSelect ? sizeSelect.value : 'M';
            window.addToBag(product.id, productTitle, productPrice, mainImageUrl, selectedSize);
        });

        productGrid.appendChild(productCard);
    });

    renderPaginationControls(products.length);
}

// =========================================================================
// --- 4. ATELIER PREMIUM QUICK VIEW INTERFACE LOGIC ---
// =========================================================================
window.openQuickView = function(title, mixedDescription, images, price) {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return console.error("Quick View Modal structure missing from DOM!");

    const imageArray = Array.isArray(images) ? images : [images];
    let storyText = mixedDescription || "";
    let highlightsText = "";

    if (storyText.includes("STORY:\n") && storyText.includes("\n\nHIGHLIGHTS:\n")) {
        const parts = storyText.split("\n\nHIGHLIGHTS:\n");
        storyText = parts[0].replace("STORY:\n", "");
        highlightsText = parts[1] || "";
    } else {
        storyText = storyText.replace(/\n/g, '<br>');
    }

    const titleEl = document.getElementById('qv-title');
    if (titleEl) titleEl.textContent = title.toUpperCase();

    const priceEl = document.getElementById('qv-price');
    if (priceEl) priceEl.innerHTML = `₦${Number(price).toLocaleString()}`;
    
    const descContainer = document.getElementById('qv-description');
    if (descContainer) {
        let highlightsHTML = '';
        if (highlightsText.trim()) {
            const bulletLines = highlightsText.split('\n').filter(l => l.trim() !== "");
            highlightsHTML = `
                <div class="qv-highlights-box">
                    <span class="qv-highlights-header">HIGHLIGHTS</span>
                    <ul class="qv-highlights-list">
                    <button type="button" class="luxury-add-trigger">ADD TO BAG</button>
                        ${bulletLines.map(line => `<li>${line}</li>`).join('')}
                    </ul>
                    
                </div>`;
        }
        descContainer.innerHTML = `
            <div class="qv-story-text">${storyText}</div>
            ${highlightsHTML}
        `;
    }

    const mainImgEl = document.getElementById('qv-image');
    if (mainImgEl && imageArray.length > 0) {
        mainImgEl.src = imageArray[0];
    }

    let thumbnailRow = document.getElementById('qv-thumbnails-row');
    if (!thumbnailRow && mainImgEl) {
        thumbnailRow = document.createElement('div');
        thumbnailRow.id = 'qv-thumbnails-row';
        thumbnailRow.className = 'quickview-thumbnails-container';
        mainImgEl.parentNode.appendChild(thumbnailRow);
    }
    
    if (thumbnailRow) {
        thumbnailRow.innerHTML = '';
        if (imageArray.length > 1) {
            imageArray.forEach(imgUrl => {
                const thumbImg = document.createElement('img');
                thumbImg.src = imgUrl;
                thumbImg.alt = "Preview Thumbnail";
                thumbImg.className = "qv-thumbnail-item";
                thumbImg.addEventListener('mouseover', () => {
                    if (mainImgEl) mainImgEl.src = imgUrl;
                });
                thumbnailRow.appendChild(thumbImg);
            });
        }
    }
    modal.style.display = 'flex';
};

window.closeQuickView = function() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.style.display = 'none';
};

// =========================================================================
// --- 5. PREMIUM CATALOG INTERFACE NAVIGATION ENGINE ---
// =========================================================================
function renderPaginationControls(totalItems) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;
    container.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return; // Hidden completely if everything fits beautifully on one screen

    // --- Dynamic Slider Constraints ---
    // Sets how many page numbers show up around the active window viewport frame
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
        if (isDisabled) {
            btn.disabled = true;
            btn.classList.add('disabled');
        } else {
            btn.addEventListener('click', () => {
                currentPage = targetPage;
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

// Microsecond Viewport Anchor Handler
function scrollToShopHeader() {
    const targetShopPage = document.getElementById('shop-page');
    if (targetShopPage) {
        targetShopPage.scrollIntoView({ behavior: 'smooth' });
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

    // --- STEP 2: ATTACH TO SPECIFIC CHANNELS DETACHED FROM INLINE ONCLICK ---
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Atelier Interface Trigger: Forwarding request to Paystack Engine.");
            window.payWithPaystack();
        });
    }

    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
});

// =========================================================================
// --- 3. PAYSTACK GATEWAY LIFECYCLE SEQUENCE ---
// =========================================================================
window.payWithPaystack = function () {
    console.log("Atelier: Payment Sequence Initiated");

    const checkoutData = collectCheckoutFormData();
    if (!checkoutData) return; 

    if (typeof PaystackPop === 'undefined' || !PaystackPop.setup) {
        alert("Paystack SDK failed to load. Please verify your script references.");
        return;
    }

    // Traditional wrapper mapping function to resolve dynamic structural async promises
    const executePayloadSynchronization = function(referenceCode) {
        const compiledOrderPayload = {
            id: referenceCode,
            email: checkoutData.email,
            name: checkoutData.fullName,
            phone: checkoutData.phone,
            total_amount: checkoutData.calculatedTotal,
            status: 'Paid',
            seller_id: "00000000-0000-0000-0000-000000000001", // Static seller ID for this implementation
            commission_fee: 0,
            shipping_fee_seller: 0,
            net_payout: checkoutData.calculatedTotal,
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
        metadata: {
            customer_name: checkoutData.fullName,
            customer_phone: checkoutData.phone
        },
        callback: function (response) {
            console.log("Paystack Verification Handshake Verified. Reference Code:", response.reference);
            executePayloadSynchronization(response.reference);
        },
        onClose: function () {
            console.log("Atelier Checkout: Customer closed payment window.");
        }
    });

    handler.openIframe();
};

// =========================================================================
// --- 4. SUPABASE TRANSACTIONAL INTEGRATION ENGINE ---
// =========================================================================
window.saveOrderToSupabase = async function (orderData) {
    console.log("Atelier Sync Core: Opening channel transaction for ID:", orderData.id);

    // Explicitly pull the global database instance we initialized in index.html
    const clientDbEngine = window.supabaseClientInstance;

    if (!clientDbEngine || typeof clientDbEngine.from !== 'function') {
        console.error("Atelier Sync Error: Global database instance structure is missing or unassigned.");
        alert("Database connection offline. Processing transactional email recovery cascade...");
        await processPostPaymentAutomations(orderData);
        return;
    }

    try {
        // Execute remote record insert mapping directly to your Supabase table schema
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
                    seller_id: orderData.seller_id,
                    commission_fee: Number(orderData.commission_fee),
                    shipping_fee_seller: Number(orderData.shipping_fee_seller),
                    net_payout: Number(orderData.net_payout),
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
        alert(`Database Sync Delayed: ${err.message || err}`);
    } finally {
        // Execute email delivery and page state tear down
        await processPostPaymentAutomations(orderData);
    }
};

// =========================================================================
// --- 5. POST-TRANSACTION WORKFLOW AUTOMATIONS ---
// =========================================================================
async function processPostPaymentAutomations(orderData) {
    console.log("Atelier Core Lifecycle: Processing order teardown and notification sequences.");

    // Clear active shopping bag configurations cleanly
    window.atelierMemoryCart = [];
    localStorage.removeItem('cart');

    if (typeof window.updateCartUI === 'function') {
        try { window.updateCartUI(); } catch(e) { console.error(e); }
    }

    // Fire EmailJS sequence to dispatch notifications immediately 
    if (typeof window.sendAtelierEmail === 'function' || typeof sendAtelierEmail === 'function') {
        try {
            console.log("Atelier Sync Core: Triggering EmailJS operational channels.");
            const emailFn = window.sendAtelierEmail || sendAtelierEmail;
            
            // This will now correctly pause execution until EmailJS finishes its network loop
            await emailFn(orderData.id, orderData.email, orderData.total_amount);
            
            alert(`Payment Received & Order Confirmed!\nYour Atelier Order ID is: ${orderData.id}\nCheck your inbox for confirmation.`);
        } catch (emailErr) {
            console.error("Atelier Email Automation Trigger Exception:", emailErr);
            alert(`Order Saved successfully (ID: ${orderData.id}), but confirmation email failed to dispatch. Our admin team will process manually.`);
        }
    } else {
        console.warn("Atelier Warning: Global email routing channel unmapped on lifecycle thread.");
        alert(`Payment Received Successfully!\nYour Atelier Order ID is: ${orderData.id}`);
    }

    // =========================================================================
    // SAFE REDIRECTION: Runs only after the email sequence settles completely
    // =========================================================================
    window.location.href = window.location.origin + window.location.pathname;
}

// --- 7. EMAIL CONFIRMATION ---
function sendAtelierEmail(ref, customerEmail, amount) {
    if (!customerEmail) {
        console.error("Atelier Error: No recipient email found.");
        return Promise.reject("Missing customer email address.");
    }

    // Ensure initialization is fresh
    emailjs.init("0pSpit0Eoff3xV_O9"); 

    const templateParams = {
        to_email: customerEmail, 
        order_id: ref,           
        total_amount: `₦${Number(amount).toLocaleString()}`,
        track_link: `https://atelier-shop-psi.vercel.app/track-order.html?id=${ref}`
    };

    console.log("Atelier: Attempting email dispatch...", templateParams);

    // CRITICAL: Added 'return' here so the checkout engine can accurately await it
    return emailjs.send('service_zi3z4lm', 'template_9lhj8aj', templateParams)
        .then((res) => {
            console.log("Atelier: Email SUCCESS", res.status, res.text);
            return res; // Pass success up the execution context
        })
        .catch(err => {
            console.error("Atelier Email Detailed Error:", err);
            throw err; // Pass error up to the try/catch handler safely
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
        return title.includes(searchTerm) || category.includes(searchTerm);
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

