/**
 * Seed country-specific KYC and KYB document types
 * Run: node database/seeds/seed_extra_kyc_document_types.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { promisePool: db } = require('../../src/config/database');

const docTypes = [
  // India (IN)
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYC', document_type_key: 'aadhaar_card', document_display_name: 'Aadhaar Card', requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: '12-digit Unique Identity Card issued by UIDAI. Upload front and back.' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYC', document_type_key: 'pan_card', document_display_name: 'PAN Card', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'Permanent Account Number card. Upload front showing photograph and signature.' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYC', document_type_key: 'indian_passport', document_display_name: 'Indian Passport', requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 0, sort_order: 3, notes: 'First and last pages of the passport photobook.' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYC', document_type_key: 'voter_id', document_display_name: 'Voter ID Card', requires_front: 1, requires_back: 1, requires_selfie: 0, is_primary: 0, sort_order: 4, notes: 'Election Commission of India ID card. Upload front and back.' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYB', document_type_key: 'gstin_certificate', document_display_name: 'GSTIN Registration Certificate', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'GST registration certificate (Form GST REG-06).' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYB', document_type_key: 'certificate_of_incorporation', document_display_name: 'MCA Certificate of Incorporation', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'Certificate of Incorporation issued by Ministry of Corporate Affairs.' },
  { country_code: 'IN', country_name: 'India', kyc_type: 'KYB', document_type_key: 'partnership_deed', document_display_name: 'Partnership Deed / Trade License', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 3, notes: 'Notarized partnership deed or local municipality trade license.' },

  // Japan (JP)
  { country_code: 'JP', country_name: 'Japan', kyc_type: 'KYC', document_type_key: 'my_number_card', document_display_name: 'My Number Card', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: 'Upload the FRONT side of your My Number Card only. Do not upload the back side containing the 12-digit number.' },
  { country_code: 'JP', country_name: 'Japan', kyc_type: 'KYC', document_type_key: 'japan_passport', document_display_name: 'Japanese Passport', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'Upload the photo/signature bio page.' },
  { country_code: 'JP', country_name: 'Japan', kyc_type: 'KYC', document_type_key: 'japan_drivers_license', document_display_name: "Japan Driver's License", requires_front: 1, requires_back: 1, requires_selfie: 0, is_primary: 0, sort_order: 3, notes: 'Upload the front and back of your driving license.' },
  { country_code: 'JP', country_name: 'Japan', kyc_type: 'KYB', document_type_key: 'corporate_number_register', document_display_name: 'Corporate Number Registration (Tohon)', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'Registry copy/extract (履歴事項全部証明書 - Tohon) issued within 3 months.' },
  { country_code: 'JP', country_name: 'Japan', kyc_type: 'KYB', document_type_key: 'tokyobo_extract', document_display_name: 'National Tax Agency Certificate', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'NTA corporate registry certificate (国税庁法人番号公表サイト).' },

  // United Arab Emirates (AE)
  { country_code: 'AE', country_name: 'United Arab Emirates', kyc_type: 'KYC', document_type_key: 'emirates_id', document_display_name: 'Emirates ID Card', requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: 'Official UAE Identity Card. Upload front and back.' },
  { country_code: 'AE', country_name: 'United Arab Emirates', kyc_type: 'KYC', document_type_key: 'uae_passport', document_display_name: 'UAE Passport', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'Upload the passport page showing details and photo.' },
  { country_code: 'AE', country_name: 'United Arab Emirates', kyc_type: 'KYB', document_type_key: 'trade_license', document_display_name: 'UAE Trade License', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'Valid Commercial or Professional Trade License issued by DED.' },
  { country_code: 'AE', country_name: 'United Arab Emirates', kyc_type: 'KYB', document_type_key: 'chamber_of_commerce_certificate', document_display_name: 'Chamber of Commerce Certificate', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'Active Chamber of Commerce membership certificate.' },

  // Saudi Arabia (SA)
  { country_code: 'SA', country_name: 'Saudi Arabia', kyc_type: 'KYC', document_type_key: 'saudi_national_id', document_display_name: 'Saudi National ID Card', requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: 'Official KSA National ID or Iqama Card. Upload front and back.' },
  { country_code: 'SA', country_name: 'Saudi Arabia', kyc_type: 'KYC', document_type_key: 'saudi_passport', document_display_name: 'Saudi Passport', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'Upload the photo biodata page.' },
  { country_code: 'SA', country_name: 'Saudi Arabia', kyc_type: 'KYB', document_type_key: 'commercial_registration', document_display_name: 'Commercial Registration (CR)', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'CR certificate issued by Ministry of Commerce and Investment.' },
  { country_code: 'SA', country_name: 'Saudi Arabia', kyc_type: 'KYB', document_type_key: 'chamber_of_commerce', document_display_name: 'KSA Chamber Certificate', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'Chamber of Commerce certificate.' },

  // Germany (DE)
  { country_code: 'DE', country_name: 'Germany', kyc_type: 'KYC', document_type_key: 'german_national_id', document_display_name: 'Personalausweis (National ID)', requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: 'German National ID Card, front and back.' },
  { country_code: 'DE', country_name: 'Germany', kyc_type: 'KYC', document_type_key: 'german_passport', document_display_name: 'Reisepass (German Passport)', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'German passport photo page.' },
  { country_code: 'DE', country_name: 'Germany', kyc_type: 'KYC', document_type_key: 'german_drivers_license', document_display_name: "German Driver's License", requires_front: 1, requires_back: 1, requires_selfie: 0, is_primary: 0, sort_order: 3, notes: 'German driving license card, front and back.' },
  { country_code: 'DE', country_name: 'Germany', kyc_type: 'KYB', document_type_key: 'handelsregister_auszug', document_display_name: 'Handelsregisterauszug (Registry Extract)', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'Commercial Register Extract issued within last 3 months.' },
  { country_code: 'DE', country_name: 'Germany', kyc_type: 'KYB', document_type_key: 'gewerbeanmeldung', document_display_name: 'Gewerbeanmeldung (Business Registration)', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'Local trade office business registration form (Gewerbeanmeldung).' },

  // France (FR)
  { country_code: 'FR', country_name: 'France', kyc_type: 'KYC', document_type_key: 'french_national_id', document_display_name: "Carte d'Identité (National ID)", requires_front: 1, requires_back: 1, requires_selfie: 1, is_primary: 1, sort_order: 1, notes: "French National ID Card, front and back." },
  { country_code: 'FR', country_name: 'France', kyc_type: 'KYC', document_type_key: 'french_passport', document_display_name: 'French Passport', requires_front: 1, requires_back: 0, requires_selfie: 1, is_primary: 0, sort_order: 2, notes: 'French passport photo page.' },
  { country_code: 'FR', country_name: 'France', kyc_type: 'KYC', document_type_key: 'french_drivers_license', document_display_name: "French Driver's License", requires_front: 1, requires_back: 1, requires_selfie: 0, is_primary: 0, sort_order: 3, notes: 'French driving license card, front and back.' },
  { country_code: 'FR', country_name: 'France', kyc_type: 'KYB', document_type_key: 'extrait_kbis', document_display_name: 'Extrait Kbis', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 1, sort_order: 1, notes: 'Official company registry extract (Kbis) less than 3 months old.' },
  { country_code: 'FR', country_name: 'France', kyc_type: 'KYB', document_type_key: 'statuts_societe', document_display_name: 'Company Statutes', requires_front: 1, requires_back: 0, requires_selfie: 0, is_primary: 0, sort_order: 2, notes: 'Certified copy of company articles/statutes.' },
];

async function main() {
  try {
    console.log('🌱 Starting extra KYC document types seeding...');
    
    let count = 0;
    for (const dt of docTypes) {
      // Check if already exists to avoid duplicates
      const [existing] = await db.query(
        'SELECT id FROM kyc_document_types WHERE country_code = ? AND document_type_key = ? AND kyc_type = ?',
        [dt.country_code, dt.document_type_key, dt.kyc_type]
      );
      
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO kyc_document_types 
           (country_code, country_name, kyc_type, document_type_key, document_display_name, requires_front, requires_back, requires_selfie, is_primary, sort_order, notes, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            dt.country_code,
            dt.country_name,
            dt.kyc_type,
            dt.document_type_key,
            dt.document_display_name,
            dt.requires_front,
            dt.requires_back,
            dt.requires_selfie,
            dt.is_primary,
            dt.sort_order,
            dt.notes
          ]
        );
        count++;
      }
    }
    
    console.log(`✅ Successfully seeded ${count} new KYC/KYB document types.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

main();
