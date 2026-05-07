/**
 * Trusted root domain database.
 * Store ROOT domains only (no subdomains).
 * Subdomains vary constantly — comparing against roots avoids false negatives.
 */
export const TRUSTED_DOMAINS: Record<string, string> = {
  // Search
  'google.com': 'Google',
  'bing.com': 'Bing',
  'duckduckgo.com': 'DuckDuckGo',
  'yahoo.com': 'Yahoo',
  // AI
  'chatgpt.com': 'ChatGPT',
  'openai.com': 'OpenAI',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  // Social
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'twitter.com': 'Twitter',
  'x.com': 'X (Twitter)',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'tiktok.com': 'TikTok',
  'snapchat.com': 'Snapchat',
  'whatsapp.com': 'WhatsApp',
  // Dev
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'stackoverflow.com': 'Stack Overflow',
  'npmjs.com': 'npm',
  // Finance / E-Commerce
  'paypal.com': 'PayPal',
  'amazon.com': 'Amazon',
  'ebay.com': 'eBay',
  'stripe.com': 'Stripe',
  'shopify.com': 'Shopify',
  'walmart.com': 'Walmart',
  // Banking
  'bankofamerica.com': 'Bank of America',
  'wellsfargo.com': 'Wells Fargo',
  'chase.com': 'Chase',
  'citibank.com': 'Citibank',
  // Tech
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'adobe.com': 'Adobe',
  'dropbox.com': 'Dropbox',
  'zoom.us': 'Zoom',
  // Email
  'gmail.com': 'Gmail',
  'outlook.com': 'Outlook',
  // Indian
  'sbi.co.in': 'SBI',
  'hdfcbank.com': 'HDFC Bank',
  'icicibank.com': 'ICICI Bank',
  'axisbank.com': 'Axis Bank',
  'paytm.com': 'Paytm',
  'upi.gov.in': 'UPI',
};

// Flat list of brand names (lowercase) for substring matching
export const BRAND_NAMES: string[] = [
  ...new Set(
    Object.entries(TRUSTED_DOMAINS).map(([domain]) => domain.split('.')[0])
  ),
];
