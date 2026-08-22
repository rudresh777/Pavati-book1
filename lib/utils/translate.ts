/**
 * Marathi Translation Utility
 * Handles automatic translation of announcements, titles, content, and venues into natural Marathi.
 */

// Offline dictionary for common Mandals & festival terms as reliable fallback
const OFFLINE_TERMS_MAP: Record<string, string> = {
  'ganesh': 'गणेश',
  'ganpati': 'गणपती',
  'bappa': 'बाप्पा',
  'morya': 'मोरया',
  'aarti': 'आरती',
  'maha aarti': 'महाआरती',
  'mahaprasad': 'महाप्रसाद',
  'prasad': 'प्रसाद',
  'puja': 'पूजा',
  'pooja': 'पूजा',
  'havan': 'हवन',
  'procession': 'मिरवणूक',
  'arrival': 'आगमन',
  'visarjan': 'विसर्जन',
  'immersion': 'विसर्जन',
  'meeting': 'बैठक',
  'all devotees': 'सर्व भाविक भक्त',
  'devotees': 'भाविक भक्त',
  'cordially invited': 'सहर्ष निमंत्रित',
  'invited': 'निमंत्रित',
  'grand': 'भव्य',
  'celebration': 'उत्सव',
  'festival': 'महोत्सव',
  'donation': 'देणगी / वर्गणी',
  'contribution': 'वर्गणी',
  'receipt': 'पावती',
  'mandap': 'मंडप',
  'main mandap': 'मुख्य मंडप',
  'stage': 'रंगमंच',
  'venue': 'स्थान',
  'date': 'दिनांक',
  'time': 'वेळ',
  'morning': 'सकाळी',
  'evening': 'संध्याकाळी',
  'night': 'रात्री',
  'afternoon': 'दुपारी',
  'daily': 'दररोज',
  'today': 'आज',
  'tomorrow': 'उद्या',
  'held': 'आयोजित',
  'organized': 'आयोजित',
  'please attend': 'कृपया उपस्थित राहावे',
  'welcome': 'स्वागत',
  'presents': 'सादर करत आहे',
  'cultural program': 'सांस्कृतिक कार्यक्रम',
  'bhajan': 'भजन संध्या',
  'kirtan': 'कीर्तन',
  'satyanarayan': 'सत्यनारायण पूजा',
  'modak': 'मोदक प्रसाद',
  'competition': 'स्पर्धा',
  'drawing competition': 'चित्रकला स्पर्धा',
  'dance competition': 'नृत्य स्पर्धा',
  'blood donation camp': 'रक्तदान शिबिर',
  'health camp': 'आरोग्य तपासणी शिबिर',
};

/**
 * Checks if the text contains non-Marathi / Latin alphabet characters
 */
export function containsNonMarathi(text: string): boolean {
  if (!text) return false;
  // Check if string contains English/Latin characters
  return /[a-zA-Z]/.test(text);
}

/**
 * Translates given text into Marathi.
 * If the text is already Marathi (Devanagari without English), it returns it as is.
 * Otherwise, it queries Google Translate API with timeouts and fallbacks to offline dictionary.
 */
export async function translateToMarathi(text: string): Promise<string> {
  if (!text || !text.trim()) return '';

  const trimmed = text.trim();

  // If text doesn't contain English letters, it's already Devanagari/Marathi
  if (!containsNonMarathi(trimmed)) {
    return trimmed;
  }

  // 1. Primary: Google Translate single endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=mr&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedSegments = data[0].map((item: any) => item[0]).filter(Boolean);
        const translatedText = translatedSegments.join('').trim();
        if (translatedText) {
          return translatedText;
        }
      }
    }
  } catch (err) {
    // Silently proceed to secondary translation / fallback
  }

  // 2. Secondary: MyMemory Translation API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|mr`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText && !data.responseData.translatedText.includes('MYMEMORY WARNING')) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (err) {
    // Proceed to dictionary replacement
  }

  // 3. Fallback: Dictionary replacement for common words
  let fallbackText = trimmed;
  for (const [enTerm, mrTerm] of Object.entries(OFFLINE_TERMS_MAP)) {
    const regex = new RegExp(`\\b${enTerm}\\b`, 'gi');
    fallbackText = fallbackText.replace(regex, mrTerm);
  }

  return fallbackText;
}
