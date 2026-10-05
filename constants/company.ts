export const COMPANY = {
  name: '株式会社Ｐｒｉａｍｏｓ',
  representative: '閔鐘基',
  address: '東京都江戸川区西葛西8-15 新田住宅6-703',
  email: 'azabumin@gmail.com',
};

// While false, /pricing shows "applications are paused" instead of the payment flow. Keep in sync
// with CHECKOUT_OPEN in worker/src/payments.ts (the server refuses checkout regardless).
export const PAYMENTS_OPEN = true;

export const PRICING = {
  monthlyYen: 580,
  annualYen: 4800,
  trialDays: 7,
};
