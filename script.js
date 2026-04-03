function startLoading() {
  const bar = document.getElementById('loader-bar');
  bar.style.width = '100%';
  setTimeout(() => { bar.style.width = '0%'; }, 1000); // Hide after load
}
import { supabase } from './supabaseClient.js';
let allProducts = []; // This must be at the top of the file
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
async function fetchAtelierProducts() {
    const productGrid = document.querySelector('.product-grid');
    const { data, error } = await supabase.from('products').select('*');

    if (error) return console.error(error);
    
                productGrid.innerHTML = data.map(product => {
            const sizes = product.category === 'footwear' ? [7, 8, 9, 10, 11] : ['S', 'M', 'L', 'XL'];
            const sizeOptions = sizes.map(s => `<option value="${s}">${s}</option>`).join('');

            return `
                <div class="product-card">
                    <div class="image-container" onclick="window.openQuickView('${product.title}', ${product.price}, '${product.image_url}', '${product.description}')">
                        <img src="${product.image_url || 'https://via.placeholder.com'}" alt="${product.title}">
                    </div>
                    <h3>${product.title}</h3>
                    <p class="price">$${product.price}</p>
                    <select id="size-${product.id}" class="size-select">
                        ${sizeOptions}
                    </select>
                    <button class="add-to-cart" onclick="window.addToBag('${product.title}', ${product.price}, '${product.image_url}', '${product.id}')">
                        Add to Bag
                    </button>
                </div>
            `;
        }).join('');


    }
window.openQuickView = (title, price, img, desc) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-price').innerText = `$${price}`;
    document.getElementById('modal-img').src = img;
    document.getElementById('modal-description').innerText = desc || "Premium Atelier quality. Designed for a perfect fit.";
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
};
window.closeModal = () => {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};



fetchAtelierProducts();
// This connects your "PROCEED TO CHECKOUT" button
document.addEventListener('click', (e) => {
    // Check if the clicked element is your checkout button
    if (e.target.classList.contains('checkout-btn')) {
        console.log("Checkout initiated");
        
        // 1. Hide the cart panel
        window.closeCart(); 

        // 2. Hide the product grid/main shop
        const shopPage = document.getElementById('shop-page');
        if (shopPage) shopPage.style.display = 'none';

        // 3. Show the checkout section we created earlier
        const checkoutSection = document.getElementById('checkout-section');
        if (checkoutSection) {
            checkoutSection.style.display = 'block';
            window.scrollTo(0, 0); // Jump to top for the form
        }
    }
});
document.getElementById('back-to-shop').addEventListener('click', (e) => {
    e.preventDefault();
    
    // 1. Hide the Checkout Section
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) checkoutSection.style.display = 'none';

    // 2. Show the Shop Page (Header + Products)
    const shopPage = document.getElementById('shop-page');
    if (shopPage) shopPage.style.display = 'block';

    // 3. Scroll back to top so they see the logo
    window.scrollTo(0, 0);
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
