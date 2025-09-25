#!/usr/bin/env node

/**
 * InterTools Stripe Integration Test
 * 
 * This script tests the Stripe integration with your production keys
 * to ensure everything is configured correctly.
 */

const Stripe = require('stripe');

// Your production Stripe keys
const STRIPE_SECRET_KEY = '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';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51QqScaHDhcVKRRbwKUmZ9DGrIAUb7aFxwIm1rS6RFZxOjlm3B9vGkG1CPGUe3J5fMh5VAE9cD7fp40bpZRgAc1Gl00rg9q88z1';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testStripeIntegration() {
  console.log('🔐 Testing InterTools Stripe Integration...\n');

  try {
    // Test 1: Verify API connection
    console.log('1️⃣  Testing Stripe API connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.email || account.id}`);
    console.log(`   Environment: ${STRIPE_SECRET_KEY.startsWith('sk_live') ? '🚀 PRODUCTION' : '🧪 TEST'}`);
    console.log('');

    // Test 2: List existing products
    console.log('2️⃣  Checking existing products...');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`✅ Found ${products.data.length} products in your account`);
    
    const intertoolsProduct = products.data.find(p => 
      p.name.toLowerCase().includes('intertools') || 
      p.description?.toLowerCase().includes('intertools')
    );
    
    if (intertoolsProduct) {
      console.log(`   📦 Found InterTools product: ${intertoolsProduct.name} (${intertoolsProduct.id})`);
    } else {
      console.log('   ⚠️  No InterTools product found. You\'ll need to create one.');
    }
    console.log('');

    // Test 3: List prices
    console.log('3️⃣  Checking pricing...');
    const prices = await stripe.prices.list({ limit: 10 });
    console.log(`✅ Found ${prices.data.length} prices in your account`);
    
    const monthlyPrices = prices.data.filter(p => 
      p.recurring?.interval === 'month' && 
      p.unit_amount === 3000 // $30.00
    );
    
    if (monthlyPrices.length > 0) {
      console.log(`   💰 Found monthly $30 price: ${monthlyPrices[0].id}`);
      console.log(`   📋 Use this price ID in your environment: STRIPE_PRICE_ID=${monthlyPrices[0].id}`);
    } else {
      console.log('   ⚠️  No $30/month price found. You\'ll need to create one.');
    }
    console.log('');

    // Test 4: Check webhooks
    console.log('4️⃣  Checking webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`✅ Found ${webhooks.data.length} webhook endpoints`);
    
    webhooks.data.forEach((webhook, index) => {
      console.log(`   🔗 Webhook ${index + 1}: ${webhook.url}`);
      console.log(`       Status: ${webhook.status}`);
      console.log(`       Events: ${webhook.enabled_events.length} configured`);
    });
    console.log('');

    // Test 5: Create a test customer (won't charge anything)
    console.log('5️⃣  Testing customer creation...');
    const testCustomer = await stripe.customers.create({
      email: 'test@intertools.pro',
      metadata: {
        source: 'integration-test',
        product: 'intertools-pro'
      }
    });
    console.log(`✅ Test customer created: ${testCustomer.id}`);
    
    // Clean up test customer
    await stripe.customers.del(testCustomer.id);
    console.log(`   🗑️  Test customer cleaned up`);
    console.log('');

    // Summary
    console.log('🎉 STRIPE INTEGRATION TEST COMPLETE!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('');
    
    if (!intertoolsProduct) {
      console.log('1️⃣  CREATE INTERTOOLS PRODUCT:');
      console.log('   - Go to https://dashboard.stripe.com/products');
      console.log('   - Click "Add product"');
      console.log('   - Name: "InterTools Pro"');
      console.log('   - Description: "Professional console log analysis and IDE integration"');
      console.log('   - Price: $30.00 USD monthly recurring');
      console.log('');
    }
    
    if (monthlyPrices.length === 0) {
      console.log('2️⃣  CREATE $30/MONTH PRICE:');
      console.log('   - In your product, add a price');
      console.log('   - Amount: $30.00');
      console.log('   - Billing period: Monthly');
      console.log('   - Copy the price ID (starts with "price_")');
      console.log('');
    } else {
      console.log('✅ PRICE CONFIGURED - Update your environment:');
      console.log(`   STRIPE_PRICE_ID=${monthlyPrices[0].id}`);
      console.log('');
    }
    
    if (webhooks.data.length === 0) {
      console.log('3️⃣  SET UP WEBHOOKS:');
      console.log('   - Go to https://dashboard.stripe.com/webhooks');
      console.log('   - Click "Add endpoint"');
      console.log('   - URL: https://your-domain.com/v1/webhook/stripe');
      console.log('   - Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted');
      console.log('');
    }
    
    console.log('4️⃣  START YOUR SERVERS:');
    console.log('   cd apps/server && npm run dev');
    console.log('   cd intertools-pro-frontend && npm run dev');
    console.log('');
    
    console.log('5️⃣  TEST THE FLOW:');
    console.log('   - Visit http://localhost:5174');
    console.log('   - Try the PRO version signup');
    console.log('   - Test with Stripe test card: 4242424242424242');
    console.log('');

  } catch (error) {
    console.error('❌ Stripe integration test failed:');
    console.error('');
    
    if (error.code === 'api_key_invalid') {
      console.error('🔑 INVALID API KEY');
      console.error('   Your Stripe secret key appears to be invalid.');
      console.error('   Please check your Stripe dashboard and verify the key.');
    } else if (error.code === 'authentication_required') {
      console.error('🔐 AUTHENTICATION REQUIRED');
      console.error('   The API key is valid but lacks required permissions.');
      console.error('   Make sure you\'re using a secret key (starts with sk_).');
    } else {
      console.error('🚨 UNEXPECTED ERROR');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
    }
    
    console.error('');
    console.error('💡 TROUBLESHOOTING:');
    console.error('   1. Verify your Stripe keys in the dashboard');
    console.error('   2. Make sure you have the correct permissions');
    console.error('   3. Check your internet connection');
    console.error('   4. Try with test keys first (sk_test_...)');
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testStripeIntegration().catch(console.error);
}

module.exports = { testStripeIntegration };
