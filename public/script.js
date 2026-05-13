class ShoppingCart {
  constructor() {
    this.cart = this.loadCart();
    this.selectedPaymentMethod = 'apple_pay';
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCartUI();
    this.updateCheckoutModal();
  }

  bindEvents() {
    document.getElementById('cartToggle').addEventListener('click', () => this.toggleCart());
    document.getElementById('cartClose').addEventListener('click', () => this.toggleCart());
    document.getElementById('cartOverlay').addEventListener('click', () => this.toggleCart());
    document.getElementById('checkoutBtn').addEventListener('click', () => this.openCheckoutModal());

    document.getElementById('checkoutBackdrop').addEventListener('click', () => this.closeCheckoutModal());
    document.getElementById('checkoutModalClose').addEventListener('click', () => this.closeCheckoutModal());
    document.getElementById('checkoutCancelBtn').addEventListener('click', () => this.closeCheckoutModal());
    document.getElementById('checkoutConfirmBtn').addEventListener('click', () => this.handlePayment());

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addToCart({
          id: btn.dataset.productId,
          name: btn.dataset.productName,
          price: parseFloat(btn.dataset.productPrice)
        });
      });
    });

    document.querySelectorAll('.checkout-method').forEach(button => {
      button.addEventListener('click', () => {
        this.selectedPaymentMethod = button.dataset.method;
        this.updatePaymentMethodSelection();
        this.updateCheckoutActionLabel();
      });
    });
  }

  addToCart(product) {
    const existingProduct = this.cart.find(item => item.id === product.id);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }

    this.saveCart();
    this.updateCartUI();
    this.showCartNotification();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
    this.updateCheckoutModal();
  }

  updateQuantity(productId, quantity) {
    const product = this.cart.find(item => item.id === productId);
    if (product) {
      if (quantity < 1) {
        this.removeFromCart(productId);
        return;
      }

      product.quantity = quantity;
      this.saveCart();
      this.updateCartUI();
      this.updateCheckoutModal();
    }
  }

  getTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  openCheckoutModal() {
    if (this.cart.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');

    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    this.updateCheckoutModal();
    this.updatePaymentMethodSelection();
    this.updateCheckoutActionLabel();
  }

  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  updateCartUI() {
    this.updateCartBadge();
    this.updateCartItems();
    this.updateCartTotal();
  }

  updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = this.getItemCount();

    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  updateCartItems() {
    const cartItems = document.getElementById('cartItems');

    if (this.cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty">Votre panier est vide</div>';
      return;
    }

    cartItems.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} €</div>
        </div>
        <div class="cart-item-controls">
          <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <div class="quantity-display">${item.quantity}</div>
          <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          <button class="remove-btn" onclick="cart.removeFromCart('${item.id}')">×</button>
        </div>
      </div>
    `).join('');
  }

  updateCartTotal() {
    document.getElementById('cartTotal').textContent = this.getTotal().toFixed(2) + ' €';
  }

  updateCheckoutModal() {
    const itemsContainer = document.getElementById('checkoutSummaryItems');
    const total = document.getElementById('checkoutSummaryTotal');

    if (this.cart.length === 0) {
      itemsContainer.innerHTML = '<div class="cart-empty">Votre panier est vide</div>';
      total.textContent = '0.00 €';
      this.updateCheckoutActionLabel();
      return;
    }

    itemsContainer.innerHTML = this.cart.map(item => `
      <div class="checkout-summary__line">
        <span>${item.quantity} x ${item.name}</span>
        <span>${(item.price * item.quantity).toFixed(2)} €</span>
      </div>
    `).join('');

    total.textContent = this.getTotal().toFixed(2) + ' €';
  }

  updatePaymentMethodSelection() {
    document.querySelectorAll('.checkout-method').forEach(button => {
      button.classList.toggle('active', button.dataset.method === this.selectedPaymentMethod);
    });
  }

  updateCheckoutActionLabel() {
    const confirmButton = document.getElementById('checkoutConfirmBtn');
    if (this.selectedPaymentMethod === 'crypto') {
      confirmButton.textContent = 'Join Discord';
      return;
    }
    confirmButton.textContent = 'Payer';
  }

  async handlePayment() {
    if (this.cart.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    // Crypto → Discord
    if (this.selectedPaymentMethod === 'crypto') {
      window.open('https://discord.gg/sK4xveM2', '_blank');
      return;
    }

    // Stripe : on envoie le panier au backend pour créer une session dynamique
    const btn = document.getElementById('checkoutConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Chargement...';

    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: this.cart.map(item => ({
            name: item.name,
            price: item.price,       // en euros (ex: 6.25)
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erreur serveur : ' + response.status);
      }

      const data = await response.json();

      if (data.url) {
        // Redirige vers la page de paiement Stripe avec le bon montant
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de la création du paiement. Veuillez réessayer.');
      btn.disabled = false;
      btn.textContent = 'Payer';
    }
  }

  saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  loadCart() {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  }

  showCartNotification() {
    this.toggleCart();
  }
}

const cart = new ShoppingCart();
