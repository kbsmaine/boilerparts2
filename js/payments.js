
// payments.js — render PayPal buttons into the modal, single stack
console.log("💳 payments.js loaded");

const PAYPAL_NS = "paypal_sdk";
const SDK_QUERY = "?client-id=AR1KqgMjoynz7pTqK0twhdeGadhGvtmbNXOhbGeqxil-d_tblaF-xCtrY_1UXmmECd3FDKE6sv6woYQV&components=buttons,funding-eligibility&enable-funding=card,paylater&currency=USD";

function loadPaypalSdkIfNeeded() {
  if (window[PAYPAL_NS]) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.paypal.com/sdk/js" + SDK_QUERY;
    s.dataset.namespace = PAYPAL_NS;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("PayPal SDK failed to load"));
    document.head.appendChild(s);
  });
}

function renderButtons() {
  const container = document.querySelector("#pp-btn-paypal");
  if (!container) return; // modal not open yet

  // Clean prior render to prevent duplicates
  container.innerHTML = "";

  const total = (window.CartAPI?.getCartTotal?.() || 0).toFixed(2);
  const cartItems = (window.CartAPI?.getCart?.() || []).map(i => ({ name: i.name, unit_amount: i.price, quantity: i.qty }));

  const paypal = window[PAYPAL_NS];
  if (!paypal) return;

  paypal.Buttons({
    style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
    fundingSource: undefined, // include PayPal + Pay Later + Card in one stack
    createOrder: function(data, actions) {
      if (parseFloat(total) <= 0) {
        // still render but prevent purchase
        return actions.order.create({
          purchase_units: [{
            amount: { value: "0.00", currency_code: "USD" },
            description: "Your cart is empty"
          }]
        });
      }
      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total
              }
            }
          },
          items: (window.CartAPI?.getCart?.() || []).map(i => ({
            name: i.name,
            unit_amount: { currency_code: "USD", value: i.price.toFixed(2) },
            quantity: i.qty.toString()
          }))
        }]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(details => {
        console.log("✅ PayPal capture:", details);
        alert("Payment authorized for " + details.payer.name.given_name + ". (Sandbox)");

        // clear cart
        localStorage.removeItem("kbs_cart_v1");
        if (window.updateCartCount) window.updateCartCount();
        const ev = new Event("cart:updated"); window.dispatchEvent(ev);
      });
    },
    onError: function(err) {
      console.error("PayPal error:", err);
    }
  }).render("#pp-btn-paypal").then(() => {
    console.log("✅ PayPal Buttons rendered");
  }).catch(err => {
    console.error("Failed to render PayPal buttons:", err);
  });
}

// render when modal opens and when contents change
window.addEventListener("cart:open", () => {
  loadPaypalSdkIfNeeded().then(renderButtons).catch(e => console.error(e));
});
window.addEventListener("cart:updated", () => {
  if (document.querySelector("#pp-btn-paypal")) {
    renderButtons();
  }
});
