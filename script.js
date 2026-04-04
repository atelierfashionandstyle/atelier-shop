
import { supabase } from './supabaseClient.js';
let allProducts = []; 
let currentPage = 1;
const itemsPerPage = 16; 
// // --- 1. CART LOGIC ---
let cart = [];

window.addToBag = (name, price, img, id) => {
    // Get the size from the dropdown menu
    const sizeElement = document.getElementById(`size-${id}`);
    const selectedSize = sizeElement ? sizeElement.value : 'N/A';

    // Add item to the cart array
    cart.push({ 
        name: name, 
        price: parseFloat(price), // Ensures price is a number, not text
        img: img, 
        size: selectedSize 
    });

    updateCartUI();
};
function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    if (!container) return;

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
            <img src="${item.img}" width="50" height="70" style="object-fit:cover;">
            <div style="flex-grow:1;">
                <h4 style="margin:0; font-size:14px; color:white;">${item.name}</h4>
                <p style="margin:0; font-size:12px; color:#888;">Size: ${item.size}</p>
                <p style="margin:0; font-weight:bold; color:white;">$${item.price.toFixed(2)}</p>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4444; cursor:pointer;">✕</button>
        </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
    const bagCount = document.getElementById('bag-count');
    if (bagCount) {
    bagCount.innerText = cart.length;
}

}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
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

    // Calculate which 8 items to show for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = products.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image_url}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>$${product.price}</p>
            <button class="add-to-bag-btn" onclick="window.addToBag('${product.title}', ${product.price}, '${product.image_url}')">ADD TO BAG</button>
        `;
        productGrid.appendChild(productCard);
    });

    renderPaginationControls(products.length); // Update the 1, 2, 3 buttons
}

// --- 4. PAGINATION BUTTONS (1, 2, 3...) ---
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

        // 3. SMART SIZE LOGIC: Check category from Supabase
        let sizeOptions = '';
        const category = (product.category || '').toLowerCase();

        if (category.includes('slide') || category.includes('footwear') || category.includes('shoe')) {
            sizeOptions = `
                <option value="40">40</option>
                <option value="41">41</option>
                <option value="42" selected>42</option>
                <option value="43">43</option>
                <option value="45">45</option>
            `;
        } else if (category.includes('tee') || category.includes('shirt') || category.includes('clothing')) {
            sizeOptions = `
                <option value="S">S</option>
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
            `;
        }

        // Only create the dropdown if sizes are needed
        const sizeHTML = sizeOptions ? `
            <select id="size-select-${product.id}" class="atelier-size-select">
                ${sizeOptions}
            </select>
        ` : '<div style="height: 42px;"></div>'; // Spacer for items with no size

        // 4. DRAW THE CARD (Restoring Image Click and Description)
        productCard.innerHTML = `
            <div class="product-image-wrapper" onclick="window.openQuickView('${product.title}', '${product.description || 'Luxury Atelier Essential'}', '${product.image_url}', ${product.price})">
                <img src="${product.image_url}" alt="${product.title}" class="main-prod-img">
            </div>
            <div class="product-info">
                <h3>${product.title}</h3>
                <p class="price">$${product.price}</p>
                ${sizeHTML}
                <button class="add-to-bag-btn" onclick="window.addToBag('${product.id}', '${product.title}', ${product.price}, '${product.image_url}', document.getElementById('size-select-${product.id}')?.value || 'N/A')">
                    ADD TO BAG
                </button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    // 5. Update the 1, 2, 3... buttons
    renderPaginationControls(products.length);
}


// --- 5. CHECKOUT TOGGLE LOGIC ---
// This hides the shop and shows the form instantly
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('checkout-btn')) { // From Bag to Shipping
        document.getElementById('shop-page').style.display = 'none';
        document.getElementById('checkout-section').style.display = 'block';
        window.scrollTo(0, 0);
    }
    
    if (e.target.id === 'back-to-shop') { // From Shipping back to Shop
        document.getElementById('checkout-section').style.display = 'none';
        document.getElementById('shop-page').style.display = 'block';
        window.scrollTo(0, 0);
    }
});

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
