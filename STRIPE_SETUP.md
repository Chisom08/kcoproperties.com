# Stripe Payment Configuration Guide

This guide explains how to configure Stripe payments for the KCO Properties rental application system.

## Overview

The application uses Stripe Checkout for processing rental application fees ($50.00). The integration includes:
- Stripe Checkout Session creation for payment processing
- Webhook handler for payment confirmation
- Automatic email receipts for successful payments
- Admin notifications for all payments

## Required Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # For development: use test key (sk_test_...)
                               # For production: use live key (sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional for development, required for production
```

## Step-by-Step Setup

### 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete the account setup process

### 2. Get Your API Keys

#### For Development/Testing:

1. Log in to your Stripe Dashboard
2. Make sure you're in **Test mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_test_...`)
5. Add it to your `.env` file as `STRIPE_SECRET_KEY`

#### For Production:

1. Switch to **Live mode** in Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_live_...`)
4. Update your `.env` file with the live key

**⚠️ Important:** Never commit your live secret key to version control!

### 3. Configure Webhook Endpoint

Webhooks allow Stripe to notify your application when payments are completed.

#### For Development:

You can use Stripe CLI to forward webhooks to your local server:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. The CLI will display a webhook signing secret (starts with `whsec_...`)
5. Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

**Note:** In development, the webhook secret is optional. The code will work without it, but it's recommended for testing.

#### For Production:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (optional, for additional logging)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your production `.env` file as `STRIPE_WEBHOOK_SECRET`

### 4. Update Environment File

Add the Stripe configuration to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 5. Test the Integration

#### Test Payment Flow:

1. Start your development server: `pnpm dev`
2. Navigate to the rental application form
3. Complete the application steps
4. On the Agreement page, click "Pay Application Fee"
5. You'll be redirected to Stripe Checkout
6. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
7. Complete the payment
8. You should be redirected back to the application
9. The payment status should show as "Paid"

#### Test Webhook:

1. If using Stripe CLI, webhooks are automatically forwarded
2. Check your server logs for webhook events
3. Verify that payment status updates in the database
4. Check that confirmation emails are sent

### 6. Production Deployment

Before going live:

1. **Switch to Live Mode:**
   - Update `STRIPE_SECRET_KEY` with your live key (starts with `sk_live_...`)
   - Create a production webhook endpoint in Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET` with the production webhook secret

2. **Verify Webhook Endpoint:**
   - Stripe will send a test event when you create the webhook
   - Check your server logs to confirm it's received
   - The endpoint should return `200 OK`

3. **Test with Real Payment:**
   - Make a small test payment with a real card
   - Verify the payment appears in Stripe Dashboard
   - Confirm the application status updates correctly
   - Check that emails are sent

## Application Fee Configuration

The application fee is currently set to **$50.00** (5000 cents).

To change the fee amount, edit:
- `server/routers/rental/payment.ts` - Line 8: `APPLICATION_FEE_CENTS`
- `server/routers/rental/stripeWebhook.ts` - Line 8: `APPLICATION_FEE_CENTS`

## How It Works

1. **Payment Initiation:**
   - User clicks "Pay Application Fee" on the Agreement page
   - Frontend calls `trpc.rental.payment.createCheckoutSession`
   - Backend creates a Stripe Checkout Session
   - User is redirected to Stripe's hosted checkout page

2. **Payment Processing:**
   - User enters payment details on Stripe's secure page
   - Stripe processes the payment
   - User is redirected back to your application

3. **Payment Confirmation:**
   - Stripe sends a webhook event to `/api/stripe/webhook`
   - Backend verifies the webhook signature
   - Application status is updated to "paid"
   - Confirmation emails are sent to applicant and admin

4. **Session Verification:**
   - Frontend verifies the payment session after redirect
   - Payment status is displayed to the user
   - Signature section is unlocked after payment confirmation

## Troubleshooting

### Payment Not Processing

- **Check API Key:** Verify `STRIPE_SECRET_KEY` is set correctly
- **Check Mode:** Ensure you're using test keys in development and live keys in production
- **Check Logs:** Look for errors in server console

### Webhook Not Working

- **Check Webhook Secret:** Verify `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
- **Check URL:** Ensure webhook URL is accessible (not behind firewall)
- **Check Logs:** Webhook errors are logged to console
- **Test with Stripe CLI:** Use `stripe listen` to debug webhook issues

### Payment Status Not Updating

- **Check Database:** Verify the payment status column exists
- **Check Webhook:** Ensure webhook is receiving events (check Stripe Dashboard → Webhooks → Events)
- **Check Logs:** Look for webhook processing errors

### Emails Not Sending

- **Check Email Service:** Verify SendGrid is configured correctly
- **Check Logs:** Email errors are logged but don't fail the webhook
- **Payment Still Processes:** Even if email fails, payment is still recorded

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** in production (required)
4. **Use HTTPS** in production for webhook endpoints
5. **Rotate keys** if compromised
6. **Monitor webhook events** in Stripe Dashboard
7. **Use test mode** during development

## Support

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support:** Available in your Stripe Dashboard
- **Stripe CLI:** [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)







