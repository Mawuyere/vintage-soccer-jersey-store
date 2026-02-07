# Payment Processing Integration

This document describes the payment processing integration for the Vintage Soccer Jersey Store e-commerce platform.

## Overview

The payment system supports three major payment processors:
- **Stripe** - Primary payment processor with support for credit cards, Apple Pay, and Google Pay
- **PayPal** - Alternative payment method with PayPal account support
- **Square** - Additional payment processor option

## Architecture

### Payment Library (`src/lib/payment/`)

#### Stripe (`stripe.ts`)
- `createPaymentIntent()` - Creates a payment intent for processing payments
- `processPayment()` - Confirms or retrieves payment intent
- `retrievePaymentIntent()` - Retrieves existing payment intent
- `cancelPaymentIntent()` - Cancels a pending payment intent
- `createRefund()` - Processes refunds
- `verifyWebhookSignature()` - Verifies Stripe webhook signatures for security

#### PayPal (`paypal.ts`)
- `createOrder()` - Creates a PayPal order for checkout
- `capturePayment()` - Captures payment after user approval
- `getOrder()` - Retrieves order details
- `refundPayment()` - Processes refunds
- `verifyWebhookSignature()` - Verifies PayPal webhook signatures

#### Square (`square.ts`)
- `createPayment()` - Creates and processes Square payments
- `getPayment()` - Retrieves payment details
- `cancelPayment()` - Cancels a payment
- `completePayment()` - Completes a payment
- `refundPayment()` - Processes refunds
- `verifyWebhookSignature()` - Verifies Square webhook signatures

### API Routes (`src/app/api/payment/`)

#### Stripe Routes
- **POST `/api/payment/stripe/intent`** - Creates Stripe payment intent
  - Requires authentication
  - Body: `{ orderId: number, amount: number }`
  - Returns: `{ clientSecret: string, paymentIntentId: string, paymentId: number }`

- **POST `/api/payment/stripe/webhook`** - Handles Stripe webhooks
  - Verifies webhook signature
  - Updates payment and order status
  - Processes events: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### PayPal Routes
- **POST `/api/payment/paypal/create`** - Creates PayPal order
  - Requires authentication
  - Body: `{ orderId: number, amount: number, returnUrl?: string, cancelUrl?: string }`
  - Returns: `{ orderId: string, approvalUrl: string, paymentId: number }`

- **POST `/api/payment/paypal/capture`** - Captures PayPal payment
  - Requires authentication
  - Body: `{ orderId: string }`
  - Returns: `{ success: boolean, captureId: string, status: string }`

- **POST `/api/payment/paypal/webhook`** - Handles PayPal webhooks
  - Verifies webhook signature
  - Updates payment and order status
  - Processes events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

#### Square Routes
- **POST `/api/payment/square/create`** - Creates Square payment
  - Requires authentication
  - Body: `{ orderId: number, amount: number, sourceId: string, locationId?: string }`
  - Returns: `{ paymentId: string, status: string, receiptUrl: string, dbPaymentId: number }`

- **POST `/api/payment/square/webhook`** - Handles Square webhooks
  - Verifies webhook signature
  - Updates payment and order status
  - Processes payment completion and failure events

#### Unified Checkout Route
- **POST `/api/payment/checkout`** - Unified checkout endpoint
  - Requires authentication
  - Supports all three payment methods
  - Can create order from cart or use existing order
  - Body:
    ```typescript
    {
      orderId?: number,
      cartItems?: Array<{ productId: number, quantity: number }>,
      shippingAddress?: {
        street: string,
        city: string,
        state: string,
        zip: string,
        country: string
      },
      paymentMethod: 'stripe' | 'paypal' | 'square',
      paymentDetails?: {
        sourceId?: string,        // For Square
        locationId?: string,      // For Square
        returnUrl?: string,       // For PayPal
        cancelUrl?: string        // For PayPal
      }
    }
    ```
  - Returns payment-specific response based on processor

## Environment Variables

Required environment variables for each payment processor:

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayPal
```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox|production
PAYPAL_WEBHOOK_ID=...
```

### Square
```env
SQUARE_ACCESS_TOKEN=...
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_LOCATION_ID=...
SQUARE_WEBHOOK_SIGNATURE_KEY=...
```

## Security Features

1. **Webhook Signature Verification** - All webhooks are verified using processor-specific signature methods
2. **Authentication** - All user-facing endpoints require authentication via JWT
3. **Authorization** - Users can only access their own orders
4. **Order Status Validation** - Orders must be in 'pending' status for payment processing
5. **Environment-based Configuration** - API keys are loaded from environment variables

## Payment Flow

### Standard Payment Flow (Stripe)
1. User creates order or provides cart items
2. Frontend calls `/api/payment/checkout` with Stripe as payment method
3. Backend creates payment intent and returns client secret
4. Frontend uses Stripe.js to collect payment and confirm
5. Stripe sends webhook to `/api/payment/stripe/webhook`
6. Backend updates payment status to 'completed' and order status to 'processing'

### PayPal Flow
1. User creates order or provides cart items
2. Frontend calls `/api/payment/checkout` with PayPal as payment method
3. Backend creates PayPal order and returns approval URL
4. User is redirected to PayPal for approval
5. After approval, frontend calls `/api/payment/paypal/capture`
6. Backend captures payment and updates status
7. PayPal sends webhook confirmation

### Square Flow
1. User creates order or provides cart items
2. Frontend uses Square Web Payments SDK to generate source ID (nonce)
3. Frontend calls `/api/payment/checkout` with Square as payment method and sourceId
4. Backend creates and completes payment
5. Square sends webhook confirmation
6. Backend updates payment status

## Database Integration

Payment records are stored in the `payments` table with the following information:
- Order ID reference
- Payment method ('stripe', 'paypal', 'square')
- Transaction ID from payment processor
- Status ('pending', 'completed', 'failed', 'refunded')
- Amount
- Payment details (JSON field with processor-specific data)

Order status is automatically updated to 'processing' when payment is completed.

## Error Handling

All payment functions include comprehensive error handling:
- Invalid order validation
- Insufficient inventory checks
- Payment processor errors
- Webhook verification failures
- Database transaction errors

## Apple Pay and Google Pay Support

Both Stripe and Square support Apple Pay and Google Pay through their respective SDKs:
- **Stripe**: Automatic via `automatic_payment_methods` in payment intent
- **Square**: Configured through Square payment form

## Testing

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- More: https://stripe.com/docs/testing

### PayPal Sandbox
Use PayPal sandbox accounts for testing

### Square Sandbox
Use Square sandbox test cards

## Webhooks Setup

Configure webhooks in each payment processor dashboard:

### Stripe
- URL: `https://your-domain.com/api/payment/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### PayPal
- URL: `https://your-domain.com/api/payment/paypal/webhook`
- Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### Square
- URL: `https://your-domain.com/api/payment/square/webhook`
- Events: `payment.updated`

## Type Definitions

All payment functions include comprehensive TypeScript type definitions for:
- Request parameters
- Response objects
- Webhook events
- Payment processor-specific types

See individual library files for detailed type information.
