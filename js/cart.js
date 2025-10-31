
// cart.js — modal cart with + / - controls and a single PayPal container
console.log("✅ Modal Cart Loaded");

const CART_KEY = "kbs_cart_v1";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartCount();
}
function findIndex(id) { return getCart().findIndex(i => i.id === id); }

function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx >= 0) cart[idx].qty += 1;
  else cart.push({ ...item, qty: 1 });
  setCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  setCart(cart);
  renderCartLines(); // keep modal updated if open
}

function changeQty(id, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx === -1) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  setCart(cart);
  renderCartLines();
}

function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartCount() {
  const count = getCart().reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = count;
}

// attach buttons on product grid
document.querySelectorAll(".btn.add").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price || "0"),
    };
    addToCart(item);
    // small visual feedback
    btn.classList.add("added");
    setTimeout(() => btn.classList.remove("added"), 250);
  });
});

// modal
let modalEl, linesEl, totalEl, closeBtn;
function ensureModal() {
  if (modalEl) return modalEl;
  const wrap = document.createElement("div");
  wrap.id = "cartModal";
  wrap.innerHTML = `
  <div class="modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;z-index:9998"></div>
  <div class="modal" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;display:none;max-width:720px;width:92%">
    <div class="card" style="padding:16px 18px 20px; background:rgba(21,31,53,.92); border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.4)">
      <div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <h2 style="margin:0">Your Cart</h2>
        <button id="cartCloseBtn" aria-label="Close" style="background:transparent;border:0;color:#fff;font-size:20px;cursor:pointer">✕</button>
      </div>
      <div id="cartLines" class="cart-lines" style="display:flex;flex-direction:column;gap:10px;max-height:42vh;overflow:auto;border-top:1px solid rgba(255,255,255,.08);padding-top:12px"></div>
      <div style="margin-top:12px;font-weight:700">Total: <span id="cartTotal">$0.00</span></div>

      <!-- Single PayPal stack -->
      <div id="paypal-button-row" style="margin-top:14px;display:flex;flex-direction:column;gap:8px;align-items:stretch">
        <div id="pp-btn-paypal"></div>
      </div>
      <div id="paypalPoweredBy" style="text-align:center;margin-top:6px;opacity:.7;font-size:.85rem">Powered by <b>PayPal</b></div>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  modalEl = wrap.querySelector(".modal");
  linesEl = wrap.querySelector("#cartLines");
  totalEl = wrap.querySelector("#cartTotal");
  closeBtn = wrap.querySelector("#cartCloseBtn");
  wrap.querySelector(".modal-backdrop").addEventListener("click", hideCart);
  closeBtn.addEventListener("click", hideCart);
  return modalEl;
}

function renderCartLines() {
  ensureModal();
  const cart = getCart();
  linesEl.innerHTML = "";
  if (!cart.length) {
    linesEl.innerHTML = `<p class="muted" style="margin:8px 2px">Your cart is empty.</p>`;
  } else {
    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px";
      row.innerHTML = `
        <div style="display:flex;flex-direction:column">
          <b>${item.name}</b>
          <span class="muted">$${item.price.toFixed(2)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="qty-btn dec" aria-label="Decrease" style="min-width:34px;height:34px;border-radius:8px;border:0;background:#0f172a;color:#fff;font-weight:800">-</button>
          <span class="qty" style="min-width:24px;text-align:center;font-weight:700">${item.qty}</span>
          <button class="qty-btn inc" aria-label="Increase" style="min-width:34px;height:34px;border-radius:8px;border:0;background:#0f172a;color:#fff;font-weight:800">+</button>
          <button class="remove" aria-label="Remove" style="min-width:34px;height:34px;border-radius:8px;border:0;background:#7f1d1d;color:#fff;font-weight:800">×</button>
        </div>`;
      row.querySelector(".dec").addEventListener("click", () => changeQty(item.id, -1));
      row.querySelector(".inc").addEventListener("click", () => changeQty(item.id, +1));
      row.querySelector(".remove").addEventListener("click", () => removeFromCart(item.id));
      linesEl.appendChild(row);
    });
  }
  totalEl.textContent = `$${getCartTotal().toFixed(2)}`;

  // let payments.js know the modal exists & should (re)render
  const ev = new CustomEvent("cart:updated", { detail: { total: getCartTotal() } });
  window.dispatchEvent(ev);
}

function showCart() {
  ensureModal();
  document.querySelector("#cartModal .modal").style.display = "block";
  document.querySelector("#cartModal .modal-backdrop").style.display = "block";
  renderCartLines();
  const ev = new Event("cart:open"); window.dispatchEvent(ev);
}
function hideCart() {
  document.querySelector("#cartModal .modal").style.display = "none";
  document.querySelector("#cartModal .modal-backdrop").style.display = "none";
  const ev = new Event("cart:close"); window.dispatchEvent(ev);
}

// open cart button
const openBtn = document.getElementById("openCartBtn");
if (openBtn) openBtn.addEventListener("click", showCart);

// initialize counter on load
updateCartCount();

// expose minimal API for payments.js
window.CartAPI = { getCart, getCartTotal };
