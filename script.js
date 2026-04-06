
import { supabase } from './supabaseClient.js';
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
            checkoutSection.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }
});

// B. BACK TO SHOP (From Shipping back to Store)
window.backToShop = function() {
    // 1. Hide the checkout form
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) checkoutSection.style.display = 'none';

    // 2. Bring back the Brand Identity (Hero) and Products
    const hero = document.querySelector('.hero');
    const shopPage = document.getElementById('shop-page');
    
    if (hero) hero.style.display = 'flex'; // Restores your fashion background
    if (shopPage) shopPage.style.display = 'block';

    // 3. Smoothly slide back to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 6. STOP THE PAGE REFRESH (Critical) ---
document.getElementById('shipping-form').addEventListener('submit', (e) => {
    e.preventDefault(); 
    // Your Paystack logic goes here...
});
const shippingForm = document.getElementById('shipping-form');

if (shippingForm) {
    shippingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // 1. Collect customer info directly from the form
        const email = shippingForm.email.value;
        const name = shippingForm.full_name.value;
        const phone = shippingForm.phone.value;

        // 2. Calculate actual total (Ensure 'cart' is your global array name)
        // If 'cart' is empty, it returns 0
        const totalAmount = cart.reduce((sum, item) => {
            return sum + (Number(item.price) * (item.quantity || 1));
        }, 0);

        // 3. Stop if the bag is empty
        if (totalAmount <= 0) {
            alert("Your bag is empty. Please add items before checking out.");
            return;
        }

        console.log("Processing payment for:", name, "Total:", totalAmount);

         // 4. Initialize Paystack with the collected info and total amount

let handler = PaystackPop.setup({
  key: 'pk_test_f530e65d4cebf50a588673f69d1512b7cae51e02',
  email: email,
  amount: totalAmount * 100,
  currency: 'NGN',
    
            ref: 'ATL-' + Math.floor((Math.random() * 1000000000) + 1),
            callback: function(response) {
    // 1. Show the success alert
    alert('Payment Successful! Reference: ' + response.reference);

    // 2. Prepare the customer data to save
    const customerData = {
        name: shippingForm.full_name.value,
        email: email,
        total: totalAmount,
        items: cart // This is your array of bag items
    };

    // 3. Run the function that talks to Supabase
    saveOrderToSupabase(response.reference, customerData);
},

            onClose: function() {
                alert('Checkout cancelled.');
            }
            
        });

        handler.openIframe();
    });
}
async function saveOrderToSupabase(reference, customerData) {
    const { data, error } = await supabase
.from('orders')
.insert([
    { 
        status: 'paid',
        payment_ref: reference,
        customer_name: customerData.name,
        email: customerData.email,
        amount: customerData.total,
        items: cart.map(item => ({
            name: item.name,
            size: item.size,
            image: item.img,
            price: item.price,
            quantity: item.quantity || 1
        }))
    }
]);

    if (error) {
        console.error('Database Error:', error);
    } else {
        alert('Atelier Order Confirmed! We are processing your shipment.');
        // Clear the cart and refresh to show the home page again
        localStorage.removeItem('cart');
        window.location.reload(); 
    }
}
// ATELIER NAVIGATION FIX:
// This ensures that clicking "SHOP" at the top always shows the products
document.querySelectorAll('a[href="#shop"]').forEach(link => {
    link.addEventListener('click', (e) => {
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
window.scrollToAbout = function(e) {
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