import Stripe from 'npm:stripe@20.4.1'

let stripeClient: Stripe | undefined

export function getStripeClient() {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim()

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY secret.')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
      httpClient: Stripe.createFetchHttpClient(),
    })
  }

  return stripeClient
}
