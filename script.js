
import { supabase } from './supabaseClient.js';
// This goes in your Main Atelier Page API (e.g., /api/webhook)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { record } = req.body; // 'record' is the new product data from Supabase

  try {
    // Logic to update the Main Page's local state or cache
    console.log(`New product received: ${record.title}`);
    
    // Eco-Friendly Revalidation: Only update the page that changed
    // await res.revalidate(`/products/${record.id}`); 
    
    return res.status(200).json({ message: 'Sync Successful' });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
// Fetch only active products for the store
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active'); // This filters out 'pending' or 'deleted' items
let allProducts = []; 
let currentPage = 1;
const itemsPerPage = 16; 
// // --- 1. CART LOGIC ---
let cart = [];

// 1. ADD TO BAG FUNCTION
window.addToBag = function(id, title, price, imageUrl, selectedSize) {
    // If no size is selected, you might want to alert the user
    if (!selectedSize) {
        alert("Please select a size first!");
        return;
    }

    // Create a unique key for the cart (ID + Size) 
    // This prevents a 'Large' shirt from overwriting a 'Small' shirt
    const cartItemId = `${id}-${selectedSize}`;
    
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const itemToAdd = {
            cartId: cartItemId,
            id: id,
            title: title,
            price: parseFloat(price),
            image_url: imageUrl,
            size: selectedSize,
            quantity: 1
        };
        cart.push(itemToAdd);
    }

    updateCartUI();
};

// 2. UPDATE CART UI FUNCTION
function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const bagCountEl = document.getElementById('bag-count'); // This matches the ID in HTML

    if (!container) return;

    // 1. Calculate Total Quantity
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // 2. Update the Header Number
    if (bagCountEl) {
        bagCountEl.innerText = totalQuantity;
    }

    // 3. Render the Sidebar Items
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Your bag is empty.</p>';
        if (totalEl) totalEl.innerText = "₦00.00";
        return;
    }

    container.innerHTML = cart.map((item) => `
        <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;">
            <img src="${item.image_url}" width="50" height="70" style="object-fit:cover;">
            <div style="flex-grow:1;">
                <p style="margin:0; font-weight:bold; font-size:14px;">${item.title}</p>
                <p style="margin:0; font-size:12px; color:#666;">Size: ${item.size} | Qty: ${item.quantity}</p>
                <p style="margin:5px 0 0 0; font-weight:bold;">₦${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button onclick="removeFromCart('${item.cartId}')" style="color:red; background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
        </div>
    `).join('');

    // 4. Update the Total Price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalEl) totalEl.innerText = `₦${total.toFixed(2)}`;
}

// 3. REMOVE FROM CART
window.removeFromCart = function(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    updateCartUI();
};
window.openCart = () => {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
        cartPanel.classList.add('active');
    } else {
        console.error("Could not find cart-panel ID");
    }
};

window.closeCart = () => {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) cartPanel.classList.remove('active');
};
// --- 1. THE BRAIN: FETCH DATA ---
async function fetchAtelierProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return console.error('Supabase Error:', error);

    allProducts = data; // Save all 44 items to memory
    renderProducts(allProducts); // Draw Page 1
}

// --- 2. THE DRAWING: RENDER PRODUCTS (Page by Page) ---
function renderProducts(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = '';

    // 1. Pagination Calculation
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = products.slice(startIndex, startIndex + itemsPerPage);

    // 2. Loop through the 8 items for this page
paginatedItems.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    // 1. SMART SIZE LOGIC
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
    } else if (category.includes('tee') || category.includes('shirt') || category.includes('clothing')) {
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
        : '<div style="height: 42px;"></div>';

    // 2. DRAW THE CARD
    // Note: We use .replace(/'/g, "\\'") on the title to prevent single quotes from breaking the onclick string
    const escapedTitle = product.title.replace(/'/g, "\\'");

    productCard.innerHTML = `
        <div class="product-image-wrapper" onclick="window.openQuickView('${escapedTitle}', '${product.description}', '${product.image_url}', ${product.price})">
            <img src="${product.image_url}" alt="${product.title}" class="main-prod-img">
        </div>
        <div class="product-info">
            <h3>${product.title}</h3>
            <p class="price">₦${product.price}</p>
            ${sizeHTML}
            <button class="add-to-bag-btn" onclick="const s = document.getElementById('size-select-${product.id}'); window.addToBag('${product.id}', '${escapedTitle}', ${product.price}, '${product.image_url}', s ? s.value : 'N/A')">
                ADD TO BAG
            </button>
        </div>
    `;

    productGrid.appendChild(productCard);
});
    // 5. Update the 1, 2, 3... buttons
    renderPaginationControls(products.length);
}
// ATELIER QUICK VIEW LOGIC:
window.openQuickView = function(title, description, imageUrl, price) {
    console.log("Opening Quick View for:", title);
    
    // 1. Find your Modal/QuickView elements in the HTML
    const modal = document.getElementById('quick-view-modal');
    if (!modal) {
        console.error("Quick View Modal not found in HTML!");
        return;
    }

    // 2. Fill the Modal with the actual product data
    document.getElementById('qv-title').innerText = title;
    document.getElementById('qv-description').innerText = description;
    document.getElementById('qv-image').src = imageUrl;
    document.getElementById('qv-price').innerText = `₦${price}`;

    // 3. Show the Modal
    modal.style.display = 'flex';
};

// Function to close the modal
window.closeQuickView = function() {
    document.getElementById('quick-view-modal').style.display = 'none';
};

// --- 4. PAGINATION BUTTONS (1, 2, 3...) ---
function renderPaginationControls(totalItems) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = (i === currentPage) ? 'page-btn active' : 'page-btn';
        btn.onclick = () => {
            currentPage = i;
            renderProducts(allProducts);
            document.getElementById('shop-page').scrollIntoView({ behavior: 'smooth' });
        };
        container.appendChild(btn);
    }
}
// --- 4. CHECKOUT NAVIGATION ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('checkout-btn')) {
        e.preventDefault();

        // 4a. Check if bag is empty
        const subtotalCheck = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
        if (subtotalCheck <= 0) {
            alert("Your bag is empty. Please add items before checking out.");
            return;
        }

        // 4b. Visibility logic
        ['shop-page', 'about-page'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const hero = document.querySelector('.hero');
        if (hero) hero.style.display = 'none';

        if (typeof window.closeCart === 'function') window.closeCart();

        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) {
            checkoutSection.style.display = 'block';
            checkoutSection.scrollIntoView({ behavior: 'smooth' });
            updateOrderSummaryInstant();
        }
    }
});
// --- UPDATE ORDER SUMMARY ---
function updateOrderSummaryInstant() {
    const stateDropdown = document.getElementById('state');
    const subtotalEl = document.getElementById('display-subtotal');
    const shippingEl = document.getElementById('display-shipping');
    const totalEl = document.getElementById('display-total');

    if (!stateDropdown || !subtotalEl || !shippingEl || !totalEl) return;

    const destinationState = stateDropdown.value;

    let subtotal = cart.reduce((sum, item) => {
        return sum + (Number(item.price) * (item.quantity || 1));
    }, 0);

    subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;

    if (!destinationState) return;

    const shippingFee = calculateSmallItemShipping("Lagos", destinationState);
    const totalAmount = subtotal + shippingFee;

    shippingEl.textContent = `₦${shippingFee.toLocaleString()}`;
    totalEl.textContent = `₦${totalAmount.toLocaleString()}`;

    // Store globally for payment
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

// --- 5. MAIN PAYMENT LOGIC ---
document.addEventListener("click", function(e) {
    // Check if the clicked element is our payment button
    if (e.target && e.target.id === "payBtn") {
        e.preventDefault();
        console.log("Atelier: Payment Sequence Initiated");

        const shippingForm = document.getElementById('shipping-form');
        const formData = new FormData(shippingForm);

        // Validation
        const email = formData.get('email');
        const total = window.calculatedTotal || 0;

        if (!email || total <= 0) {
            alert("Please complete shipping details and select a state.");
            return;
        }

        // Force launch Paystack
        try {
            const handler = PaystackPop.setup({
                key: 'pk_test_f530e65d4cebf50a588673f69d1512b7cae51e02',
                email: email,
                amount: Math.round(total * 100),
                currency: 'NGN',
                callback: function(response) {
                     console.log("Payment Success:", response.reference);
                     // Construct data for Supabase
                     const orderData = {
                     id: response.reference,
                     email: email,
                     name: formData.get('full_name'),
                     phone: formData.get('phone'),
                     total_amount: total,
                     address: `${formData.get('street_address')}, ${formData.get('city')}`,
                     shipping_region: document.getElementById('state').value, // Must match a 'region_name' in DB
                     seller_id: '00000000-0000-0000-0000-000000000001',
                     items: typeof cart !== 'undefined' ? JSON.stringify(cart) : "[]"
                    };
                     saveOrderToSupabase(orderData);
                },
                onClose: function() {
                    alert("Checkout closed.");
                }
            });
            handler.openIframe();
        } catch (err) {
            console.error("Paystack Library Error:", err);
        }
    }
});
// --- 6. SAVE ORDER TO SUPABASE ---
async function saveOrderToSupabase(orderData) {
    console.log("Atelier: Initiating database sync for Order:", orderData.id);

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([
                {
                    id: orderData.id,                  // Paystack Reference
                    customer_email: orderData.email,
                    customer_name: orderData.name,
                    customer_phone: orderData.phone,
                    total_amount: orderData.total_amount,
                    status: 'Paid',                    // Auto-set to Paid after Paystack success
                    seller_id: orderData.seller_id,
                    commission_fee: orderData.commission_fee,
                    shipping_fee_seller: orderData.shipping_fee_seller,
                    net_payout: orderData.net_payout,
                    tracking_number: orderData.id,     // Synced to Reference
                    shipping_region: orderData.shipping_region,
                    address: orderData.address,
                    items: orderData.items             // JSON stringified cart
                }
            ]);

        if (error) throw error;

        console.log("Atelier: Database sync successful!");

        // Trigger the Email confirmation ONLY after DB success
        sendAtelierEmail(
            orderData.id, 
            orderData.email, 
            orderData.total_amount
        );

    } catch (err) {
        console.error("Atelier Critical Error:", err.message);
        alert("Payment verified, but database sync failed. Please save your Tracking ID: " + orderData.id);
        
        // Fail-safe: Redirect to home even if DB fails so user isn't stuck
        setTimeout(() => { window.location.href = "index.html"; }, 5000);
    }
}

// --- 7. EMAIL CONFIRMATION ---
function sendAtelierEmail(ref, customerEmail, amount) {
    if (!customerEmail) {
        console.error("Atelier Error: No recipient email found.");
        return;
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

    emailjs.send('service_zi3z4lm', 'template_9lhj8aj', templateParams)
        .then((res) => {
            console.log("Atelier: Email SUCCESS", res.status, res.text);
            alert("Order Confirmed! Check your inbox.");
            window.location.href = "index.html"; 
        })
        .catch(err => {
            // This is where your "Email service busy" alert comes from
            console.error("Atelier Email Detailed Error:", err);
            
            // Helpful alert for debugging
            alert(`Order Saved! Ref: ${ref}. Email failed: ${err.text || 'Check console'}`);
            
            window.location.href = "index.html";
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
// --- SEARCH FUNCTIONALITY ---
window.filterProducts = function() {
    const input = document.getElementById('product-search');
    const searchTerm = input.value.trim().toLowerCase();
    
    // 1. Filter products from your main data array
    const filteredResults = allProducts.filter(product => {
        const title = (product.title || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        return title.includes(searchTerm) || category.includes(searchTerm);
    });

    // 2. Update the display
    renderProducts(filteredResults);

    // 3. UI feedback: If search is empty, make sure line is standard
    if (searchTerm === "") {
        input.style.borderBottomColor = "#e0e0e0";
    } else {
        input.style.borderBottomColor = "#000";
    }
};

    // ATELIER STORE - script.js

