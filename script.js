
import { supabase } from './supabaseClient.js';
// This goes in your Main Atelier Page API (e.g., /api/webhook)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { record, type } = req.body; // 'record' is the new product data from Supabase

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
        if (totalEl) totalEl.innerText = "$0.00";
        return;
    }

    container.innerHTML = cart.map((item) => `
        <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;">
            <img src="${item.image_url}" width="50" height="70" style="object-fit:cover;">
            <div style="flex-grow:1;">
                <p style="margin:0; font-weight:bold; font-size:14px;">${item.title}</p>
                <p style="margin:0; font-size:12px; color:#666;">Size: ${item.size} | Qty: ${item.quantity}</p>
                <p style="margin:5px 0 0 0; font-weight:bold;">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button onclick="removeFromCart('${item.cartId}')" style="color:red; background:none; border:none; cursor:pointer; font-size:18px;">&times;</button>
        </div>
    `).join('');

    // 4. Update the Total Price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
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
        console.log("Bag opened");
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
            <p class="price">$${product.price}</p>
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
    document.getElementById('qv-price').innerText = `$${price}`;

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
// --- 5. CHECKOUT & NAVIGATION LOGIC ---

// A. PROCEED TO CHECKOUT (From Bag to Shipping)
function showCheckoutSummary() {
    const checkoutSection = document.getElementById('checkout-section');
    const summarySection = document.querySelector('.shipping-summary');

    if (checkoutSection && checkoutSection.offsetParent !== null) {
        summarySection.style.display = 'block';
        updateOrderSummaryInstant();
    } else {
        summarySection.style.display = 'none';
    }
}
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('checkout-btn')) {
        e.preventDefault(); // Stops the page from jumping

        // Hide everything that isn't the checkout form
        const sectionsToHide = ['shop-page', 'about-page'];
        sectionsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const hero = document.querySelector('.hero');
        if (hero) hero.style.display = 'none';

        // Close the Bag sidebar
        if (typeof window.closeCart === 'function') {
            window.closeCart();
        }

        // Show Checkout and jump directly to it
        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) {
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
    
    // Call it here!
  document.addEventListener("DOMContentLoaded", () => {
    const stateSelect = document.getElementById('state');

    stateSelect.addEventListener('change', function() {
        updateOrderSummaryInstant();
    });
});
}// 2. Calculate Subtotal from cart
let subtotal = cart.reduce((sum, item) => {
    return sum + (Number(item.price) * (item.quantity || 1));
}, 0);
// Function to update the UI with a professional delay
function updateOrderSummaryInstant() {
    const stateDropdown = document.getElementById('state');
    const statusText = document.getElementById('shipping-status');
    const destinationState = stateDropdown.value;
    const subtotalEl = document.getElementById('display-subtotal');
    subtotalEl.textContent = subtotal.toLocaleString();

    if (!destinationState) return;

    // Simulate a brief "live" check (500ms)
    setTimeout(() => {
        // 1. Calculate subtotal
        let subtotal = cart.reduce((sum, item) => {
            return sum + (Number(item.price) * (item.quantity || 1));
        }, 0);

        // 2. Run the calculation logic
        const shippingFee = calculateSmallItemShipping("Lagos", destinationState);
        const totalAmount = subtotal + shippingFee;

        // 3. Update the UI
        document.getElementById('display-subtotal').textContent = subtotal.toLocaleString();
        document.getElementById('display-shipping').innerText = shippingFee.toLocaleString();
        document.getElementById('display-total').innerText = totalAmount.toLocaleString();
        

    }, 500); 
}

// Event Listener
document.getElementById('state').addEventListener('change', updateOrderSummaryInstant);
// 3. Define Shipping Fee and Calculate Final Total
const calculateSmallItemShipping = (origin, destination) => {
  // Current 2025 Jumia-style rates for packages <2kg
  const rates = {
    "lagos-lagos": 1400,
    "lagos-abuja": 2000,
    "lagos-port harcourt": 2500,
    "lagos-ibadan": 1700,
    "lagos-kano": 3000,
    "lagos-enugu": 2500,
    "lagos-ogun": 1800,
    
  };
document.getElementById('state').addEventListener('change', function() {
    const displayShipping = document.getElementById('display-shipping');
    const displayTotal = document.getElementById('display-total');
    const selectedState = this.value;

    // 1. Show "Calculating" immediately
    displayShipping.innerText = "Calculating...";
    displayTotal.innerText = "---";

    // 2. Add a tiny delay for that "Live" feel
    setTimeout(() => {
        // Use your existing function
        const fee = calculateSmallItemShipping("Lagos", selectedState);
        
        // Calculate Subtotal (Ensure 'cart' is defined globally)
        let subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        
        const finalTotal = subtotal + fee;

        // 3. Update the UI
        displayShipping.innerText = `₦${fee.toLocaleString()}`;
        displayTotal.innerText = `₦${finalTotal.toLocaleString()}`;
        
        // Save for Paystack later
        window.calculatedTotal = finalTotal;
        window.calculatedShippingFee = fee;
        window.calculatedSubtotal = subtotal;
        }, 100);
});
  const key = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
  
  // Default to a higher interstate rate if the route isn't listed
  const baseRate = rates[key] || 3000; 

  // Jumia adds a 7.5% VAT to the base shipping fee
  const vat = baseRate * 0.075;
  return baseRate + vat;
};

const shippingFee = calculateSmallItemShipping("Lagos", "Abuja");
const totalAmount = subtotal + shippingFee;

// 4. Stop if the bag is empty (comparing subtotal here is safer)
if (subtotal <= 0) {
    alert("Your bag is empty. Please add items before checking out.");
    return;
}
    }
});
// B. BACK TO SHOP (From Shipping back to Store)
window.backToShop = function() {
    // 1. Hide the checkout form
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) checkoutSection.style.display = 'none';

    // 2. Restore hero and shop page
    const hero = document.querySelector('.hero');
    const shopPage = document.getElementById('shop-page');
    const aboutPage = document.getElementById('about-page');
    
    if (hero) hero.style.display = 'flex';
    if (shopPage) shopPage.style.display = 'block';
    if (aboutPage) aboutPage.style.display = 'none';

    // 3. Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener("DOMContentLoaded", () => {

    const shippingForm = document.getElementById('shipping-form');

    if (!shippingForm) return;

    shippingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // ✅ SAFE DATA COLLECTION
        const email = shippingForm.querySelector('[name="email"]').value.trim();
        const name = shippingForm.querySelector('[name="full_name"]').value.trim();
        const phone = shippingForm.querySelector('[name="phone"]').value.trim();
        const state = document.getElementById('state').value;
        const street = shippingForm.querySelector('[name="street_address"]').value.trim();
        const city = shippingForm.querySelector('[name="city"]').value.trim();

        // ✅ CALCULATIONS
        const subtotal = cart.reduce((sum, item) => 
            sum + (Number(item.price) * (item.quantity || 1)), 0
        );

        const shippingFee = calculateSmallItemShipping("Lagos", state);
        const totalAmount = subtotal + shippingFee;

        const commissionFee = totalAmount * 0.10;
        const netPayout = totalAmount - commissionFee - shippingFee;

        // ✅ PAYSTACK
        let handler = PaystackPop.setup({
            key: 'pk_test_f530e65d4cebf50a588673f69d1512b7cae51e02',
            email: email,
            amount: Math.round(totalAmount * 100),
            currency: 'NGN',

            callback: function(response) {

                const reference = response.reference;

                // ✅ FIXED CUSTOMER DATA
                const customerData = {
                    id: reference,
                    email: email,
                    name: name,
                    phone: phone,
                    total_amount: totalAmount,
                    status: 'Paid',
                    seller_id: '00000000-0000-0000-0000-000000000001',
                    tracking_number: reference,
                    commission_fee: commissionFee,
                    shipping_fee_seller: shippingFee,
                    net_payout: netPayout,
                    shipping_region: state,
                    address: `${street}, ${city}, ${state}`,
                    items: JSON.stringify(cart)
                };
                
                console.log(`Processing payment for: ${customerData.customer_name}, Total: ${totalAmount}`);
                // ✅ FIXED CALL
                saveOrderToSupabase(reference, customerData);
            }
        });

        handler.openIframe();
    });

});
async function saveOrderToSupabase(customerData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([
            {
                id: customerData.id,
                customer_email: customerData.email,
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                total_amount: customerData.total_amount,
                commission_fee: customerData.commission_fee,
                shipping_fee_seller: customerData.shipping_fee_seller,
                net_payout: customerData.net_payout,
                status: 'Paid',
                seller_id: customerData.seller_id,
                tracking_number: customerData.tracking_number,
                shipping_region: customerData.shipping_region,
                address: customerData.address,
                items: customerData.items
            }
        ]);

    if (error) {
        console.error("Supabase Error:", error.message);
        return; // STOP if DB fails
    }

    console.log("Order Recorded Successfully.");

    // SEND EMAIL ONLY AFTER SUCCESS
    sendAtelierEmail(
        customerData.tracking_number,
        customerData.email,
        customerData.total_amount
    );
}
function sendAtelierEmail(ref, email, amount) {
    if (!email) {
        console.error("No email provided. Cannot send email.");
        return;
    }

    console.log("Database confirmed. Syncing EmailJS...");
    console.log("EMAIL BEING SENT:", email);

    const templateParams = {
        to_email: email,
        tracking_number: ref,
        total_amount: `₦${amount}`,
        track_link: `https://atelier-shop-psi.vercel.app/track-order.html?id=${ref}`
    };

    emailjs.send('service_zi3z4lm', 'template_9lhj8aj', templateParams)
        .then(() => {
            alert("Atelier Order Confirmed! Email Sent.");

            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(err => {
            console.log("EmailJS Error:", err);
        });
}
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

async function fetchTrackingStatus() {
    const trackingId = document.getElementById('tracking-id-input').value;
    const resultDiv = document.getElementById('tracking-result');

    // 1. Fetch live data from Supabase
    const { data, error } = await supabase
        .from('orders')
        .select('id, status, updated_at')
        .eq('tracking_number', trackingId)
        .single();

    if (error || !data) {
        alert("Tracking number not found. Please check and try again.");
        return;
    }

    // 2. Map Status to Progress Bar %
    const statusMap = {
        'pending': 25,
        'ready_to_ship': 50,
        'shipped': 75,
        'delivered': 100
    };

    // 3. Update the UI
    resultDiv.style.display = 'block';
    document.getElementById('current-status').innerText = data.status.toUpperCase();
    document.getElementById('display-order-id').innerText = data.id;
    document.getElementById('last-updated').innerText = new Date(data.updated_at).toLocaleString();
    document.getElementById('progress-fill').style.width = `${statusMap[data.status]}%`;
    window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const autoId = urlParams.get('id');
    
    if (autoId) {
        document.getElementById('tracking-id-input').value = autoId;
        fetchTrackingStatus(); // This runs the search immediately
    }
};
}    // ATELIER LOGISTICS GATEWAY - script.js
async function handleCourierScan(orderId) {

    const { data, error: fetchError } = await supabase
        .from('orders')
        .select('customer_email')
        .eq('id', orderId)
        .single();

    if (fetchError) {
        console.error("Fetch Error:", fetchError.message);
        return;
    }

    const customerEmail = data.customer_email;

    const { error } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', orderId);

    if (error) {
        console.error("Update Error:", error.message);
        return;
    }

    sendShippedEmail(orderId, customerEmail);

    // 2. Send Email
    const templateParams = {
    to_email: email,
    tracking_number: ref,
    total_amount: `₦${amount}`,
    track_link: `https://atelier-shop-psi.vercel.app/track-order.html?id=${ref}`
};

    emailjs.send('service_zi3z4lm', 'template_bgqmsan', templateParams)
        .then(() => {
            alert("Status Updated & Buyer Notified!");
        })
        .catch(err => {
            console.error("EmailJS Error:", err);
        });
}