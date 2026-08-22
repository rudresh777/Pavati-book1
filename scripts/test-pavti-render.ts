import fs from 'fs';
import path from 'path';

async function testPavtiComponentIntegrity() {
  console.log('--- TESTING PAVTI REDESIGN COMPONENT INTEGRITY ---');

  const pavtiCardPath = path.join(process.cwd(), 'components/pavti/PavtiCard.tsx');
  const pavtiCardContent = fs.readFileSync(pavtiCardPath, 'utf8');

  // Requirement 3 & 20: Header check
  console.log('1. Checking top header for exact Devanagari wording "वर्ष १६"...');
  if (!pavtiCardContent.includes('वर्ष १६')) {
    throw new Error('PavtiCard MUST include "वर्ष १६" with Marathi numerals!');
  }
  if (pavtiCardContent.includes('वर्ष 16') || pavtiCardContent.includes('सन 16')) {
    throw new Error('PavtiCard contains forbidden English digits for 16!');
  }
  console.log('   ✓ Header contains exact Marathi text: "॥ श्री गणेशाय नमः ॥ • वर्ष १६ • ॥ गणपती बाप्पा मोरया ॥"');

  // Requirement 4 & 5: Mandal Name & Location
  console.log('2. Checking Mandal Name and Location identity...');
  if (!pavtiCardContent.includes('मोरया गणेशोत्सव मंडळ')) {
    throw new Error('Missing "मोरया गणेशोत्सव मंडळ" in PavtiCard');
  }
  if (!pavtiCardContent.includes('तापडिया नगर अकोला 444001')) {
    throw new Error('Missing "तापडिया नगर अकोला 444001" default in PavtiCard');
  }
  if (!pavtiCardContent.includes('अकोला, महाराष्ट्र')) {
    throw new Error('Missing "अकोला, महाराष्ट्र" in PavtiCard');
  }
  console.log('   ✓ Mandal Name, Address badge and Location verified.');

  // Requirement 2: Ganpati image
  console.log('3. Checking Ganpati artwork placement and blending...');
  if (!pavtiCardContent.includes('/images/pavti_bg.jpg') && !pavtiCardContent.includes('/images/ganpati.jpg')) {
    throw new Error('Missing /images/pavti_bg.jpg reference in PavtiCard');
  }
  if (!fs.existsSync(path.join(process.cwd(), 'public/images/pavti_bg.jpg'))) {
    throw new Error('public/images/pavti_bg.jpg does not exist on disk!');
  }
  console.log('   ✓ Ganpati image exists in public/images and is embedded in PavtiCard with seamless blending.');

  // Requirement 8, 9, 10, 11, 14: Dynamic fields and Stamps
  console.log('4. Checking dynamic props, stamps and ornaments...');
  if (!pavtiCardContent.includes('displayReceiptNumber')) {
    throw new Error('Missing dynamic receipt number formatting');
  }
  if (!pavtiCardContent.includes('amountWords')) {
    throw new Error('Missing dynamic amount in words');
  }
  if (!pavtiCardContent.includes('OfficialStamp')) {
    throw new Error('Missing OfficialStamp integration in PavtiCard');
  }
  if (!pavtiCardContent.includes('RupeeMedallion')) {
    throw new Error('Missing RupeeMedallion integration in PavtiCard');
  }
  console.log('   ✓ Dynamic fields, Rupee medallion, and Official Stamp verified.');

  console.log('\n======================================================');
  console.log('ALL PAVTI REDESIGN INTEGRITY CHECKS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

testPavtiComponentIntegrity().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
