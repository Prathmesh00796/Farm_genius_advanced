
// Navigation intent detection for both voice and text inputs
export const navigationKeywords: Record<string, string[]> = {
  '/crop-scan': [
    'scan', 'crop', 'disease', 'rog', 'pik', 'पिक', 'पीक', 'स्कॅन', 'रोग', 'तपासणी', 'बीमारी', 'फसल', 'जांच',
    'karaycha', 'ahe', 'karna', 'hai', 'check', 'checkup', 'diagnosis', 'treatment', 'उपचार', 'औषध'
  ],
  '/yield-prediction': [
    'yield', 'prediction', 'andaj', 'anuman', 'utpadan', 'उत्पादन', 'अंदाज', 'उपज', 'अनुमान', 'पैदावार', 'kitna', 'hoga',
    'कितना', 'होगा', 'profit', 'revenue', 'नफा', 'कमाई'
  ],
  '/market-prices': [
    'market', 'price', 'bazar', 'bhav', 'rate', 'दर', 'भाव', 'बाजारभाव', 'बाजार', 'मंडी', 'दाम', 'kimat', 'kimmat',
    'किंमत', 'रेट', 'आजचे', 'today'
  ],
  '/nearby-markets': [
    'nearby', 'mandi', 'market', 'जवळची', 'बाजारपेठ', 'नजदीकी', 'पास', 'मंडी', 'location', 'address', 'address', 'पत्ता'
  ],
  '/policies': [
    'policy', 'scheme', 'yojana', 'yojane', 'योजना', 'सरकारी', 'सब्सिडी', 'subsidy', 'scheme', 'govt', 'government', 'शासन'
  ],
  '/agricultural-tips': [
    'tips', 'advice', 'guide', 'salla', 'margdarshan', 'टिप्स', 'सल्ला', 'मार्गदर्शन', 'alert', 'news', 'बातम्या'
  ],
  '/dealer': [
    'dealer', 'vyapari', 'व्यापारी', 'डीलर', 'sell', 'विक्री', 'bechna', 'बेचना'
  ],
  '/dealer/buy-offers': [
    'offer', 'buy', 'खरेदी', 'ऑफर', 'kharid'
  ],
  '/dealer/farmers': [
    'farmers', 'directory', 'शेतकरी', 'किसान', 'list', 'यादी'
  ],
  '/dealer/inventory': [
    'inventory', 'stock', 'साठा', 'माल', 'maal', 'godown'
  ],
  '/dealer/orders': [
    'orders', 'order', 'ऑर्डर', 'आदेश', 'booking'
  ],
  '/dashboard': [
    'dashboard', 'main', 'डॅशबोर्ड', 'डैशबोर्ड', 'home', 'शुरुआत', 'summary'
  ],
  '/profile': [
    'profile', 'account', 'प्रोफाइल', 'प्रोफ़ाइल', 'खाता', 'settings', 'माझी', 'meri'
  ],
};

export const findNavigationRoute = (text: string): string | null => {
  const lowerText = text.toLowerCase().trim();
  
  // Use a score-based matching to find the best route
  let bestRoute: string | null = null;
  let maxMatches = 0;

  for (const [path, words] of Object.entries(navigationKeywords)) {
    let currentMatches = 0;
    for (const word of words) {
      if (lowerText.includes(word.toLowerCase())) {
        // Boost score for exact matches or longer words
        currentMatches += word.length;
      }
    }
    
    if (currentMatches > maxMatches) {
      maxMatches = currentMatches;
      bestRoute = path;
    }
  }
  
  // Only return if we have a significant match
  return maxMatches > 2 ? bestRoute : null;
};
