// billing.js
const PRODUCT_SKU = 'premium_upgrade';

export async function initBilling(onSuccess) {
  if (localStorage.getItem('isPremium') === 'true') {
    onSuccess();
    return;
  }

  if ('getDigitalGoodsService' in window) {
    try {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      const purchases = await service.listPurchases();
      const premiumPurchase = purchases.find(p => p.itemId === PRODUCT_SKU);

      if (premiumPurchase) {
        if (!premiumPurchase.acknowledged) {
          await service.acknowledge(premiumPurchase.purchaseToken, 'onetime');
        }
        localStorage.setItem('isPremium', 'true');
        onSuccess();
      }
    } catch (err) {
      console.warn('Billing check failed:', err);
    }
  }
}

export async function makePurchase(onSuccess) {
  if (!('getDigitalGoodsService' in window)) {
    alert('Purchases are only available when installed via Google Play.');
    return;
  }

  try {
    const service = await window.getDigitalGoodsService('https://play.google.com/billing');
    const paymentMethodData = [{
      supportedMethods: 'https://play.google.com/billing',
      data: { sku: PRODUCT_SKU }
    }];

    const request = new PaymentRequest(paymentMethodData, {
      total: { label: 'Premium Upgrade', amount: { currency: 'USD', value: '2.99' } }
    });

    const response = await request.show();
    const { purchaseToken } = response.details;

    await service.acknowledge(purchaseToken, 'onetime');
    await response.complete('success');

    localStorage.setItem('isPremium', 'true');
    onSuccess();
  } catch (err) {
    console.error('Purchase failed or canceled:', err);
  }
}
