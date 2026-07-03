// app-controller.js - ATELIER Master UI Routing Engine

function showSection(sectionId, event) {
    console.log("Navigating system layout perspective to:", sectionId);
    
    const stage = document.getElementById('content-stage');
    const title = document.getElementById('section-title');
    
    if (!stage) return;

    // 1. Update Sidebar Links Active CSS States
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.remove('active');
        // Match inner text to highlight correct menu item cleanly
        if (li.innerText.toLowerCase().includes(sectionId === 'dashboard' ? 'overview' : sectionId)) {
            li.classList.add('active');
        }
    });

    // Fallback manual check if triggered via a direct click pass
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Clear the stage inner HTML content panel before mounting new component row
    stage.innerHTML = ''; 

    // 2. Component Routing Matrix Switch
    switch(sectionId) {
        case 'dashboard':
            if (title) title.innerText = "OVERVIEW";
            stage.innerHTML = `
                <div style="padding:40px; animation: fadeIn 0.5s; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                    <h2 style="letter-spacing:3px; font-size:14px; font-weight:bold; color:#000; text-transform:uppercase;">WELCOME, ATELIER ADMIN</h2>
                    <p style="color:#666; font-size:11px; margin-top:5px;">Select a department from the corporate workspace ledger to begin auditing operations.</p>
                </div>`;
            break;

        case 'inventory':
            if (title) title.innerText = "PRODUCT MANAGEMENT";
            if (typeof renderInventorySection === 'function') {
                renderInventorySection();
            } else {
                stage.innerHTML = `<div style="padding:40px; color:red; font-family:monospace;">System Error: inventory.js not detected module side.</div>`;
            }
            break;

        case 'orders':
            if (title) title.innerText = "ORDER PIPELINE";
            if (typeof renderOrdersSection === 'function') {
                renderOrdersSection();
            } else {
                stage.innerHTML = `<div style="padding:40px; color:red; font-family:monospace;">System Error: orders.js not loaded.</div>`;
            }
            break;

        case 'finances':
            if (title) title.innerText = "FINANCIAL LEDGER STATEMENTS";
            if (typeof renderFinancesSection === 'function') {
                renderFinancesSection(); // This runs innerHTML layout setup and triggers load
            } else {
                console.error("Critical Component Error: 'finances.js' was not compiled or imported correctly.");
                stage.innerHTML = `<div style="padding:40px; color:red; font-family:monospace;">ERROR: FINANCIAL LEDGER MODULE NOT DETECTED IN WORKSPACE</div>`;
            }
            break;

        default:
            console.warn("Unknown architectural section requested:", sectionId);
    }
}

// Initialize the app cleanly on system boot-up sequence
window.onload = () => {
    console.log("✅ Atelier Controller: System Online");
    showSection('dashboard', null);
};