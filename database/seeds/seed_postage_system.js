/**
 * Postage System: Create Tables + Seed Real Carriers/Zones/Rates
 * Run: node backend/database/seeds/seed_postage_system.js
 */
const mysql = require('mysql2/promise');

const DB = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'roundbuy_db',
    port: 3306,
    multipleStatements: true
};

async function run() {
    const conn = await mysql.createConnection(DB);
    console.log('✅ Connected to database');

    // ─── 1. CREATE TABLES ─────────────────────────────────────────
    console.log('\n📦 Creating shipping tables...');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS shipping_carriers (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(100)  NOT NULL,
            code        VARCHAR(50)   NOT NULL UNIQUE,
            logo_url    VARCHAR(500)  DEFAULT NULL,
            api_url     VARCHAR(500)  DEFAULT NULL,
            api_key     VARCHAR(255)  DEFAULT NULL,
            api_secret  VARCHAR(255)  DEFAULT NULL,
            tracking_url_template VARCHAR(500) DEFAULT NULL COMMENT 'Template with {tracking_number} placeholder',
            is_active   TINYINT(1)   NOT NULL DEFAULT 1,
            notes       TEXT          DEFAULT NULL,
            created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ shipping_carriers');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS shipping_zones (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(100)  NOT NULL,
            description     VARCHAR(255)  DEFAULT NULL,
            countries       TEXT          DEFAULT NULL COMMENT 'JSON array of ISO country codes',
            sort_order      INT           NOT NULL DEFAULT 0,
            created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ shipping_zones');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS shipping_rates (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            carrier_id      INT           NOT NULL,
            zone_id         INT           NOT NULL,
            service_name    VARCHAR(150)  NOT NULL,
            service_code    VARCHAR(80)   DEFAULT NULL,
            min_weight_kg   DECIMAL(8,3)  NOT NULL DEFAULT 0,
            max_weight_kg   DECIMAL(8,3)  NOT NULL DEFAULT 30,
            base_price      DECIMAL(10,2) NOT NULL,
            price_per_kg    DECIMAL(10,2) NOT NULL DEFAULT 0,
            currency        CHAR(3)       NOT NULL DEFAULT 'GBP',
            delivery_days_min INT         DEFAULT NULL,
            delivery_days_max INT         DEFAULT NULL,
            is_active       TINYINT(1)    NOT NULL DEFAULT 1,
            created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (carrier_id) REFERENCES shipping_carriers(id) ON DELETE CASCADE,
            FOREIGN KEY (zone_id)    REFERENCES shipping_zones(id)    ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ shipping_rates');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS postage_shipments (
            id                  INT AUTO_INCREMENT PRIMARY KEY,
            user_id             INT           NOT NULL,
            order_id            INT           DEFAULT NULL,
            carrier_id          INT           DEFAULT NULL,
            rate_id             INT           DEFAULT NULL,
            tracking_number     VARCHAR(100)  NOT NULL UNIQUE,
            sender_address      JSON          NOT NULL,
            receiver_address    JSON          NOT NULL,
            weight_kg           DECIMAL(8,3)  NOT NULL,
            package_dimensions  JSON          DEFAULT NULL COMMENT '{"length_cm","width_cm","height_cm"}',
            total_cost          DECIMAL(10,2) NOT NULL DEFAULT 0,
            currency            CHAR(3)       NOT NULL DEFAULT 'GBP',
            status              ENUM('pending','label_created','picked_up','in_transit','out_for_delivery','delivered','returned','cancelled')
                                NOT NULL DEFAULT 'pending',
            label_url           VARCHAR(500)  DEFAULT NULL,
            qr_code_url         TEXT          DEFAULT NULL,
            notes               TEXT          DEFAULT NULL,
            created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id)    REFERENCES users(id)              ON DELETE CASCADE,
            FOREIGN KEY (carrier_id) REFERENCES shipping_carriers(id)  ON DELETE SET NULL,
            FOREIGN KEY (rate_id)    REFERENCES shipping_rates(id)     ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  ✓ postage_shipments');

    // Add declined column to event_bids if it doesn't exist
    await conn.execute(`
        ALTER TABLE event_bids
        ADD COLUMN IF NOT EXISTS declined TINYINT(1) NOT NULL DEFAULT 0
    `).catch(() => {
        // Ignore if column already exists (older MySQL)
        console.log('  ℹ event_bids.declined column may already exist, skipping');
    });
    console.log('  ✓ event_bids.declined column');

    // ─── 2. SEED CARRIERS ─────────────────────────────────────────
    console.log('\n📬 Seeding carriers...');

    const carriers = [
        {
            name: 'Royal Mail',
            code: 'royal_mail',
            logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/Royal_Mail.svg/200px-Royal_Mail.svg.png',
            tracking_url_template: 'https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}',
            notes: 'UK national postal carrier. Reliable for domestic parcels.'
        },
        {
            name: 'DPD UK',
            code: 'dpd_uk',
            logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/DPD_logo.svg/200px-DPD_logo.svg.png',
            tracking_url_template: 'https://track.dpd.co.uk/parcels/{tracking_number}',
            notes: 'Premium courier. Next-day and express domestic/EU service.'
        },
        {
            name: 'Evri (Hermes)',
            code: 'evri',
            logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Evri_logo.svg/200px-Evri_logo.svg.png',
            tracking_url_template: 'https://www.evri.com/track/parcel/{tracking_number}',
            notes: 'Budget domestic parcel service. Good for small items.'
        },
        {
            name: 'DHL Express',
            code: 'dhl_express',
            logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/DHL_Logo.svg/200px-DHL_Logo.svg.png',
            tracking_url_template: 'https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}',
            notes: 'International express. Best for EU and worldwide deliveries.'
        },
        {
            name: 'UPS',
            code: 'ups',
            logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/UPS_Logo_Shield_2017.svg/200px-UPS_Logo_Shield_2017.svg.png',
            tracking_url_template: 'https://www.ups.com/track?loc=en_GB&tracknum={tracking_number}',
            notes: 'International courier. Strong EU and worldwide coverage.'
        },
        {
            name: 'ParcelForce',
            code: 'parcelforce',
            logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Parcelforce_logo.svg/200px-Parcelforce_logo.svg.png',
            tracking_url_template: 'https://www.parcelforce.com/track-trace?trackNumber={tracking_number}',
            notes: 'Royal Mail group express parcel service. UK and international.'
        },
    ];

    const carrierIds = {};
    for (const c of carriers) {
        // Check if already exists
        const [rows] = await conn.execute('SELECT id FROM shipping_carriers WHERE code = ?', [c.code]);
        if (rows.length) {
            carrierIds[c.code] = rows[0].id;
            console.log(`  ↩ ${c.name} already exists (id=${rows[0].id})`);
            continue;
        }
        const [result] = await conn.execute(
            `INSERT INTO shipping_carriers (name, code, logo_url, tracking_url_template, notes) VALUES (?, ?, ?, ?, ?)`,
            [c.name, c.code, c.logo_url, c.tracking_url_template, c.notes]
        );
        carrierIds[c.code] = result.insertId;
        console.log(`  ✓ ${c.name} (id=${result.insertId})`);
    }

    // ─── 3. SEED ZONES ────────────────────────────────────────────
    console.log('\n🌍 Seeding shipping zones...');

    const zones = [
        {
            name: 'UK Domestic',
            description: 'Mainland UK, including Scotland and Wales',
            countries: JSON.stringify(['GB']),
            sort_order: 1
        },
        {
            name: 'EU Zone 1',
            description: 'Western Europe: France, Germany, Netherlands, Belgium, Spain, Italy, Portugal',
            countries: JSON.stringify(['FR','DE','NL','BE','ES','IT','PT','AT','LU']),
            sort_order: 2
        },
        {
            name: 'EU Zone 2',
            description: 'Eastern/Northern Europe: Poland, Czech, Sweden, Denmark, Finland, Hungary, Romania',
            countries: JSON.stringify(['PL','CZ','SE','DK','FI','HU','RO','SK','HR','BG','SI','LT','LV','EE']),
            sort_order: 3
        },
        {
            name: 'Rest of Europe',
            description: 'Switzerland, Norway, Iceland, Turkey, and non-EU European countries',
            countries: JSON.stringify(['CH','NO','IS','TR','UA','RS','BA','MK','AL','GE','AM','AZ']),
            sort_order: 4
        },
        {
            name: 'North America',
            description: 'USA and Canada',
            countries: JSON.stringify(['US','CA']),
            sort_order: 5
        },
        {
            name: 'Asia Pacific',
            description: 'Australia, New Zealand, Japan, South Korea, Singapore, India',
            countries: JSON.stringify(['AU','NZ','JP','KR','SG','IN','HK','MY','TH','PH']),
            sort_order: 6
        },
        {
            name: 'Rest of World',
            description: 'All other countries not covered by specific zones',
            countries: JSON.stringify([]),
            sort_order: 7
        },
    ];

    const zoneIds = {};
    for (const z of zones) {
        const [rows] = await conn.execute('SELECT id FROM shipping_zones WHERE name = ?', [z.name]);
        if (rows.length) {
            zoneIds[z.name] = rows[0].id;
            console.log(`  ↩ ${z.name} already exists (id=${rows[0].id})`);
            continue;
        }
        const [result] = await conn.execute(
            `INSERT INTO shipping_zones (name, description, countries, sort_order) VALUES (?, ?, ?, ?)`,
            [z.name, z.description, z.countries, z.sort_order]
        );
        zoneIds[z.name] = result.insertId;
        console.log(`  ✓ ${z.name} (id=${result.insertId})`);
    }

    // ─── 4. SEED RATES ────────────────────────────────────────────
    console.log('\n💰 Seeding shipping rates...');

    // Check existing rates
    const [existingRates] = await conn.execute('SELECT COUNT(*) as cnt FROM shipping_rates');
    if (existingRates[0].cnt > 0) {
        console.log(`  ↩ ${existingRates[0].cnt} rates already exist, skipping rate seeding.`);
    } else {
        const rates = [
            // ── Royal Mail ── Domestic
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail 1st Class Letter', code: 'rm_1st_letter', min: 0, max: 0.1,  base: 1.10, ppkg: 0,    minDays: 1, maxDays: 2 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail 2nd Class Letter', code: 'rm_2nd_letter', min: 0, max: 0.1,  base: 0.75, ppkg: 0,    minDays: 2, maxDays: 3 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail Small Parcel 1st', code: 'rm_sm_1st',    min: 0, max: 2.0,  base: 3.99, ppkg: 0.50, minDays: 1, maxDays: 2 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail Small Parcel 2nd', code: 'rm_sm_2nd',    min: 0, max: 2.0,  base: 2.99, ppkg: 0.30, minDays: 2, maxDays: 3 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail Large Parcel 1st', code: 'rm_lg_1st',    min: 2.001, max: 10, base: 8.99, ppkg: 0.80, minDays: 1, maxDays: 2 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail Tracked 24',      code: 'rm_t24',        min: 0, max: 20,  base: 4.99, ppkg: 0.60, minDays: 1, maxDays: 1 },
            { carrier: 'royal_mail', zone: 'UK Domestic', service: 'Royal Mail Tracked 48',      code: 'rm_t48',        min: 0, max: 20,  base: 3.49, ppkg: 0.40, minDays: 2, maxDays: 3 },
            // Royal Mail International
            { carrier: 'royal_mail', zone: 'EU Zone 1',   service: 'RM International Standard',  code: 'rm_int_std_eu1', min: 0, max: 2, base: 9.99,  ppkg: 2.00, minDays: 3, maxDays: 7 },
            { carrier: 'royal_mail', zone: 'EU Zone 2',   service: 'RM International Standard',  code: 'rm_int_std_eu2', min: 0, max: 2, base: 11.99, ppkg: 2.50, minDays: 5, maxDays: 10 },
            { carrier: 'royal_mail', zone: 'North America',service: 'RM International Standard', code: 'rm_int_std_na',  min: 0, max: 2, base: 14.99, ppkg: 3.00, minDays: 5, maxDays: 10 },

            // ── DPD UK ── Domestic
            { carrier: 'dpd_uk', zone: 'UK Domestic', service: 'DPD Next Day',         code: 'dpd_nextday',    min: 0, max: 30, base: 5.99,  ppkg: 0.50, minDays: 1, maxDays: 1 },
            { carrier: 'dpd_uk', zone: 'UK Domestic', service: 'DPD 2-Day',            code: 'dpd_2day',       min: 0, max: 30, base: 4.49,  ppkg: 0.40, minDays: 2, maxDays: 2 },
            { carrier: 'dpd_uk', zone: 'UK Domestic', service: 'DPD Express AM',       code: 'dpd_express_am', min: 0, max: 30, base: 12.99, ppkg: 0.80, minDays: 1, maxDays: 1 },
            { carrier: 'dpd_uk', zone: 'EU Zone 1',   service: 'DPD Classic EU',       code: 'dpd_classic_eu1',min: 0, max: 30, base: 8.99,  ppkg: 1.20, minDays: 2, maxDays: 4 },
            { carrier: 'dpd_uk', zone: 'EU Zone 2',   service: 'DPD Classic EU',       code: 'dpd_classic_eu2',min: 0, max: 30, base: 11.99, ppkg: 1.50, minDays: 3, maxDays: 6 },

            // ── Evri ── Domestic budget
            { carrier: 'evri', zone: 'UK Domestic', service: 'Evri Standard',          code: 'evri_std',       min: 0, max: 15, base: 2.99,  ppkg: 0.25, minDays: 2, maxDays: 4 },
            { carrier: 'evri', zone: 'UK Domestic', service: 'Evri Next Day',          code: 'evri_nextday',   min: 0, max: 15, base: 4.49,  ppkg: 0.35, minDays: 1, maxDays: 1 },
            { carrier: 'evri', zone: 'UK Domestic', service: 'Evri Large Parcel',      code: 'evri_large',     min: 5.001, max: 30, base: 5.99, ppkg: 0.30, minDays: 3, maxDays: 5 },

            // ── DHL Express ── International
            { carrier: 'dhl_express', zone: 'EU Zone 1',   service: 'DHL Express Worldwide', code: 'dhl_exp_eu1', min: 0, max: 70, base: 14.99, ppkg: 2.50, minDays: 1, maxDays: 2 },
            { carrier: 'dhl_express', zone: 'EU Zone 2',   service: 'DHL Express Worldwide', code: 'dhl_exp_eu2', min: 0, max: 70, base: 17.99, ppkg: 3.00, minDays: 1, maxDays: 3 },
            { carrier: 'dhl_express', zone: 'Rest of Europe', service: 'DHL Express Worldwide', code: 'dhl_exp_roe', min: 0, max: 70, base: 21.99, ppkg: 3.50, minDays: 2, maxDays: 4 },
            { carrier: 'dhl_express', zone: 'North America', service: 'DHL Express Worldwide', code: 'dhl_exp_na', min: 0, max: 70, base: 24.99, ppkg: 4.00, minDays: 2, maxDays: 5 },
            { carrier: 'dhl_express', zone: 'Asia Pacific',  service: 'DHL Express Worldwide', code: 'dhl_exp_ap', min: 0, max: 70, base: 27.99, ppkg: 4.50, minDays: 2, maxDays: 5 },
            { carrier: 'dhl_express', zone: 'Rest of World', service: 'DHL Express Worldwide', code: 'dhl_exp_row', min: 0, max: 70, base: 34.99, ppkg: 5.00, minDays: 3, maxDays: 7 },

            // ── UPS ── International
            { carrier: 'ups', zone: 'EU Zone 1',   service: 'UPS Expedited',      code: 'ups_exp_eu1', min: 0, max: 70, base: 13.99, ppkg: 2.20, minDays: 2, maxDays: 4 },
            { carrier: 'ups', zone: 'EU Zone 2',   service: 'UPS Expedited',      code: 'ups_exp_eu2', min: 0, max: 70, base: 16.99, ppkg: 2.80, minDays: 3, maxDays: 5 },
            { carrier: 'ups', zone: 'North America',service: 'UPS Worldwide Saver',code: 'ups_ww_na',   min: 0, max: 70, base: 22.99, ppkg: 3.80, minDays: 2, maxDays: 5 },
            { carrier: 'ups', zone: 'Asia Pacific', service: 'UPS Worldwide Saver',code: 'ups_ww_ap',   min: 0, max: 70, base: 26.99, ppkg: 4.20, minDays: 3, maxDays: 6 },
            { carrier: 'ups', zone: 'Rest of World',service: 'UPS Worldwide Saver',code: 'ups_ww_row',  min: 0, max: 70, base: 32.99, ppkg: 5.00, minDays: 4, maxDays: 8 },

            // ── ParcelForce ── Domestic + International
            { carrier: 'parcelforce', zone: 'UK Domestic', service: 'ParcelForce Express 24', code: 'pf_exp24',  min: 0, max: 30, base: 7.99,  ppkg: 0.60, minDays: 1, maxDays: 1 },
            { carrier: 'parcelforce', zone: 'UK Domestic', service: 'ParcelForce Express 48', code: 'pf_exp48',  min: 0, max: 30, base: 5.99,  ppkg: 0.45, minDays: 2, maxDays: 2 },
            { carrier: 'parcelforce', zone: 'EU Zone 1',   service: 'ParcelForce Euro Priority', code: 'pf_eu1',min: 0, max: 30, base: 12.99, ppkg: 1.80, minDays: 2, maxDays: 4 },
            { carrier: 'parcelforce', zone: 'North America', service: 'ParcelForce Global Express', code: 'pf_na', min: 0, max: 30, base: 28.99, ppkg: 3.50, minDays: 3, maxDays: 7 },
        ];

        let rateCount = 0;
        for (const r of rates) {
            const carrierId = carrierIds[r.carrier];
            const zoneId = zoneIds[r.zone];
            if (!carrierId || !zoneId) {
                console.warn(`  ⚠ Skipping rate "${r.service}" — carrier or zone not found`);
                continue;
            }
            await conn.execute(
                `INSERT INTO shipping_rates
                 (carrier_id, zone_id, service_name, service_code, min_weight_kg, max_weight_kg, base_price, price_per_kg, currency, delivery_days_min, delivery_days_max)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'GBP', ?, ?)`,
                [carrierId, zoneId, r.service, r.code, r.min, r.max, r.base, r.ppkg, r.minDays, r.maxDays]
            );
            rateCount++;
        }
        console.log(`  ✓ ${rateCount} rates seeded`);
    }

    // ─── 5. SUMMARY ───────────────────────────────────────────────
    const [cCount] = await conn.execute('SELECT COUNT(*) as cnt FROM shipping_carriers WHERE is_active=1');
    const [zCount] = await conn.execute('SELECT COUNT(*) as cnt FROM shipping_zones');
    const [rCount] = await conn.execute('SELECT COUNT(*) as cnt FROM shipping_rates WHERE is_active=1');

    console.log('\n🎉 Postage system seeded successfully!');
    console.log(`   Carriers: ${cCount[0].cnt}`);
    console.log(`   Zones:    ${zCount[0].cnt}`);
    console.log(`   Rates:    ${rCount[0].cnt}`);

    await conn.end();
}

run().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
