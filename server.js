// ============================================================
//  server.js  –  Backend Node.js pour MangePasCher
//  Installation : npm install express stripe cors dotenv
//  Lancement    : node server.js
// ============================================================

require('dotenv').config();
const express = require('express');
const Stripe  = require('stripe');
const cors    = require('cors');
const path    = require('path');

const app    = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Sert les fichiers statiques du site (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// ──────────────────────────────────────────────────────────────
//  POST /create-checkout-session
//  Reçoit : { items: [{ name, price, quantity }] }
//  Renvoie : { url }  ← URL de la page Stripe
// ──────────────────────────────────────────────────────────────
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    // Convertit chaque article en ligne Stripe
    const line_items = items.map(item => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.price * 100), // Stripe travaille en centimes
        product_data: {
          name: item.name
        }
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],   // Apple Pay est activé automatiquement si dispo
      line_items,
      mode: 'payment',
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/success.html',
      cancel_url:  process.env.CANCEL_URL  || 'http://localhost:3000/'
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
