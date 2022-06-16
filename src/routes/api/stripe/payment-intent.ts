import { ErrorHandler } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit'
import Stripe from 'stripe'

export const post: RequestHandler = async ({ request }) => {
  const stripe = new Stripe(
    'sk_test_51I7RL6J2WplztltUOlXaPetKyPuxBVvltv3Sw1saE28kDZRUBHiabRq4x4CifO8szv41kI8ed5zYp6de3Be36tZ200UiY7OksM',
    {
      apiVersion: null,
      typescript: true,
    }
  )

  const { currency, amount } = await request.json()

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.trunc(amount * 100),
      currency,
      payment_method_types: ['card'],
    })

    return {
      body: {
        clientSecret: paymentIntent.client_secret,
      },
    }
  } catch (error) {
    return ErrorHandler(error)
  }
}
