const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateUser } = require('../authorizeuser.js');

// Subscription plan definitions — amounts in pence (GBP)
const PLANS = {
    onetime: { name: 'One-time Access',      amount: 1999, currency: 'gbp', mode: 'payment'      },
    monthly: { name: 'Monthly Subscription', amount: 999,  currency: 'gbp', mode: 'subscription' },
    annual:  { name: 'Annual Subscription',  amount: 7999, currency: 'gbp', mode: 'subscription' }
};

module.exports = (db) => {
    const router = express.Router();
    // ── Payment page ──
    router.get('/payment', authenticateUser,(req, res) => {
        res.sendFile(path.join(__dirname, '..', 'secured', 'html', 'payment.html'), (err) => {
            if (err) console.log(err);
        });
    });

    // ── Create Stripe Checkout Session ──
    router.post('/create-checkout-session', authenticateUser, async (req, res) => {
        const planKey = req.body.plan;
        const plan    = PLANS[planKey];

        if (!plan) return res.status(400).json({ error: 'Invalid plan selected.' });

        try {
            let sessionConfig = {
                payment_method_types: ['card'],
                customer_email:       req.session.user,
                metadata: {
                    username: req.session.user,
                    plan:     planKey
                },
                success_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url:  `${process.env.APP_URL || 'http://localhost:3000'}/payment-cancel`,
            };

            if (plan.mode === 'subscription') {
                // Create a price dynamically for subscription plans
                const price = await stripe.prices.create({
                    unit_amount:  plan.amount,
                    currency:     plan.currency,
                    recurring:    { interval: planKey === 'monthly' ? 'month' : 'year' },
                    product_data: { name: plan.name }
                });
                sessionConfig.mode       = 'subscription';
                sessionConfig.line_items = [{ price: price.id, quantity: 1 }];
            } else {
                // One-time payment
                sessionConfig.mode       = 'payment';
                sessionConfig.line_items = [{
                    price_data: {
                        currency:     plan.currency,
                        unit_amount:  plan.amount,
                        product_data: { name: plan.name }
                    },
                    quantity: 1
                }];
            }

            const session = await stripe.checkout.sessions.create(sessionConfig);

            // TODO: Save pending payment to DB once payments table is created
            // await db.none(
            //     'INSERT INTO payments (username, plan, stripe_session_id, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
            //     [req.session.user, planKey, session.id, 'pending']
            // );

            res.json({ url: session.url });

        } catch (err) {
            console.error('Stripe error:', err.message);
            res.status(500).json({ error: 'Payment setup failed. Please try again.' });
        }
    });

    // ── Payment success ──
    router.get('/payment-success', authenticateUser, async(req, res) => {
        try {
            // Verify with Stripe — never trust the URL param alone
            const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

            if (session.payment_status === 'paid' || session.status === 'complete') {
                console.log(`Payment success: user=${req.session.user}, plan=${session.metadata.plan}`);

                // TODO: Update payment status in DB once payments table is created
                // await db.none(
                //     'UPDATE payments SET status = $1 WHERE stripe_session_id = $2',
                //     ['success', req.query.session_id]
                // );
            }

        } catch (err) {
            console.error('Payment success verification error:', err.message);
        }

        res.sendFile(path.join(__dirname, '..', 'secured', 'html', 'payment_success.html'), (err) => {
            if (err) console.log(err);
        });
    });

    // ── Payment cancelled ──
    router.get('/payment-cancel', authenticateUser, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'secured', 'html', 'payment_cancel.html'), (err) => {
        });
    });

    // ── Logout ──
    router.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) console.error('Logout error:', err);
            res.redirect('/');
        });
    });
    return router;
}