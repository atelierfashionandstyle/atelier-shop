import { supabase } from './supabaseClient.js';
let cart = [];
let total = 0;

function openCart() { document.getElementById('cart-panel').classList.add('active'); }
function closeCart() { document.getElementById('cart-panel').classList.remove('active'); }

function addToCart(name, price, img) {
    cart.push({ name, price, img });
    updateCartUI();
    // Manual trigger only: we do not call openCart() here so customers can keep shopping
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    container.innerHTML = cart.map(item => `
        <div style="display:flex; align-items:center; margin-bottom:20px;">
            <img src="${item.img}" width="60" style="margin-right:15px">
            <div><h4>${item.name}</h4><p>$${item.price}</p></div>
        </div>
    `).join('');

    total = cart.reduce((sum, item) => sum + item.price, 0);
    totalEl.innerText = `$${total.toFixed(2)}`;
    countEl.innerText = cart.length;
}
// Add the Stripe Library (Place this in your HTML <head>)
// <script src="https://js.stripe.com"></script>

//const stripe = Stripe('YOUR_PUBLIC_KEY_HERE'); // Replace with your real key from Stripe Dashboard

document.getElementById('checkout-button').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your shopping bag is empty.");
        return;
    }

    // Prepare the items for Stripe
    const lineItems = cart.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                images: [window.location.origin + '/' + item.img],
            },
            unit_amount: item.price * 100, // Stripe uses cents ($12.00 = 1200)
        },
        quantity: 1,
    }));

    // In a real production environment, this request goes to your backend (Node.js/Python)
    // For now, we will simulate the redirect to the payment page.
    //console.log("Redirecting to Stripe with items:", lineItems);
    //alert("Redirecting to Secure Global Payment Gateway...");
});
fetchAtelierProducts(); // Make sure this line exists!
