export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10) || 3001,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      basic: process.env.STRIPE_PRICE_BASIC,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    },
  },
});
