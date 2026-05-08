/**
 * Threat Encyclopedia Database
 *
 * All heuristic threat definitions, their descriptions, how they work,
 * how attackers use them, and their risk scores — per the Master Risk Metric Table.
 */

export interface ThreatEntry {
  id: string;
  category: string;
  label: string;
  score: number;
  severity: 'Critical' | 'Strong' | 'Moderate' | 'Weak';
  shortDescription: string;
  howItWorks: string;
  attackerUsage: string;
  example: string;
  defenseNote: string;
}

export const THREAT_DATABASE: ThreatEntry[] = [
  // ── Category 1: Protocol Analysis ──────────────────────────────────────────
  {
    id: 'https_check',
    category: 'Protocol Analysis',
    label: 'Insecure Protocol (HTTP)',
    score: 10,
    severity: 'Weak',
    shortDescription: 'The URL uses HTTP instead of HTTPS, meaning all traffic is unencrypted.',
    howItWorks:
      'HTTPS establishes an encrypted TLS tunnel between your browser and the server. HTTP sends everything — including passwords and session cookies — as plain text over the network. Any device on the same network (Wi-Fi router, ISP, VPN exit node) can read and modify the traffic.',
    attackerUsage:
      'Phishing sites often use HTTP to avoid the complexity of obtaining a TLS certificate. Man-in-the-middle attackers on public Wi-Fi use HTTP to inject malicious scripts or capture credentials.',
    example: 'http://paypal-login.xyz/account',
    defenseNote:
      'Modern browsers show a "Not Secure" warning for HTTP sites. Never enter credentials on an HTTP page.',
  },
  {
    id: 'port_check',
    category: 'Protocol Analysis',
    label: 'Uncommon Port Usage',
    score: 5,
    severity: 'Weak',
    shortDescription: 'URL specifies an unusual port number outside standard 80/443.',
    howItWorks:
      'Web servers conventionally run on port 80 (HTTP) or 443 (HTTPS). Specifying a nonstandard port (e.g., :8080, :4444) suggests the server is running custom or unreviewed infrastructure, often bypassing corporate firewalls that only allow standard ports.',
    attackerUsage:
      'Used to run command-and-control servers or phishing kits on machines where ports 80/443 are blocked or monitored. Also used to create URLs that look similar to legitimate ones but resolve differently.',
    example: 'http://secure-login.com:4444/verify',
    defenseNote: 'Legitimate services always use standard ports. A custom port is a strong red flag.',
  },

  // ── Category 2: Structural Analysis ────────────────────────────────────────
  {
    id: 'ip_detection',
    category: 'Structural Analysis',
    label: 'Raw IP Address',
    score: 30,
    severity: 'Critical',
    shortDescription: 'URL points to a raw IPv4 address instead of a named domain.',
    howItWorks:
      'Domain names require registration and ownership. Raw IP addresses are transient — they can be reassigned, hosted anonymously, or spun up in seconds on bulletproof hosting. There is no certificate authority validating the identity behind a raw IP.',
    attackerUsage:
      'Phishing kits are frequently deployed on compromised machines or anonymous cloud instances that have no registered domain. Attackers use IPs to avoid domain takedowns and brand monitoring.',
    example: 'http://185.220.101.45/paypal/login',
    defenseNote:
      'Legitimate services never expose raw IPs as user-facing addresses. Never trust a URL with a numeric host.',
  },
  {
    id: 'at_symbol',
    category: 'Structural Analysis',
    label: 'Credential Trap (@ Symbol)',
    score: 35,
    severity: 'Critical',
    shortDescription: 'The "@" symbol is used to redirect the browser to a different host entirely.',
    howItWorks:
      'In URLs, the "@" symbol separates optional credentials (username:password) from the actual host. Browsers ignore everything before "@". So "https://paypal.com@evil.xyz" sends the browser to "evil.xyz", while displaying "paypal.com" in the URL as a fake credential.',
    attackerUsage:
      'A classic social engineering trick. Victims are shown what looks like a PayPal or Google link, but they land on the attacker\'s server. URL shorteners and SMS messages make this especially dangerous.',
    example: 'https://google.com@evil-phishing-site.net/login',
    defenseNote:
      'Modern browsers display a warning but some mobile browsers obscure the full URL. Always check the domain after the "@".',
  },
  {
    id: 'subdomain_depth',
    category: 'Structural Analysis',
    label: 'Excessive Subdomain Depth',
    score: 15,
    severity: 'Strong',
    shortDescription: 'The URL has an unusually deep subdomain chain (>3 levels).',
    howItWorks:
      'Subdomains appear to the LEFT of the root domain. Humans read left-to-right, so they trust the leftmost part. Attackers exploit this by making the leftmost subdomain a trusted brand name, while the actual root domain (the one that matters) is malicious.',
    attackerUsage:
      'A URL like "paypal.com.secure.update.evil.xyz" visually looks like PayPal, but resolves to "evil.xyz". Deep chains push the root domain off small mobile screens entirely.',
    example: 'paypal.login.verify.security-check.xyz',
    defenseNote:
      'Always scroll to find the LAST domain before the path (/) — that is the only domain that matters.',
  },
  {
    id: 'length_check',
    category: 'Structural Analysis',
    label: 'Abnormal Domain Length',
    score: 10,
    severity: 'Moderate',
    shortDescription: 'The domain is excessively long, often used to embed misleading brand tokens.',
    howItWorks:
      'Attackers create long domains to embed multiple trusted brand keywords inside them (e.g., "apple-support-verify-account-billing.xyz"). This exploits the fact that people recognize brand words faster than they analyze full URLs.',
    attackerUsage:
      'On mobile browsers, long URLs are often truncated, hiding the malicious TLD at the end. Attackers also use length to exhaust the user\'s attention.',
    example: 'secure-apple-account-login-verify-update.xyz',
    defenseNote: 'Short, simple domains are a mark of legitimate services. Excessive length is suspicious.',
  },
  {
    id: 'tld_check',
    category: 'Structural Analysis',
    label: 'Suspicious TLD',
    score: 15,
    severity: 'Strong',
    shortDescription: 'The URL uses a top-level domain that is statistically over-represented in phishing and abuse campaigns.',
    howItWorks:
      'Top-level domains (TLDs) are the rightmost label of a domain name (.com, .net, .xyz). Certain TLDs are favored by attackers because they are cheap, require no identity verification, and have lenient abuse policies. Security researchers track TLD abuse rates — extensions like .xyz, .top, .click, .tk, and .icu are consistently found in disproportionately high numbers in phishing datasets.',
    attackerUsage:
      'Attackers register thousands of disposable domains on cheap TLDs like .xyz or .tk (which offers free registrations). Because these domains cost almost nothing, they are burned after each campaign and replaced. This makes takedowns expensive but domain registration trivial for attackers.',
    example: 'paypal-login.xyz, secure-banking.top, google-verify.icu',
    defenseNote:
      'While legitimate sites do use alternative TLDs, a suspicious TLD combined with brand keywords or auth bait is a strong phishing indicator. Always verify the full domain before entering any credentials.',
  },
  {
    id: 'shortener_check',
    category: 'Structural Analysis',
    label: 'URL Shortener',
    score: 15,
    severity: 'Moderate',
    shortDescription: 'The URL uses a shortening service that obscures the final destination.',
    howItWorks:
      'URL shorteners (bit.ly, tinyurl.com, t.co) replace a full URL with a short opaque token. The real destination is only revealed when the short link is followed. This means you cannot evaluate the safety of a URL from the link itself — the actual landing page could be anything from a legitimate article to malware.',
    attackerUsage:
      'Attackers use URL shorteners in phishing messages to hide the malicious destination from both victims and security filters. Email security gateways and message scanners cannot inspect the final URL without following the redirect. Social media platforms that display link previews often show the shortener\'s branding instead of the real destination.',
    example: 'https://bit.ly/3kX9s8D, https://t.co/abc123',
    defenseNote:
      'Never click a shortened link in an unexpected message. Use a URL expander service (e.g., checkshorturl.com) to preview the destination before visiting.',
  },

  // ── Category 3: Lexical Analysis ───────────────────────────────────────────
  {
    id: 'hyphen_check',
    category: 'Lexical Analysis',
    label: 'Excessive Hyphens',
    score: 10,
    severity: 'Moderate',
    shortDescription: 'Domain contains too many hyphens, often used to chain deceptive keywords.',
    howItWorks:
      'Legitimate brand domains are almost never hyphenated (google.com, paypal.com). Attackers use hyphens to concatenate multiple trust-inducing keywords to create domains that feel authoritative.',
    attackerUsage:
      '"paypal-secure-account-billing-update.com" feels legitimate at a glance because it contains real words associated with PayPal. Hyphens create visual whitespace between keywords, making the domain easier to read and thus more convincing.',
    example: 'secure-login-account-update-billing.xyz',
    defenseNote: 'Real brand websites don\'t need hyphens to describe themselves in the URL.',
  },
  {
    id: 'auth_bait',
    category: 'Lexical Analysis',
    label: 'Authentication Bait Keywords',
    score: 8,
    severity: 'Moderate',
    shortDescription: 'Path or domain contains words designed to trigger a sense of urgency or legitimacy.',
    howItWorks:
      'Terms like "login", "verify", "secure", "account", "billing" are psychologically loaded — they trigger an action response. Phishing sites use these words to make the URL feel like an official authentication flow.',
    attackerUsage:
      'A path like "/account/verify/login" signals to the victim that they need to take action urgently. When combined with brand impersonation in the domain, the full URL looks completely legitimate.',
    example: 'https://paypa1.xyz/account/verify/login',
    defenseNote:
      'Legitimate auth pages use clean paths (/login, /signin). Multiple auth keywords chained together is a red flag.',
  },
  {
    id: 'fragment_abuse',
    category: 'Lexical Analysis',
    label: 'Fragment Abuse',
    score: 5,
    severity: 'Weak',
    shortDescription: 'The URL fragment (#) contains trusted brand names to deceive the reader.',
    howItWorks:
      'The fragment (#...) is processed entirely by the client browser and never sent to the server. Attackers put trusted brand names in the fragment so the URL visually looks associated with that brand, even though it resolves to a completely different server.',
    attackerUsage:
      'A URL like "evil.xyz/malware#paypal-login" makes a user think they\'re visiting PayPal. On link previews (WhatsApp, Discord), the fragment is often visible and further reinforces the deception.',
    example: 'http://evil.xyz/landing#paypal-login',
    defenseNote:
      'The domain (not the fragment) determines where you go. Always focus on the part before the "#".',
  },

  // ── Category 4: Brand Impersonation ────────────────────────────────────────
  {
    id: 'brand_keyword_impersonation',
    category: 'Brand Impersonation',
    label: 'Exact Brand Keyword',
    score: 25,
    severity: 'Strong',
    shortDescription: 'A trusted brand name appears in the URL, but the registered domain is different.',
    howItWorks:
      'Attackers register domains that contain the target brand name (e.g., "paypal-support.net"), banking on users not distinguishing between "paypal.com" (official) and "paypal-support.net" (malicious). The brand name in the URL is purely cosmetic.',
    attackerUsage:
      'Used in phishing emails with subject lines like "Urgent: Your PayPal account has been limited". The link in the email contains "paypal" to create false trust at a glance before the user examines the full domain.',
    example: 'paypal-security-login.xyz',
    defenseNote: 'Only the root domain matters. "paypal.com" is safe; "paypal-anything.xyz" is not.',
  },
  {
    id: 'brand_char_substitution',
    category: 'Brand Impersonation',
    label: 'Character Substitution',
    score: 35,
    severity: 'Critical',
    shortDescription: 'Deceptive characters (0 for o, 1 for l) are used to mimic a brand\'s domain.',
    howItWorks:
      'Visually similar characters (homoglyphs) are substituted into domain names. "paypa1.com" uses a "1" instead of an "l". At small font sizes or on mobile, this is nearly invisible. Punycode attacks extend this to Unicode characters from non-Latin alphabets.',
    attackerUsage:
      'Attackers register visually identical domains and use them as drop-in replacements for phishing emails. The victim\'s eye sees "paypal" but the URL resolves to a different server.',
    example: 'paypa1.com, g00gle-login.xyz',
    defenseNote:
      'Always double-check the exact spelling of the domain. Look closely at every character in the domain.',
  },
  {
    id: 'brand_typosquatting_1',
    category: 'Brand Impersonation',
    label: 'Typosquatting (1 Character)',
    score: 40,
    severity: 'Critical',
    shortDescription: 'Domain is exactly one character away from a real brand domain.',
    howItWorks:
      'Typosquatting exploits common keyboard errors. Attackers pre-register common typos of popular domains ("gooogle.com", "amazom.com") and wait for users who mistype. They then serve phishing pages or malware to these visitors.',
    attackerUsage:
      'A permanent passive attack — the domain just sits registered, harvesting misdirected traffic 24/7 without any active campaign needed. Often combined with lookalike login pages.',
    example: 'gooogle.com, micorsoft.net',
    defenseNote:
      'Use bookmarks for important sites. Don\'t trust URLs from emails — type the address yourself carefully.',
  },
  {
    id: 'brand_typosquatting_2',
    category: 'Brand Impersonation',
    label: 'Typosquatting (2 Characters)',
    score: 25,
    severity: 'Strong',
    shortDescription: 'Domain is two character edits away from a real brand domain.',
    howItWorks:
      'Similar to 1-character typosquatting but less obvious. Two-character edits allow for transpositions, substitutions, and omissions that are harder to spot — especially when combined with a plausible TLD.',
    attackerUsage:
      'Used when the 1-character variant is already taken or blocked. Longer brand names have more possible 2-character variants.',
    example: 'micrsoft.com, facebok.net',
    defenseNote: 'When in doubt about a domain\'s spelling, search for the brand in a search engine instead.',
  },
  {
    id: 'brand_subdomain_confusion',
    category: 'Brand Impersonation',
    label: 'Subdomain Trust Confusion',
    score: 45,
    severity: 'Critical',
    shortDescription: 'A trusted brand\'s official domain appears in the subdomain, not the root.',
    howItWorks:
      'Browsers resolve to the RIGHTMOST domain before the path. "paypal.com.evil.xyz" resolves to "evil.xyz". The "paypal.com" part is merely a subdomain — which anyone can create. Victims see "paypal.com" prominently and assume they\'re on PayPal.',
    attackerUsage:
      'Highly effective on mobile browsers that truncate long URLs. An attacker creates a subdomain on their own server: anyone can create any subdomain they want on their own domain. The attack requires only a cheap domain registration.',
    example: 'paypal.com.login-update.xyz',
    defenseNote:
      'ALWAYS scroll to find the rightmost domain before "/". Only that part is the server\'s actual identity.',
  },
  {
    id: 'brand_auth_keywords',
    category: 'Brand Impersonation',
    label: 'Brand + Auth Keyword Correlation',
    score: 20,
    severity: 'Strong',
    shortDescription: 'A brand name is combined with authentication keywords in the same domain.',
    howItWorks:
      'Combining brand impersonation with urgency keywords creates a multiplicative trust effect. "paypal-login-verify.xyz" suggests both that it\'s PayPal AND that the user needs to login and verify — an extremely compelling phishing scenario.',
    attackerUsage:
      'Used as the domain in phishing emails with subject lines like "Action Required: Verify your PayPal account within 24 hours". The domain reinforces the urgency narrative.',
    example: 'paypal-login-verify.xyz',
    defenseNote: 'Official brands never need their name AND action words in the same domain.',
  },

  // ── Category 5: Entropy Analysis ───────────────────────────────────────────
  {
    id: 'entropy_analysis',
    category: 'Entropy Analysis',
    label: 'Machine-Generated Pattern Detected',
    score: 18,
    severity: 'Moderate',
    shortDescription: 'The domain shows statistical patterns of machine-generated randomness: high digit density, low vowel ratio, or long alphanumeric clusters.',
    howItWorks:
      'Human-chosen domain names follow natural language patterns: they contain vowels, form pronounceable words, and avoid long random character runs. Domain Generation Algorithms (DGAs) used by phishing kits and botnets produce domains algorithmically — resulting in high digit ratios, consonant-heavy strings, and random-looking clusters like "xj82kd92". This engine calculates three entropy signals: digit density (>30% digits), vowel ratio (<20% vowels), and alphanumeric clustering (8+ mixed chars in a row).',
    attackerUsage:
      'Phishing operations generate thousands of unique domain variants per campaign using DGAs. Each victim or click may get a unique URL, preventing any single domain from being blocklisted. Botnets use DGAs for command-and-control: both the attacker\'s server and the infected machines independently generate the same domain names using a shared algorithm and date seed.',
    example: 'xj82kd92-login.net, qp74nd31-banklogin.xyz, xjkdwqpt-secure.xyz',
    defenseNote:
      'A domain that looks like a randomly generated string almost certainly is one. Legitimate businesses invest in memorable, pronounceable domain names. Machine-like names are a strong signal of disposable infrastructure.',
  },
  // Supplementary entropy breakdowns (educational)
  {
    id: 'entropy_digits',
    category: 'Entropy Analysis',
    label: 'High Digit Density (Detail)',
    score: 10,
    severity: 'Moderate',
    shortDescription: 'Domain contains an unusually high proportion of numbers (>30%).',
    howItWorks:
      'Human-memorable domains use words. Machine-generated domains have high digit ratios because random strings naturally contain numbers roughly as often as letters.',
    attackerUsage:
      'Domain Generation Algorithms (DGAs) produce domains like "xj82kd92-login.net". High digit ratio is a statistical fingerprint of algorithmic generation.',
    example: 'xj82kd92-login.net',
    defenseNote: 'Legitimate services invest in memorable, human-readable domains. Heavy numbers suggest automation.',
  },
  {
    id: 'entropy_vowels',
    category: 'Entropy Analysis',
    label: 'Low Vowel Ratio (Detail)',
    score: 8,
    severity: 'Weak',
    shortDescription: 'Domain has very few vowels (<20%), indicating machine-generated randomness.',
    howItWorks:
      'Natural language averages ~35-40% vowels. Truly random strings have ~20% because only 5 of 26 letters are vowels. Very low vowel density statistically suggests algorithmic generation.',
    attackerUsage:
      'DGA domains appear as consonant-heavy random strings, hard to pronounce and hard to remember — because they were never intended to be remembered by humans.',
    example: 'xjkdwqpt-secure.xyz',
    defenseNote: 'A domain you cannot pronounce is one a human probably did not choose.',
  },
  {
    id: 'entropy_alphanum',
    category: 'Entropy Analysis',
    label: 'Randomized Alphanumeric Clusters (Detail)',
    score: 15,
    severity: 'Moderate',
    shortDescription: 'Domain contains 8+ consecutive mixed letters and numbers with no linguistic pattern.',
    howItWorks:
      'Sequences like "aj82kd92x" have near-zero probability of appearing in a human-chosen domain. These are statistical outliers from random string generation.',
    attackerUsage:
      'Phishing kits generate unique subdomains per victim to prevent URL-based detection. Every link is unique and harder to blocklist.',
    example: 'aj82kd92x.login.net',
    defenseNote:
      'If a domain looks like a randomly generated string, treat it like one — it probably is.',
  },

  // ── Category 6: Redirect Analysis ──────────────────────────────────────────
  {
    id: 'redirect_abuse',
    category: 'Redirect Analysis',
    label: 'Redirect Parameter Abuse',
    score: 20,
    severity: 'Strong',
    shortDescription: 'URL contains a redirect parameter pointing to another domain, often a trusted brand.',
    howItWorks:
      'Open redirects occur when a website\'s URL accepts a destination parameter and forwards users there without validation. Attackers exploit them to build URLs that start on a semi-legitimate domain but end on a malicious one. Query params like "?next=", "?redirect=", "?url=" are common vectors.',
    attackerUsage:
      'An attacker constructs: "https://some-site.com/auth?redirect=https://paypal-fake.xyz/harvest". The victim sees "some-site.com" in the link preview and trusts it, but lands on the attacker\'s harvesting page. Even more dangerous when the redirecting site has a reputation score.',
    example: 'https://malicious.net/login?next=https://paypal.com',
    defenseNote: 'Be skeptical of any URL that contains "next=", "redirect=", "url=", or "return=" parameters.',
  },
  {
    id: 'encoded_redirect',
    category: 'Redirect Analysis',
    label: 'Encoded Redirect Payload',
    score: 25,
    severity: 'Strong',
    shortDescription: 'The redirect target URL is percent-encoded to bypass filters.',
    howItWorks:
      'URL encoding replaces characters with their hex equivalents (%3A = ":", %2F = "/"). Security filters often check for "http://" in query parameters; encoding it as "http%3A%2F%2F" bypasses naive string matching while still being decoded correctly by browsers.',
    attackerUsage:
      'WAFs, email security gateways, and simple URL scanners that look for raw "http://" strings are evaded. The victim\'s browser transparently decodes the payload and loads the malicious redirect target.',
    example: '?next=https%3A%2F%2Fpaypal-fake.xyz',
    defenseNote:
      'Security tools must decode URL parameters before scanning. Users should be wary of percent-signs in link parameters.',
  },

  // ── Category 7: Encoding & Obfuscation ─────────────────────────────────────
  {
    id: 'encoded_path',
    category: 'Encoding & Obfuscation',
    label: 'Excessive URL Encoding',
    score: 10,
    severity: 'Moderate',
    shortDescription: 'The path or query contains heavy percent-encoding beyond normal usage.',
    howItWorks:
      'Normal URLs rarely need more than a few encoded characters. Heavy encoding (e.g., %2F%2E%3A all over the path) is a strong indicator that the URL was constructed programmatically to bypass signature-based security scanners.',
    attackerUsage:
      'Encoding the path hides keywords that would trigger security filters. "/l%6Fgin" hides "login" from string matching scanners. Double-encoding ("%252F" to represent "%2F") can bypass scanners that only decode once.',
    example: 'https://evil.xyz/%6C%6F%67%69%6E',
    defenseNote:
      'If a URL looks like gibberish, decode it and check what it actually says before visiting.',
  },

  // ── Category 8: Execution / Payload Indicators ─────────────────────────────
  {
    id: 'suspicious_file',
    category: 'Payload Indicators',
    label: 'Suspicious Executable Extension',
    score: 15,
    severity: 'Strong',
    shortDescription: 'URL path ends with an extension associated with executable files or scripts.',
    howItWorks:
      'Executable files (.exe, .scr, .bat, .ps1) can run code directly on a user\'s system. Script files (.cmd) can do the same. Mobile device packages (.apk) are Android app files that can be sideloaded without store review. Clicking a download link that ends in these extensions initiates a file download.',
    attackerUsage:
      'Phishing emails contain "invoice" or "receipt" links that actually download malware. The file might be named "Invoice_PayPal.pdf.exe" where the ".exe" extension is the real one, but the ".pdf" makes it look safe.',
    example: 'https://files.evil.xyz/invoice_2024.pdf.exe',
    defenseNote:
      'Never download files from unexpected links. Check the full extension — modern OSes hide it by default.',
  },
  {
    id: 'path_depth',
    category: 'Payload Indicators',
    label: 'Deep Path Structure',
    score: 8,
    severity: 'Moderate',
    shortDescription: 'URL has more than 5 path segments, often used to obfuscate the destination.',
    howItWorks:
      'Legitimate services rarely need deeply nested paths for user-facing pages. Deep paths (/a/b/c/d/e/login) are often auto-generated by phishing kits to create unique URLs per victim, or to bury the actual landing page behind a directory structure that looks like a legitimate site hierarchy.',
    attackerUsage:
      'Every victim gets a unique deep URL, preventing link reputation services from blacklisting a single URL. The deep path also makes the URL too long to fully display on mobile screens.',
    example: 'https://evil.xyz/customer/account/login/verify/secure/update',
    defenseNote: 'Legitimate user-facing pages typically have short, descriptive paths.',
  },
];

// Build a lookup map for O(1) access by heuristic ID
export const THREAT_BY_ID: Record<string, ThreatEntry> = {};
THREAT_DATABASE.forEach(t => { THREAT_BY_ID[t.id] = t; });
