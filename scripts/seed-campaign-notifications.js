/**
 * Seed Campaign Notifications
 * Populates the database with 16 predefined campaign notification types
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roundbuy'
};

const campaignNotifications = [
    {
        type_key: 'account_verified',
        category: 'account',
        priority: 'high',
        collapsed_title: 'Account Verified',
        collapsed_message: 'Your email has been verified successfully!',
        collapsed_icon_bg_color: '#10B981',
        expanded_title: 'Account Verified',
        expanded_message: 'Congratulations! Your email has been verified. You now have full access to all RoundBuy features.',
        expanded_button_1_text: 'Explore Features',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'Home' }),
        expanded_button_1_color: '#10B981',
        fullscreen_heading: 'Account Verified',
        fullscreen_subheading: 'Welcome to RoundBuy',
        fullscreen_description: 'Your email has been successfully verified. You can now enjoy all the features RoundBuy has to offer!',
        fullscreen_primary_button_text: 'Get Started',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'Home' }),
        fullscreen_primary_button_color: '#10B981',
        trigger_type: 'event',
        trigger_conditions: JSON.stringify({ event: 'email_verified', send_once: true })
    },
    {
        type_key: 'privacy_security',
        category: 'privacy',
        priority: 'medium',
        collapsed_title: 'Privacy & Security',
        collapsed_message: 'Please familiarize yourself with our Privacy Policy and other policies!',
        collapsed_icon_bg_color: '#1E3A8A',
        expanded_title: 'Privacy & Security',
        expanded_message: 'Please familiarize yourself with our Privacy Policy and other policies!',
        expanded_button_1_text: 'Privacy policy',
        expanded_button_1_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy' }),
        expanded_button_1_color: '#2563EB',
        expanded_button_2_text: 'Other policies',
        expanded_button_2_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        expanded_button_2_color: '#FFFFFF',
        fullscreen_heading: 'Privacy & Security',
        fullscreen_subheading: 'Read RoundBuy Policies',
        fullscreen_description: 'Please familiarize yourself with our Privacy policy and other policies! You can find our Privacy policy from here: https://roundbuy.com/privacy/. And our other policies from here: https://roundbuy.com/legal/',
        fullscreen_primary_button_text: 'Privacy policy',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy' }),
        fullscreen_primary_button_color: '#2563EB',
        fullscreen_secondary_button_text: 'More info',
        fullscreen_secondary_button_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        fullscreen_secondary_button_color: '#6B7280',
        trigger_type: 'one_time',
        trigger_conditions: JSON.stringify({ days_after_signup: 7, send_once: true })
    },
    {
        type_key: 'att_preferences',
        category: 'privacy',
        priority: 'medium',
        collapsed_title: 'ATT Preferences',
        collapsed_message: 'Manage your App Tracking Transparency preferences',
        collapsed_icon_bg_color: '#7C3AED',
        expanded_title: 'ATT Preferences',
        expanded_message: 'Control how apps can track your activity across other companies\' apps and websites.',
        expanded_button_1_text: 'Manage Settings',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'ATTPreferences' }),
        expanded_button_1_color: '#7C3AED',
        fullscreen_heading: 'App Tracking Transparency',
        fullscreen_subheading: 'Your Privacy Matters',
        fullscreen_description: 'Manage your tracking preferences to control how RoundBuy and other apps can track your activity.',
        fullscreen_primary_button_text: 'Manage Settings',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'ATTPreferences' }),
        fullscreen_primary_button_color: '#7C3AED',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ after_login_count: 2, recurrence: 'once_after_2_months' })
    },
    {
        type_key: 'cookies_preferences',
        category: 'privacy',
        priority: 'medium',
        collapsed_title: 'Cookies Preferences',
        collapsed_message: 'Manage your cookie preferences',
        collapsed_icon_bg_color: '#F59E0B',
        expanded_title: 'Cookies Preferences',
        expanded_message: 'Control how we use cookies to improve your experience.',
        expanded_button_1_text: 'Cookie Settings',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'CookieSettings' }),
        expanded_button_1_color: '#F59E0B',
        fullscreen_heading: 'Cookie Preferences',
        fullscreen_subheading: 'Customize Your Experience',
        fullscreen_description: 'Manage your cookie preferences to control how we use cookies on RoundBuy.',
        fullscreen_primary_button_text: 'Manage Cookies',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'CookieSettings' }),
        fullscreen_primary_button_color: '#F59E0B',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ after_login_count: 2, recurrence: 'once_after_2_months' })
    },
    {
        type_key: 'privacy_policy_update',
        category: 'legal',
        priority: 'high',
        collapsed_title: 'Privacy Policy Update',
        collapsed_message: 'We\'ve updated our Privacy Policy',
        collapsed_icon_bg_color: '#DC2626',
        expanded_title: 'Privacy Policy Update',
        expanded_message: 'We\'ve made important updates to our Privacy Policy. Please review the changes.',
        expanded_button_1_text: 'Read Policy',
        expanded_button_1_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy' }),
        expanded_button_1_color: '#DC2626',
        fullscreen_heading: 'Privacy Policy Updated',
        fullscreen_subheading: 'Important Changes',
        fullscreen_description: 'We\'ve updated our Privacy Policy to better protect your data. Please take a moment to review the changes.',
        fullscreen_primary_button_text: 'Read Policy',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy' }),
        fullscreen_primary_button_color: '#DC2626',
        trigger_type: 'one_time',
        trigger_conditions: JSON.stringify({ days_after_signup: 7, send_once: true })
    },
    {
        type_key: 'legal_update',
        category: 'legal',
        priority: 'high',
        collapsed_title: 'Legal Update',
        collapsed_message: 'Important legal document updates',
        collapsed_icon_bg_color: '#DC2626',
        expanded_title: 'Legal Update',
        expanded_message: 'We\'ve updated our legal documents. Please review the changes.',
        expanded_button_1_text: 'View Documents',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        expanded_button_1_color: '#DC2626',
        fullscreen_heading: 'Legal Documents Updated',
        fullscreen_subheading: 'Review Changes',
        fullscreen_description: 'We\'ve made updates to our legal documents. Please review these important changes.',
        fullscreen_primary_button_text: 'View Documents',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        fullscreen_primary_button_color: '#DC2626',
        trigger_type: 'manual',
        trigger_conditions: JSON.stringify({ manual_trigger_only: true })
    },
    {
        type_key: 'privacy_sec_pdf',
        category: 'privacy',
        priority: 'medium',
        collapsed_title: 'Privacy & Security PDF',
        collapsed_message: 'Download our comprehensive Privacy & Security guide',
        collapsed_icon_bg_color: '#1E3A8A',
        expanded_title: 'Privacy & Security PDF',
        expanded_message: 'Download our comprehensive guide to privacy and security on RoundBuy.',
        expanded_button_1_text: 'Download PDF',
        expanded_button_1_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy.pdf' }),
        expanded_button_1_color: '#2563EB',
        fullscreen_heading: 'Privacy & Security Guide',
        fullscreen_subheading: 'Comprehensive PDF Document',
        fullscreen_description: 'Download our detailed Privacy & Security guide to learn more about how we protect your data.',
        fullscreen_primary_button_text: 'Download PDF',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_url', url: 'https://roundbuy.com/privacy.pdf' }),
        fullscreen_primary_button_color: '#2563EB',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ recurrence: 'every_4_months' })
    },
    {
        type_key: 'legal_doc',
        category: 'legal',
        priority: 'medium',
        collapsed_title: 'Legal Documents',
        collapsed_message: 'Review our legal documents',
        collapsed_icon_bg_color: '#DC2626',
        expanded_title: 'Legal Documents',
        expanded_message: 'Review our Terms of Service and other legal documents.',
        expanded_button_1_text: 'View Documents',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        expanded_button_1_color: '#DC2626',
        fullscreen_heading: 'Legal Documents',
        fullscreen_subheading: 'Terms & Conditions',
        fullscreen_description: 'Review our legal documents including Terms of Service, User Agreement, and more.',
        fullscreen_primary_button_text: 'View Documents',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'LegalInfo' }),
        fullscreen_primary_button_color: '#DC2626',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ recurrence: 'every_4_months' })
    },
    {
        type_key: 'search_page_instructions',
        category: 'feature',
        priority: 'low',
        collapsed_title: 'Search Page Tips',
        collapsed_message: 'Learn how to search effectively on RoundBuy',
        collapsed_icon_bg_color: '#3B82F6',
        expanded_title: 'Search Page Instructions',
        expanded_message: 'Discover tips and tricks to find exactly what you\'re looking for.',
        expanded_button_1_text: 'Learn More',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'Search' }),
        expanded_button_1_color: '#3B82F6',
        fullscreen_heading: 'Search Like a Pro',
        fullscreen_subheading: 'Tips & Tricks',
        fullscreen_description: 'Learn how to use filters, categories, and search operators to find the perfect items on RoundBuy.',
        fullscreen_primary_button_text: 'Try Search',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'Search' }),
        fullscreen_primary_button_color: '#3B82F6',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ after_first_login: true, recurrence: 'once_after_1_month' })
    },
    {
        type_key: 'discount_offer',
        category: 'promotion',
        priority: 'high',
        collapsed_title: 'Special Discount',
        collapsed_message: 'Get {{discount_amount}}% off your next purchase!',
        collapsed_icon_bg_color: '#EF4444',
        expanded_title: 'Special Discount Offer',
        expanded_message: 'Exclusive offer: Get {{discount_amount}}% off your next purchase. Limited time only!',
        expanded_button_1_text: 'Shop Now',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'Search' }),
        expanded_button_1_color: '#EF4444',
        fullscreen_heading: 'Special Discount',
        fullscreen_subheading: '{{discount_amount}}% Off',
        fullscreen_description: 'Don\'t miss out! Get {{discount_amount}}% off your next purchase. This exclusive offer is available for a limited time only.',
        fullscreen_primary_button_text: 'Shop Now',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'Search' }),
        fullscreen_primary_button_color: '#EF4444',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ recurrence: 'every_14_days', manual_trigger_allowed: true })
    },
    {
        type_key: 'reset_password',
        category: 'account',
        priority: 'high',
        collapsed_title: 'Password Reset',
        collapsed_message: 'Your password reset request has been received',
        collapsed_icon_bg_color: '#F59E0B',
        expanded_title: 'Password Reset Request',
        expanded_message: 'We\'ve received your password reset request. Check your email for instructions.',
        expanded_button_1_text: 'Check Email',
        expanded_button_1_action: JSON.stringify({ type: 'custom', action: 'open_email_app' }),
        expanded_button_1_color: '#F59E0B',
        fullscreen_heading: 'Password Reset',
        fullscreen_subheading: 'Check Your Email',
        fullscreen_description: 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.',
        fullscreen_primary_button_text: 'Got It',
        fullscreen_primary_button_action: JSON.stringify({ type: 'dismiss' }),
        fullscreen_primary_button_color: '#F59E0B',
        trigger_type: 'event',
        trigger_conditions: JSON.stringify({ event: 'password_reset_requested' })
    },
    {
        type_key: 'green_plan_feature',
        category: 'feature',
        priority: 'medium',
        collapsed_title: 'Green Plan Features',
        collapsed_message: 'Discover exclusive Green Plan benefits',
        collapsed_icon_bg_color: '#10B981',
        expanded_title: 'Green Plan Features',
        expanded_message: 'Unlock exclusive features with your Green Plan subscription!',
        expanded_button_1_text: 'View Features',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        expanded_button_1_color: '#10B981',
        fullscreen_heading: 'Green Plan Benefits',
        fullscreen_subheading: 'Exclusive Features',
        fullscreen_description: 'Enjoy exclusive benefits with your Green Plan including priority support, advanced filters, and more!',
        fullscreen_primary_button_text: 'Explore Features',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        fullscreen_primary_button_color: '#10B981',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ plan: 'green', months_after_subscription: 1, recurrence: 'every_3_months' })
    },
    {
        type_key: 'gold_plan_feature',
        category: 'feature',
        priority: 'medium',
        collapsed_title: 'Gold Plan Features',
        collapsed_message: 'Discover exclusive Gold Plan benefits',
        collapsed_icon_bg_color: '#F59E0B',
        expanded_title: 'Gold Plan Features',
        expanded_message: 'Unlock premium features with your Gold Plan subscription!',
        expanded_button_1_text: 'View Features',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        expanded_button_1_color: '#F59E0B',
        fullscreen_heading: 'Gold Plan Benefits',
        fullscreen_subheading: 'Premium Features',
        fullscreen_description: 'Enjoy premium benefits with your Gold Plan including unlimited listings, featured ads, and more!',
        fullscreen_primary_button_text: 'Explore Features',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        fullscreen_primary_button_color: '#F59E0B',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ plan: 'gold', months_after_subscription: 1, recurrence: 'every_3_months' })
    },
    {
        type_key: 'violet_plan_feature',
        category: 'feature',
        priority: 'medium',
        collapsed_title: 'Violet Plan Features',
        collapsed_message: 'Discover exclusive Violet Plan benefits',
        collapsed_icon_bg_color: '#7C3AED',
        expanded_title: 'Violet Plan Features',
        expanded_message: 'Unlock ultimate features with your Violet Plan subscription!',
        expanded_button_1_text: 'View Features',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        expanded_button_1_color: '#7C3AED',
        fullscreen_heading: 'Violet Plan Benefits',
        fullscreen_subheading: 'Ultimate Features',
        fullscreen_description: 'Enjoy ultimate benefits with your Violet Plan including VIP support, analytics, and more!',
        fullscreen_primary_button_text: 'Explore Features',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        fullscreen_primary_button_color: '#7C3AED',
        trigger_type: 'recurring',
        trigger_conditions: JSON.stringify({ plan: 'violet', months_after_subscription: 1, recurrence: 'every_3_months' })
    },
    {
        type_key: 'upgrade_to_gold',
        category: 'promotion',
        priority: 'medium',
        collapsed_title: 'Upgrade to Gold Plan',
        collapsed_message: 'Unlock premium features with Gold Plan',
        collapsed_icon_bg_color: '#F59E0B',
        expanded_title: 'Upgrade to Gold Plan',
        expanded_message: 'Take your RoundBuy experience to the next level with Gold Plan!',
        expanded_button_1_text: 'Upgrade Now',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        expanded_button_1_color: '#F59E0B',
        fullscreen_heading: 'Upgrade to Gold',
        fullscreen_subheading: 'Premium Experience',
        fullscreen_description: 'Upgrade to Gold Plan and enjoy premium features including unlimited listings, priority support, and more!',
        fullscreen_primary_button_text: 'Upgrade Now',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        fullscreen_primary_button_color: '#F59E0B',
        trigger_type: 'one_time',
        trigger_conditions: JSON.stringify({ current_plan: 'green', months_after_subscription: 1, send_once: true })
    },
    {
        type_key: 'upgrade_to_violet',
        category: 'promotion',
        priority: 'medium',
        collapsed_title: 'Upgrade to Violet Plan',
        collapsed_message: 'Unlock ultimate features with Violet Plan',
        collapsed_icon_bg_color: '#7C3AED',
        expanded_title: 'Upgrade to Violet Plan',
        expanded_message: 'Experience the ultimate RoundBuy experience with Violet Plan!',
        expanded_button_1_text: 'Upgrade Now',
        expanded_button_1_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        expanded_button_1_color: '#7C3AED',
        fullscreen_heading: 'Upgrade to Violet',
        fullscreen_subheading: 'Ultimate Experience',
        fullscreen_description: 'Upgrade to Violet Plan and enjoy ultimate features including VIP support, advanced analytics, and more!',
        fullscreen_primary_button_text: 'Upgrade Now',
        fullscreen_primary_button_action: JSON.stringify({ type: 'open_screen', screen: 'SubscriptionPlans' }),
        fullscreen_primary_button_color: '#7C3AED',
        trigger_type: 'one_time',
        trigger_conditions: JSON.stringify({ current_plan: 'gold', months_after_subscription: 1, send_once: true })
    }
];

async function seedCampaignNotifications() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Seeding campaign notifications...');

        for (const notification of campaignNotifications) {
            // Check if notification already exists
            const [existing] = await connection.execute(
                'SELECT id FROM campaign_notifications WHERE type_key = ?',
                [notification.type_key]
            );

            if (existing.length > 0) {
                console.log(`  ⏭️  Skipping ${notification.type_key} (already exists)`);
                continue;
            }

            // Insert notification
            const columns = Object.keys(notification).join(', ');
            const placeholders = Object.keys(notification).map(() => '?').join(', ');
            const values = Object.values(notification);

            await connection.execute(
                `INSERT INTO campaign_notifications (${columns}) VALUES (${placeholders})`,
                values
            );

            console.log(`  ✅ Created ${notification.type_key}`);
        }

        console.log('\n✅ Campaign notifications seeded successfully!');
        console.log(`   Total: ${campaignNotifications.length} notification types`);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedCampaignNotifications()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { seedCampaignNotifications };
