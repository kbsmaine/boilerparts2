/* =======================
   PayPal Buttons (modal-aware)
   ======================= */
console.log("💳 payments.js loaded");

(function(){
  const CLIENT_ID = (window.PAYPAL_CLIENT_ID && String(window.PAYPAL_CLIENT_ID).trim()) || "AR1KqgMjoynz7pTqK0twhdeGadhGvtmbNXOhbGeqxil-d_tblaF-xCtrY_1UXmmECd3FDKE6sv6woYQV";
  const SDK_URL = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&components=buttons,funding-eligibility&enable-funding=card,paylater&currency=USD`;
  let sdkPromise = null;

  function loadSDKOnce(){
    if (window.paypal_sdk) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SDK_URL;
      s.async = true;
      s.dataset.namespace = "paypal_sdk";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  function clearContainer(sel) {
    const el = document.querySelector(sel);
    if (el) el.innerHTML = "";
  }

  function renderButtons(totalStr){
    const total = Number(totalStr || 0);
    const paypalBox = document.getElementById("pp-btn-paypal");
    const cardBox   = document.getElementById("pp-btn-card");

    if (!paypalBox || !cardBox) return;

    clearContainer("#pp-btn-paypal");
    clearContainer("#pp-btn-card");

    if (!isFinite(total) || total <= 0) {
      // disable but keep area stable
      paypalBox.innerHTML = `<div style="color:#94a3b8;font:13px Inter,system-ui,sans-serif">PayPal unavailable — add items to enable</div>`;
      return;
    }

    try {
      // PayPal button
      paypal_sdk.Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
        createOrder: function(data, actions){
          return actions.order.create({
            purchase_units: [{
              reference_id: "default",
              amount: { currency_code: "USD", value: total.toFixed(2) }
            }]
          });
        },
        onApprove: function(data, actions){
          return actions.order.capture().then(function(details){
            alert("Payment completed by " + (details.payer?.name?.given_name || "customer"));
          });
        },
        onError: function(err){
          console.error("PayPal error:", err);
        }
      }).render("#pp-btn-paypal");

      // Card button (must be black/white color, and default label)
      paypal_sdk.Buttons({
        fundingSource: paypal_sdk.FUNDING.CARD,
        style: { layout: "vertical", color: "black", shape: "rect" },
        createOrder: function(data, actions){
          return actions.order.create({
            purchase_units: [{
              reference_id: "default",
              amount: { currency_code: "USD", value: total.toFixed(2) }
            }]
          });
        },
        onApprove: function(data, actions){
          return actions.order.capture().then(function(details){
            alert("Card payment completed by " + (details.payer?.name?.given_name || "customer"));
          });
        },
        onError: function(err){
          console.error("CARD button render failed:", err);
        }
      }).render("#pp-btn-card");
    } catch (e) {
      console.error("Failed to render PayPal buttons:", e);
    }
  }

  // Init: load SDK then render once with current total (if modal exists)
  function init(){
    loadSDKOnce()
      .then(() => {
        // Wire up to cart events
        const total = (window.CartAPI && Number(window.CartAPI.getTotal()).toFixed(2)) || "0.00";
        renderButtons(total);

        if (window.CartAPI) {
          window.CartAPI.onChange((t)=> renderButtons(t));
          window.CartAPI.onOpen((t)=> renderButtons(t));
        }
      })
      .catch(err => {
        console.error("Failed to init PayPal SDK:", err);
      });
  }

  // start after DOM ready
  if (document.readyState === "complete" || document.readyState === "interactive") init();
  else document.addEventListener("DOMContentLoaded", init);

  // Expose for debugging
  window.PayUI = { renderButtons, loadSDKOnce };
})();