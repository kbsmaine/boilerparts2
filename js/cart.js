/* =======================
   Modal Cart (shared sitewide)
   ======================= */
console.log("✅ Modal Cart Loaded");

(function () {
  const STORAGE_KEY = "cart";
  const MODAL_ID   = "cartModal";
  const INNER_ID   = "cartModalInner";
  const LIST_ID    = "cartItems";
  const TOTAL_ID   = "cartTotal";
  const COUNT_ID   = "cartCount";
  const OPEN_BTN_ID = "openCartBtn";

  // ---------- storage ----------
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch(e) { return []; }
  }
  function saveCart(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function getTotal(items) { return items.reduce((s,i)=>s + Number(i.price) * Number(i.qty), 0); }
  function getCount(items) { return items.reduce((s,i)=>s + Number(i.qty), 0); }

  // ---------- dom helpers ----------
  const $ = sel => document.querySelector(sel);
  function setCount(n) {
    const el = document.getElementById(COUNT_ID);
    if (el) {
      el.textContent = n;
      el.classList.remove("pulse");
      // trigger pulse
      void el.offsetWidth; 
      el.classList.add("pulse");
      setTimeout(()=>el.classList.remove("pulse"), 400);
    }
  }

  // ---------- modal ----------
  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = MODAL_ID;
      modal.style.cssText = "position:fixed; inset:0; display:none; z-index:1000; align-items:center; justify-content:center; background:rgba(2,6,23,.6);";
      modal.innerHTML = `
        <div id="${INNER_ID}" style="width:min(720px,92vw); background:#0b1220; color:#fff; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.45); border:1px solid #1e293b;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid #1f2937;">
            <h2 style="margin:0;font:600 18px/1.2 Inter,system-ui,sans-serif;">Your Cart</h2>
            <button id="closeCart" aria-label="Close cart" style="background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:10px;padding:8px 10px;cursor:pointer">✕</button>
          </div>
          <div style="max-height:46vh; overflow:auto">
            <div id="${LIST_ID}" style="padding:10px 16px"></div>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; border-top:1px solid #1f2937;">
            <div style="font:600 16px Inter,system-ui,sans-serif;">Total: <span id="${TOTAL_ID}">$0.00</span></div>
            <div id="paypal-button-row" style="display:flex; gap:8px; align-items:center">
              <div id="pp-btn-paypal"></div>
              <div id="pp-btn-card"></div>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);

      // Close handlers
      modal.addEventListener("click", (e) => {
        if (e.target.id === MODAL_ID) modal.style.display = "none";
      });
      modal.querySelector("#closeCart").addEventListener("click", () => modal.style.display = "none");
    }
    return modal;
  }

  function openModal() {
    ensureModal().style.display = "flex";
    // Ask payments to (re)render with current total
    const sum = getTotal(loadCart());
    document.dispatchEvent(new CustomEvent("cart:open", { detail: { total: sum.toFixed(2) } }));
  }

  // ---------- rendering ----------
  function render() {
    const items = loadCart();
    const list = document.getElementById(LIST_ID);
    if (!list) return;
    list.innerHTML = "";

    if (items.length === 0) {
      list.innerHTML = `<div style="color:#cbd5e1;padding:10px 4px">Your cart is empty.</div>`;
    } else {
      items.forEach((it, idx) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:10px 4px; border-bottom:1px dashed #263143;";
        row.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:2px; min-width:0">
            <div style="font:600 14px Inter,system-ui,sans-serif; color:#e5e7eb; white-space:nowrap; text-overflow:ellipsis; overflow:hidden">${it.name}</div>
            <div style="color:#94a3b8; font:12px Inter,system-ui,sans-serif">$${Number(it.price).toFixed(2)} ea</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px">
            <button class="qty minus" data-idx="${idx}" aria-label="Decrease quantity" style="width:28px;height:28px;border-radius:8px;border:1px solid #374151;background:#111827;color:#e5e7eb;cursor:pointer">−</button>
            <div style="min-width:28px; text-align:center; font:600 14px Inter,system-ui,sans-serif">${it.qty}</div>
            <button class="qty plus" data-idx="${idx}" aria-label="Increase quantity" style="width:28px;height:28px;border-radius:8px;border:1px solid #374151;background:#111827;color:#e5e7eb;cursor:pointer">+</button>
            <button class="remove" data-idx="${idx}" aria-label="Remove item" style="margin-left:6px;border-radius:8px;border:1px solid #7f1d1d;background:#1f2937;color:#fecaca;padding:6px 8px;cursor:pointer">Remove</button>
          </div>`;
        list.appendChild(row);
      });
    }

    // total
    const totalEl = document.getElementById(TOTAL_ID);
    if (totalEl) totalEl.textContent = `$${getTotal(items).toFixed(2)}`;
    // count
    setCount(getCount(items));

    // re-bind qty controls
    list.querySelectorAll(".qty.plus").forEach(btn => btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      const data = loadCart();
      data[i].qty += 1;
      saveCart(data);
      render();
      document.dispatchEvent(new CustomEvent("cart:changed", { detail: { total: getTotal(data).toFixed(2) } }));
    }));

    list.querySelectorAll(".qty.minus").forEach(btn => btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      const data = loadCart();
      data[i].qty = Math.max(0, data[i].qty - 1);
      if (data[i].qty === 0) data.splice(i,1);
      saveCart(data);
      render();
      document.dispatchEvent(new CustomEvent("cart:changed", { detail: { total: getTotal(data).toFixed(2) } }));
    }));

    list.querySelectorAll(".remove").forEach(btn => btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      const data = loadCart();
      data.splice(i,1);
      saveCart(data);
      render();
      document.dispatchEvent(new CustomEvent("cart:changed", { detail: { total: getTotal(data).toFixed(2) } }));
    }));
  }

  // ---------- add-to-cart buttons ----------
  function bindAddButtons() {
    document.querySelectorAll(".btn.add").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id || btn.getAttribute("data-id");
        const name = btn.dataset.name || btn.getAttribute("data-name") || "Item";
        const price = parseFloat(btn.dataset.price || btn.getAttribute("data-price") || "0") || 0;
        let items = loadCart();
        const found = items.find(i => i.id === id);
        if (found) found.qty += 1;
        else items.push({ id, name, price, qty: 1 });
        saveCart(items);
        setCount(getCount(items));
        btn.classList.add("added");
        setTimeout(()=>btn.classList.remove("added"), 320);
        document.dispatchEvent(new CustomEvent("cart:changed", { detail: { total: getTotal(items).toFixed(2) } }));
      });
    });
  }

  // ---------- open cart button ----------
  function bindOpen() {
    const open = document.getElementById(OPEN_BTN_ID);
    if (open) open.addEventListener("click", openModal);
  }

  // init
  ensureModal();
  bindAddButtons();
  bindOpen();
  render();

  // expose small API for payments.js
  window.CartAPI = {
    getItems: loadCart,
    getTotal: function(){ return getTotal(loadCart()); },
    onChange: function(cb){
      document.addEventListener("cart:changed", (e)=> cb(e.detail.total));
    },
    onOpen: function(cb){
      document.addEventListener("cart:open", (e)=> cb(e.detail.total));
    }
  };
})();