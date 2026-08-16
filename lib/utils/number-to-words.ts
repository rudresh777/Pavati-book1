// Marathi numbers 1-99 words mapping
const marathiUnitsAndTens: Record<number, string> = {
  0: 'शून्य',
  1: 'एक',
  2: 'दोन',
  3: 'तीन',
  4: 'चार',
  5: 'पाच',
  6: 'सहा',
  7: 'सात',
  8: 'आठ',
  9: 'नऊ',
  10: 'दहा',
  11: 'अकरा',
  12: 'बारा',
  13: 'तेरा',
  14: 'चौदा',
  15: 'पंधरा',
  16: 'सोळा',
  17: 'सतरा',
  18: 'अठरा',
  19: 'एकोणीस',
  20: 'वीस',
  21: 'एकवीस',
  22: 'बावीस',
  23: 'तेवीस',
  24: 'चोवीस',
  25: 'पंचवीस',
  26: 'सव्वीस',
  27: 'सत्तावीस',
  28: 'अठ्ठावीस',
  29: 'एकोणतीस',
  30: 'तीस',
  31: 'एकतीस',
  32: 'बत्तीस',
  33: 'तेहतीस',
  34: 'चौतीस',
  35: 'पस्तीस',
  36: 'छत्तीस',
  37: 'सदतीस',
  38: 'अडतीस',
  39: 'एकेचाळीस',
  40: 'चाळीस',
  41: 'एक्केचाळीस',
  42: 'बेचाळीस',
  43: 'त्रेचाळीस',
  44: 'चव्वेचाळीस',
  45: 'पंचेचाळीस',
  46: 'शेहेचाळीस',
  47: 'सत्तेचाळीस',
  48: 'अठ्ठेचाळीस',
  49: 'एकेपन्नास',
  50: 'पन्नास',
  51: 'एक्कावन्न',
  52: 'बावन्न',
  53: 'त्रेपन्न',
  54: 'चौपन्न',
  55: 'पंचावन्न',
  56: 'छप्पन्न',
  57: 'सत्तावन्न',
  58: 'अठ्ठावन्न',
  59: 'एकोणसाठ',
  60: 'साठ',
  61: 'एकसष्ठ',
  62: 'पासष्ठ',
  63: 'त्रेसष्ठ',
  64: 'चौसष्ठ',
  65: 'पासष्ठ',
  66: 'सहासष्ठ',
  67: 'सदुसष्ठ',
  68: 'अडुसष्ठ',
  69: 'एकोणसत्तर',
  70: 'सत्तर',
  71: 'एकाहत्तर',
  72: 'बाहत्तर',
  73: 'त्र्याहत्तर',
  74: 'चौऱ्याहत्तर',
  75: 'पंच्याहत्तर',
  76: 'शहात्तर',
  77: 'सत्त्याहत्तर',
  78: 'अठ्ठ्याहत्तर',
  79: 'एकोणऐंशी',
  80: 'ऐंशी',
  81: 'एक्याऐंशी',
  82: 'ब्याऐंशी',
  83: 'त्र्याऐंशी',
  84: 'चौऱ्याऐंशी',
  85: 'पंच्याऐंशी',
  86: 'शहाऐंशी',
  87: 'सत्त्याऐंशी',
  88: 'अठ्ठ्याऐंशी',
  89: 'एकोणनव्वद',
  90: 'नव्वद',
  91: 'एक्याण्णव',
  92: 'ब्याण्णव',
  93: 'त्र्याण्णव',
  94: 'चौऱ्याण्णव',
  95: 'पंच्याण्णव',
  96: 'शहाण्णव',
  97: 'सत्त्याण्णव',
  98: 'अठ्ठ्याण्णव',
  99: 'नव्याण्णव',
};

// English number converter helpers
const a = [
  '',
  'One ',
  'Two ',
  'Three ',
  'Four ',
  'Five ',
  'Six ',
  'Seven ',
  'Eight ',
  'Nine ',
  'Ten ',
  'Eleven ',
  'Twelve ',
  'Thirteen ',
  'Fourteen ',
  'Fifteen ',
  'Sixteen ',
  'Seventeen ',
  'Eighteen ',
  'Nineteen ',
];
const b = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function inWordsEnglishBelowThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return a[n];
  if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
  return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? inWordsEnglishBelowThousand(n % 100) : '');
}

/**
 * Converts a numeric amount to words in English (Indian numbering system).
 * e.g., 501 -> "Five Hundred One Rupees Only"
 */
export function numberToWordsEnglish(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'Zero Rupees Only';
  const num = Math.floor(amount);

  let output = '';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  if (crore > 0) {
    output += inWordsEnglishBelowThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    output += inWordsEnglishBelowThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    output += inWordsEnglishBelowThousand(thousand) + 'Thousand ';
  }
  if (remainder > 0) {
    output += inWordsEnglishBelowThousand(remainder);
  }

  return (output.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

/**
 * Converts a numeric amount to words in Marathi (Devanagari).
 * e.g., 501 -> "पाचशे एक रुपये फक्त"
 * e.g., 1001 -> "एक हजार एक रुपये फक्त"
 * e.g., 11000 -> "अकरा हजार रुपये फक्त"
 */
export function numberToWordsMarathi(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'शून्य रुपये फक्त';
  const num = Math.floor(amount);

  if (num === 0) return 'शून्य रुपये फक्त';

  const parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  if (crore > 0) {
    parts.push((marathiUnitsAndTens[crore] || crore.toString()) + ' कोटी');
  }
  if (lakh > 0) {
    parts.push((marathiUnitsAndTens[lakh] || lakh.toString()) + ' लाख');
  }
  if (thousand > 0) {
    parts.push((marathiUnitsAndTens[thousand] || thousand.toString()) + ' हजार');
  }
  if (hundred > 0) {
    if (hundred === 1) {
      parts.push('एकशे');
    } else {
      parts.push((marathiUnitsAndTens[hundred] || hundred.toString()) + 'शे');
    }
  }
  if (rest > 0) {
    parts.push(marathiUnitsAndTens[rest] || rest.toString());
  }

  return parts.join(' ') + ' रुपये फक्त';
}

/**
 * Format a number as Indian Currency (e.g. ₹ 1,500 or ₹ 1,500.00)
 */
export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
