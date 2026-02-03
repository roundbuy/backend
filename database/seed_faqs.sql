-- Auto-generated FAQ seed file
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM faqs;
DELETE FROM faq_subcategories;
DELETE FROM faq_categories;
ALTER TABLE faqs AUTO_INCREMENT = 1;
ALTER TABLE faq_subcategories AUTO_INCREMENT = 1;
ALTER TABLE faq_categories AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- Category: Common questions
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (1, 'Common questions', 'Common questions', 1, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (1, 1, 'General', 1, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'What is RoundBuy?', 'RoundBuy is a shopping marketplace platform, where you buy, sell, give, form groups, rent and offers services around you. The concept is simple, set your imprecise location (your centre-point), and search products & services around you from other users, nearby. We aim to support local economies & recycling.', 1, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'What can be sold or offered on RoundBuy?', 'RoundBuy platform is mainly customer-to-customer (C2C) for selling & buying second-hand goods in any conditions from used to new. The platform is secondly business-to-customer (B2C), where businesses can offer products directly to customers. We love and encourage giving second life to old goods, though!', 2, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Is RoundBuy a Consumer-to-Consumer marketplace (C2C)?', 'Yes, the platform is mainly customer-to-customer (C2C) for selling & buying second-hand goods in any conditions from used to new, but business-to-customer (B2C) is also a possibility.', 3, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'What kind of groups can I form?', 'There are many possibilities to form groups from “rock band” to “reading group” or perhaps “Tupperware gathering” is more your thing, while mothers & parents could form “Baby clothes exchange” circle. And, you can combine selling & buying with any group activities.', 4, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Is RoundBuy also Business-to-Consumer (B2C) marketplace?', 'Yes, the platform is also Business-to-Consumer (B2C), where businesses can offer products directly to customers, from used to second-hand goods in any condition, but mainly customer-to-customer (C2C). Freelancers, entrepreneurs, local professionals, and even established businesses can sell at the platform.', 5, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Is RoundBuy both C2C and B2C marketplace?', 'Yes, RoundBuy platform is for both customer-to-customer (C2C), and Business-to-Consumer (B2C), however, we favour selling & buying second-hand goods around you, but also offering services locally.', 6, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Why should I use it?', 'Using RoundBuy is easy, economical and safe. Register, and set your imprecise location. Find anything you want around you, and save time, cash and resources. So, the platform is really for those who want to save, and buy & sell locally and around you, mainly from other private users.', 7, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Is it safe to use RoundBuy?', 'Yes, it is safe to use the platform. We keep your information private, we do not share it with anyone, and nor should you. You operate with you username, and never disclose your precise address. We use tight and comprehensive security measures to keep your personal data safe, and encourage keep your privacy.', 8, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Where can I use RoundBuy?', 'The platform can be used anywhere, on a computer, tablet or mobile phone with internet access. We aim to make the service available in all regions, wherever possible. It is available 24 hours, throughout the year, for you to use it from home, work or any place, really.', 9, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'How much it costs to use it?', 'The costs of the platform depends on the membership plan you choose, a basic tier, upgraded and enhanced plan. For private users: Green (for free), Orange (£2.00), and Gold (£4.00). For businesses: Violet (for free), Purple (£5.00) and Blue (£10.00). You can upgrade your plan. For more on plans click here.', 10, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'What can you advertise?', 'You can advertise products & services you want to buy or sell, such as second-hand goods, from used to new. Other options are seeking employment, offering services, forming groups or giving for free. Advertise with free standard ads, or get more visibility with paid ads e.g. to from “Children’s sports equipment exchange” group, or find “Band members”.', 11, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Lost your username or password?', 'If trouble logging into your account, because you forgot your username or password, we can help you. Please retrieve secure password or username, from the “Login page” by clicking “Forgot your password?”', 12, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 13, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (1, 1, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 14, true);


-- Category: RoundBuy basics
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (2, 'RoundBuy basics', 'RoundBuy basics', 2, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (2, 2, 'General', 2, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'What is the centre-point on the map?', 'The centre-point (icon) on the map is your default location, the search-point, which around you search buy products & services, which other users nearby are selling or renting, from their locations. Ideally, its close to your home, work or a place you spent time.', 15, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'What are the circles on the map?', 'The circles on the map are colour and letter coded activity circles, designating products & services available around your centre-point, and offered by other users. Click them to view a small product window, and again a product page, or filter search-bar to find more specific things around you.', 16, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'Why are the circles around your centre-point?', 'The circles around your centre-point, on the map are colour and letter coded activity circles, designating products & services available around your centre-point, and offered by other users. Click them to view a small product window, and again a product page, or filter search-bar to find more specific things around you.', 17, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'What activities are available?', 'These activities are available: Buy, Sell, Rent, Services, Give and From Groups. These are shown on the map as activity circles, which are colour and letter coded: Buy in dark blue with “B”, Sell in light blue with “S”, Rent in light grey “R”, Services in dark grey “SER”, Give in gold “Gi”, and form Groups in green with “Gr”.', 18, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'How are products & services shown on map?', 'Products & services are shown on the map by colour and letter coded circles, called activity circles. These are around your centre-point, and can be clicked to view a small product window, and again a product page, or filter search-bar to find more specific things around you.', 19, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'How do you search around your centre-point?', 'Product Gallery
1. Go to Search-page, and tap “Products” under the map.
2. Type a keyword e.g. boots to the search-field, and it automatically shows the search results.
3. Choose the “Filter” and your preferences, to filter out undesired goods, and tap “Show results”.
Map
1. Go to Search-page, and tap “Map” under the product gallery.
2. Type a keyword e.g. boots to the search-field, and it automatically shows the search results.
3. Choose the “Filter” and your preferences, to filter out undesired goods, and tap “Show results”.', 20, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'What is your default location?', 'Your default location (centre-point), is an imprecise home address, or location near to a place you spent time. This location is used as an exchange and meeting point, and your HomeMarket, the place from which you search used goods to Buy, or you sell goods to other users, around you.', 21, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'How is centre-point marked on the map?', 'The centre-point (or default location) is marked with an icon, with two concentric circles on top of each other, shown in the centre of the map. There is a radius line around the centre-point icon, which indicates the distance in meters, miles or kilometres and walking time.', 22, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'What are product locations?', 'Product location(s) is the spot on the map, or a location in which you advertise your products & services, and are ready to schedule a meeting to exchange the item. Green plan has one, Orange has three, while in Gold you have 5 product locations, each displaying your ads for more exposure and visibility, increasing sales.', 23, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'Where can I learn more?', 'Go to our Demosite, and try with four example cities how RoundBuy platform works. You can choose London Trafalgar Square, Paris Place de la Concorde, New York Manhattan or Tokyo Shibuya Square, as your “centre-point” to test how you find goods to buy & sell, around you. Above the map click “Instructions” for more info.
Alternatively familiarize yourself with How It Works page: https://roundbuy.com/how-it-works', 24, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 25, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (2, 2, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com
LOGIN & SECURITY', 26, true);


-- Category: Login issues
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (3, 'Login issues', 'Login issues', 3, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (3, 3, 'General', 3, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'What if my email address has changed?', 'If you have changed your email address, you need to log into the RoundBuy app with your old email address, and then go to User Account and change your old email there, and add a new one.', 27, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'How to add, remove or update an email address via User account?', '1. Tap (or click in the website) your profile icon, to access your User account.
2. Tap Account information.
3. Tap See all next to “Emails”. Here you can add, edit or remove an email address.', 28, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, '1. Tap (click in the website) Forgot password?', '2. Enter the email address you use for PayPal and tap Next.
3. Choose how you want to complete our security check and tap Next.
4. Once you complete the security check, we’ll ask you to create a new password.', 29, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'What to do if your password doesn’t work?', 'If password doesn’t work and you have trouble logging in, you may just need to clear your cache and cookies from your Internet browser.
Note: Your RoundBuy password should be 8-20 characters long and include at least one number or symbol (like one of the following: !@#$%^).', 30, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'How to change your password?', 'Here''s how to change your password:
Go to your Settings.
Click the Security tab above your name.
Click Update next to "Password."
Confirm your current password, enter your new password twice, and click Change Password.
We recommend you change your password and security questions from time to time.', 31, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'How do I set a Security question?', 'Presently we do not use security questions.', 32, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'How to create unique strong password?', 'Having a secure, unique password for each of your online accounts is critically important. If a scammer gets just one password, they can begin to access your other accounts. That''s why it''s important to have a strong, unique password for your RoundBuy login.
A strong password should have the following characteristics:
More than 8 characters long.', 33, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'Use lower case, upper case, a number, and a special character (  like:  ~!@#$%^&*()_+=?><.,/ ).', 'Not a word or date associated with you (like a pet’s name, family names, or birth dates).
A combination of words with unusual capitalisation, numbers, and special characters interspersed. Misspelt words are stronger because they are not in the dictionary used by attackers.
Something you can remember.', 34, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'How often should I change my password?', 'We recommend you change your password and security questions from time to time. There are a few cases where it''s a good precaution, for example:
You notice something suspicious on your PayPal account.
You suspect that someone you don''t trust has your password.
You notice something suspicious in your email account or other online accounts.
You have recently removed malware from your system.
PayPal asks you to change your password.
If one of these occurs, change your Password, PIN, and security questions immediately. You can change these under personal settings.
If you receive an email asking you to change your password, it could be a case of phishing. Instead of clicking on a suspect link in an email, just log in to your PayPal account by manually typing the URL. Once logged in, click Settings, and then Personal Information. You''ll find the password, security questions, and PIN (if you''ve set one up) on this page.', 35, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'What to do if you changed mobile number?', 'We do not presently utilize 2-step verification for login, so you can easily just log in, and then go to your User account and change your phone number there.', 36, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (3, 3, 'Where to get more info? (email address: privacy/security@roundbuy.com)', 'For more information please read here: https://roundbuy.com/help/', 37, true);


-- Category: Fraudulent emails & scams
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (4, 'Fraudulent emails & scams', 'Fraudulent emails & scams', 4, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (4, 4, 'General', 4, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (4, 4, 'How to spot online shopping scam?', 'To spot an online shopping scam. Always research the seller and website independently, check for independent reviews, and verify website URLs before providing any personal information.', 38, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (4, 4, 'How to avoid online shopping scams?', 'To avoid online shopping scams, . It''s also crucial to research sellers, use strong, unique passwords, and regularly check your bank statements for suspicious activity. Also research the seller, be sceptical of deals, check the website, don’t click suspicious links etc.', 39, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (4, 4, 'What to do if you think you have been scammed or you have encountered a fraud?', 'It is really important to report any suspicious activity of fraud you have encoutenred. In the cases you think your account could be compromised, be urgent and change your password and contact us at RoundBuy. Here are some examples of fraudfunlent activity: unauthorised activity on your RoundBuy account, fake RoundBuy emails or spoof websites, or products not received or potential fraudulent seller.', 40, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (4, 4, 'Other payment scams, such as “Friends and Family”?', 'Purchase scams, where you are encouraged to Purchase scams are . Scammers create fake websites, clone legitimate ones, or post misleading ads on social media and online marketplaces to lure victims with attractive offers.
Imposter scams: An imposter scammer may call, text, email, or knock at your door to convince you they are someone in authority. They may even use caller ID to make it look like they are calling from an official government or business number.
Romance scams:Romance scams are a type of confidence trick where a criminal uses a fake online identity to build a romantic relationship with a victim to manipulate them into sending money or providing personal information. Scammers create convincing fake profiles
Extortion (blackmail) scams: Scammers pretend to be from an organisation and claim you need to pay money. They may threaten you with arrest, deportation, or even physical harm, if you don''t agree to pay them immediately. They can also blackmail you by threatening to share naked pictures or videos you have sent them unless you send them money.
Investment and cryptocurency scams:Investment scams promise high returns with little risk and often pressure victims into acting quickly, using tactics like "limited-time offers" or "exclusive" opportunities. This could involve cryptocurrencies.
Property scams: are frauds that deceive individuals, often by mispresenting propoerty deals, divertign payments, or selling nonexistent propoerties. ­', 41, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (4, 4, 'Where to get more info?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/', 42, true);


-- Category: Data & Security­
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (5, 'Data & Security­', 'Data & Security­', 5, true);

-- Category: My User Account Profile & settings
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (6, 'My User Account Profile & settings', 'My User Account Profile & settings', 6, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (5, 6, 'General', 5, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where do I find my User profile to access User account or User settings?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Under “User account” there are various menu headings for you to access.
User settings
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Under “User settings” there are various menu headings for you to access.', 43, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where do I find my User account?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen..
3. Under “User account” there are various menu headings for you to access.', 44, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where do I find my User settings?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Under “User settings” there are various menu headings for you to access.', 45, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to change and view User account information?', 'User account
1. Tap your Profile icon, to access your “User account”.
2. Tap “User account”.
3. Tap “Personal information” or any menu headings you wish to change.
Here you can add, edit or delete or request removal of any personal information.
User settings
1. Tap your Profile icon, to access your “User settings”.
2. Tap “User settings”.
3. Tap e.g. “Manage My Ads” or any menu heading to access it.
Here you can find your platform specific user user information.', 46, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where can I change wrong personal information or data?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen..
3. Under “User account” there are various menu headings for you to access.
Here you can add, edit or delete or request removal of any personal information.', 47, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to change my personal information such as street address (billing address)?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Personal information”.
4. Tap “Billing address”.
5. Type in the correct address, and click “Save changes”.
You can edit, change and update here: “Your name”, “Email address”, “Billing address” or “Phone umber”.', 48, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to change or remove phone number?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Personal information”.
4. Tap “Phone number”.
5. Type in the correct phone number, and click “Save changes”.
You can edit, change and update here: “Your name”, “Email address”, “Billing address” or “Phone umber”.', 49, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to change my first name or family name?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Personal information”.
4. Tap “Your name”.
5. Type in correct names, and click “Save changes”.
You can edit, change and update here: “Your name”, “Email address”, “Billing address” or “Phone umber”.', 50, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to update email address?', 'If you have changed your email address, you need to log into the RoundBuy app with your old email address, and then go to User Account and change your old email there, and add a new one.', 51, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to add, remove or update an email address via User account?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Personal information”.
4. Tap “Email address”.
5. Type in your correct email, and click “Save changes”.', 52, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to add, remove or update an email address via email link?', '1. Tap “Forgot password”, at the Login page.
2. Enter your “Email address” and tap “Submit”.
3. Check your email and click the link button “Reset password”.
4. Create a new strong Password, by typing it twice identically.
5. Tap “Reset password” button.
You have changed your password! You can now login to the platform.', 53, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to change my centre-point and product location(s)?', 'Please note! Default location (centre-point) and Product location 1 is one and the same spot! Other Product locations are set in different spots.
Centre-point & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.
Product location 2
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product location”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Product location 2. The other locations are changed similarly.
Product location 3
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product location”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 3”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 3”.
You have changed your Product location 3. The other locations are changed similarly.
Product location 4
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product location”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 4”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 4”.
You have changed your Product location 4. The other locations are changed similarly.
Product location 5
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product location”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Product location 2. The other locations are changed similarly.', 54, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where to find my payment method details?', '1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
From here you can view, remove or add your payment method.', 55, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where to add new payment method?', 'Add New card
1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
4. Provide your card information: card number, expiry date, and security number (CVC).
5. Tap “Add New card”.', 56, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where to remove my payment method details?', 'Remove card
1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
4. Tap “Remove card”.', 57, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where to remove, delete or ad a new payment method?', 'Remove or delete card
1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
4. Tap “Remove card”.
Add New card
1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
4. Provide your card information: card number, expiry date, and security number (CVC).
5. Tap “Add New card”.', 58, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How do we verify users?', 'Users are verified with email address and verification code sent there, which has to be typed to the mobile app verification page. In addition, we verify by bank card credential checks. Alternatively, user can be verified with Google or Apple account, and in some cases with social media account. Phone verification can could also be used.', 59, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to verify your email address?', '1. As you Create Account, type in your “Email address”, together with other personal details.
2. Tap “Sing up”, and you shall be taken to Email verification page.
3. Retrieve from your email account the four numbered verification code.
4. On Enter verification page, type the four numbered verification code to the field, and tap “Verify now”.
Your email address is now shown to be verified by RoundBuy platform.', 60, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'How to verify your phone number?', 'We do not presently utilize 2-step verification for login, so you can easily just log in, and then go to your User account and change your phone number there. When we do, please see:
1. As you Create Account, type in your “Phone number”, together with other personal details.
2. Tap “Sing up”, and you shall be taken to Phone verification page.
3. Retrieve from your phone’s SMS message, the four numbered verification code.
4. On Phone verification page, type the four numbered verification code to the field, and tap “Verify now”.
Your phone number is now shown to be verified by RoundBuy platform.', 61, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Can I change the locations or address to any country?', 'Yes your default location and product location(s) must be close to where you live. If you have residence, move around regularly in an area, or work in a specific area, even in several cities, you are free to choose any location as long as you can physically easily access your chosen locations. Please note your billing address can be in any country if officially so.', 62, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 63, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (6, 5, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 64, true);


-- Category: My User Account status
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (7, 'My User Account status', 'My User Account status', 7, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (6, 7, 'General', 6, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'What is User account status?', 'User account status indicates it’s current state, such as whether the account is active, inactive or suspended.', 65, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'Where to locate Cookies preferences from the Android app?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “Cookies preferences”.
4. You will be taken to “Confirm your access rights” page, provide your password and username credentials.
5. Make your choices of Cookies settings.
6. Tap “Save my choices”.', 66, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'Where to locate Cookies preferences from the iPhone app?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “Cookies preferences”.
4. You will be taken to “Confirm your access rights” page, provide your password and username credentials.
5. Make your choices of Cookies settings.
6. Tap “Save my choices”.', 67, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'Where to locate ATT preferences from the iPhone app?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “ATT tracking preferences”.
4. You will be taken to “Confirm your access rights” page, provide your password and username credentials.
5. Tap either “Allow tracking” or “Don’t allow tracking”.', 68, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'How to close and delete an account?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “Delete account”.
4. You will be taken to “Confirm your access rights” page, provide your password and username credentials.
5. Tap“Delete account”, and the account will be deleted permanently. This cannot be cancelled if you wish to have a new user account you have to register again.', 69, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'How to download your personal data?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “Download your Personal Data as PDF”.
4. You will be taken to “Confirm your access rights” page, provide your password and username credentials.
5. Your data, “Download your Personal Data as PDF”, will be dowloaded to your device.', 70, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'How to Request Deletion of your personal data?', '1. Tap “User account” from the bottom of screen user icons ((human head”).
2. Tap “Privacy & Account” from the menu headings.
3. From “Privacy & Account” page, tap “Request Deletion of User Data”.
4. You will be taken to “Confirm your accesss rights” page, provide your password and username credentials.
5. You will be taken to “Data Deletion” page fill in all the information required, and tap “Send Request”.', 71, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (7, 6, 'Where to get more information?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/
MARKETPLACE & SERVICE INFO', 72, true);


-- Category: Memberships
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (8, 'Memberships', 'Memberships', 8, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (7, 8, 'General', 7, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What memberships does RoundBuy offer?', 'For private users we offer: Green, Orange and Gold. Green is the basic tier with essential features. Orange is the upgraded plan with extra features, while Gold is enhanced plan with all the best features.
For business users we offer: Violet, Purple and Blue. Violet is the basic tier with essential features. Purple is the upgraded plan with extra features, while Blue is enhanced plan with all the best features.', 73, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'Do you have different memberships for private users and for companies?', 'For private users we offer: Green, Orange and Gold. Green is the basic tier with essential features. Orange is the upgraded plan with extra features, while Gold is enhanced plan with all the best features.
For business users we offer: Violet, Purple and Blue. Violet is the basic tier with essential features. Purple is the upgraded plan with extra features, while Blue is enhanced plan with all the best features.', 74, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Green membership?', 'Green membership, is the basic tier (for private users) with essential features, offered free for limited time (original price £2.00 for a year). Features include: 1 x centre-point (default location), 1 x product location, bot situated at the same spot. You can perform searches and offer products at this spot, in others words sell and buy.', 75, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Orange membership?', 'Orange membership, is the upgraded plan (for private users) with extra features, offered for £2.00 limited time (original price £4.00 for a year). Features include: 1 x centre-point (default location), 3 x product locations, of which two settable in different spot than default location. You can perform searches at default location, to see availability around you, while at product locations you offer and advertise products for others.', 76, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Gold membership?', 'Gold membership, is the enhanced plan (for private users) with all the best features, offered for £4.00 limited time (original price £8.00 for a year). Features include: 1 x centre-point (default location), 5 x product locations, of which four settable in different spot than default location. You can perform searches at default location, to see availability around you, while at product locations you offer and advertise products for others.', 77, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Violet membership?', 'Violet membership, is the basic tier (for businesses) with essential features, offered free for limited time (original price £5.00 for a year). Features include: 1 x centre-point (default location), 1 x product location, bot situated at the same spot. You can perform searches and offer products at this spot, in others words sell and buy.', 78, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Purple membership?', 'Purple membership, is the upgraded plan (for businesses) with extra features, offered for £5.00 limited time (original price £10.00 for a year). Features include: 1 x centre-point (default location), 3 x product locations, of which two settable in different spot than default location. You can perform searches at default location, to see availability around you, while at product locations you offer and advertise products for others.', 79, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'What is a Blue membership?', 'Blue membership, is the enhanced plan (for businesses) with all the best features, offered for £10.00 limited time (original price £20.00 for a year). Features include: 1 x centre-point (default location), 5 x product locations, of which four settable in different spot than default location. You can perform searches at default location, to see availability around you, while at product locations you offer and advertise products for others.', 80, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'Which membership do I need to purchase Banner Ads?', 'Any of the three business membership plans, can be used to purchase Banner ads fro businesses. Violet is the basic tier with essential features. Purple is the upgraded plan with extra features, while Blue is the enhanced plan with all the best features. All plans can be used to purchase visibility ads.', 81, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 82, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (8, 7, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/memberships/
We are always happy to help you! Email us: info@roundbuy.com
FINDING & OFFERING', 83, true);


-- Category: Search-page guide
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (9, 'Search-page guide', 'Search-page guide', 9, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (8, 9, 'General', 8, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What is the main concept of RoundBuy service?', 'All happens around you, and your imprecise location. You Sell & Buy from this spot, and in addition you have up to 5 more spots to Sell. Around you are other users with same possibilities.
You choose yourself a default location, which is your imprecise home address (e.g. 200 m away, a Square) in a safe spot. It is also called centre-point, you search around this spot, to Buy products & services located around you, and preferably nearby.
You choose yourself up to 5 product locations, in which you Sell or advertise your own products & services to others around those spots. In these product locations you arrange Pick Up & Exchange of the items you have sold to buyers.', 84, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What does it mean to search products & services around you?', 'It means you define a centre-point or default location for yourself, which is your imprecise home address.
For safety, it might be a Street’s end c. 0.5 km away. From this spot you conduct searches around you, to find what you want to Buy. Other users around you, are selling products & services, which you can Buy.', 85, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How do you advertise with Ads on the service?', 'Both private and business users can make Standard ads for free, which are for the advertising of your products & services you want to Buy & Sell etc. If you wish to get more visibility, you can purchase Visibility Ads, which duration and boosts, such as it’s reach (distance) and you can choose. With visibility ads you can get more buyers, views and clicks, and a better deal.', 86, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to adjust default location and product location(s)?', 'Default location (Centre-point) & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.
Product locations 2-5
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”, “Set Product location 3” etc.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Default location & Product location 1. The other locations are changed similarly.', 87, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What is a safe place for a default location (centre-point)?', 'A place you feel safe. It can be a street spot, a square, end of the road or market square or anything you feel good about. With good visibility, so you see other people and they can see you. It is not recommendable to meet in secretive, hidden or dark places, but rather on open, safe area with good visibility around, and lights on. If in city or countryside, make sure the locations are easy to get, without need to compromise your safety.', 88, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Where to change default location (centre-point)?', 'Default location (Centre-point) & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.', 89, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Where to change product location(s)?', 'Product locations 2-5
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”, “Set Product location 3” etc.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Default location & Product location 1. The other locations are changed similarly.', 90, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What are product locations on the map?', 'The product location is the spot in which you advertise your products & services, you want to sell, and where you are ready to meet for an exchange. The product location could be close to your home, secondary residence, workplace, traffic junction or commercial centre for easy access (never precise home address). From the map’s upper left corner, you can find numbers “1”, “2”, “3”, “4” and “5”, depending on your plan, which designate different product locations, you have chosen.', 91, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What are safe places for product locations?', 'A place you feel safe. It can be a street spot, a square, end of the road or market square or anything you feel good about. With good visibility, so you see other people and they can see you. It is not recommendable to meet in secretive, hidden or dark places, but rather on open, safe area with good visibility around, and lights on. If in city or countryside, make sure the locations are easy to get, without need to compromise your safety.', 92, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to adjust default location and product location(s)?', 'Default location (Centre-point) & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.
Product locations 2-5
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”, “Set Product location 3” etc.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Default location & Product location 1. The other locations are changed similarly.', 93, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Can I change my default location and product locations?', 'Yes, both default location (centre-point) and product location(s) can be changed. However, as a rule the default location ought to be your imprecise home address, while product locations can be picked more freely, as long as you have the capability to Exchange the products & services physically at that location.', 94, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What benefits Orange or Gold plan has over Green plan?', 'Green is the basic tier with essential features, offered for limited time free of charge. For example you have 1x default location & product location to Sell. Orange the upgraded (£2.00) and Gold the enhanced plan (£4.00), offer more! With the Orange you have 1 x default locations, and 3 x product locations, while the Gold has 1 x default location and 5 x product locations. With the paid plans, you get bigger reach, Buyer’s, and more clicks and sales.', 95, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to upgrade from Green to Gold memberships?', '1. Tap “User account” icon.
2. Tap “User settings” from the toggle menu.
3. Tap “My memberships”, which indicates the “Current plan”
4. Tap “Select plan” to upgrade your plan. ASK DEV: Should we have ig he has Green plan, it says “Upgrade to Orange”, and if Orange then it says “Upgrade to Gold”', 96, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Where to find walking distance & time to product location from your centre-point?', 'On the Map
1. Tap any “Activity circle” (product) visible on the map, which are colour and letter coded.
2. A small product window opens up, on the map.
2. Tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.
On the Product Gallery
1. Tap the text “Products”, under the map, if the map is displayed,
2. On the “Product Gallery” page you can see any product displayed with a small image. Under the image, you can see walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
3. Alternatively, you can also tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.
When you launch the mobile app or website, you come straight to the Search-page, if you have created already a “User account” (registration & Sign Up). Alternatively, you can also get there by tapping the “Home” or “Search-page” icon, at the bottom of the screen (mobile app), or on top (website). Check that the website button place is correct here!!!
The instructions for the Searchpage can be clicked open from the”Searchpage” from the upper right corner of the map and exclamation mark which has letter “I” inside of it. Consider this well!!
From Registration page as you have to choose between “Sign up” or Register” above it there is an option button “Test RoundBuy Demo”. Second place, after your account has been verified, as you are encouraged to choose membership “Choose Your Plan”, above it is the buttons “Try the demo”. Third palce is through the right upper hand corner hamburger menu, “Try the Demo”.', 97, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What are the number 1, 2, 3, 4, 5 on the map?', '1. Signifies your default location (centre-point) & 1 product location.
2. Signifies your product location 2.
3. Signifies your product location 3.
4. Signifies your product location 4.
5. Signifies your product location 5.
Please note! In Green plan there are only 1x default location & 1x product location 1; while for Orange 1x default location & 3x product locations, and for Gold 1x default location & 5 x product locations.', 98, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to change the Radius ring and distance?', 'Search-page:
1. On Search-page, under the map, you can see “Distance”.
2. Tap the “Distance”, a radius slider opens up.
3. Move the white circle in the slider, to change the distance and the indicator, showing the radius e.g. 2.5 km.
4. The map view and zoom in or out level changes automatically.
Alternatively:
1. Tap “Filters” below the searchbar.
2. Tap “Distance”.
3. From there you can choose the distance in increments e.g. “2.5 km)
4. Tap “Show results”, and you can view them on them.', 99, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to change the Filters?', '1. Tap the “Filters”.
2. Tap the filter heading e.g. “Activity”, “Category-subcategory”, “Condition”, “Price” etc, or any other filter of your choice to narrow done the search results, and choose from the options provided.
3. Tap “Show results” to get to see the search results.', 100, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to view walking distance and time from your “home address” to the product?', 'On the Map
1. Tap any “Activity circle” (product) visible on the map, which are colour and letter coded.
2. A small product window opens up, on the map.
2. Tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.
On the Product Gallery
1. Tap the text “Products”, under the map, if the map is displayed,
2. On the “Product Gallery” page you can see any product displayed with a small image. Under the image, you can see walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
3. Alternatively, you can also tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.', 101, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'What happens if I click the plus (+) and minus (-) on the map?', 'By tapping the plus (+) sign you can zoom in closer on the map, or by tapping the minus (-) sign you can zoom out further on the map repsectively.
You can also use slider below the map, to adjust the radius and map distance in kilometres, meters or miles.', 102, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How do I get to see only products or services on Sale?', 'On the Search-page
1. Tap “Filters” below the Searchbar.
2. Tap “Activity” from the choices.', 103, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, '3. Tap “Products” or “Services” from the choices, depending on your needs. Do we want option Products or Services?', '3. Tap “Buy” and click it.
4. Then click “Show results” and you shall see the map only with products or services to “Buy”.', 104, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to change Activity (sell, buy, rent, give and Form groups)?', 'On the Search-page:
1. Tap “Filters” below the Searchbar.
2. Tap “Activity” from the choices.
3. Tap your choice of preferred activity e.g. “Sell”, “Give” or “Buy” etc.
4. Then click “Show results” and you shall see the map only with products or services to “Buy”.', 105, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to click open a product window and view a product?', 'On the Search-page
1. Tap any “Activity circle” (product) visible on the map, which are colour and letter coded.
2. A small product window opens up, on the map.
2. Tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
Note! If you scroll down on the Product page, you find more info and options such as “Chat” and “Make an Offer”.', 106, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to use the search-field and make adjustments?', '1. Tap on the searchbar to use the keyword search.
2. Type in a keyword e.g. “basketball”. As you write it, auto-suggestions and predictive texts, provide suggestions, which you can choose if you wish.', 107, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How can I adjust the search results with the filters?', '1. Tap the “Filters”.
2. Tap the filter heading e.g. “Activity”, “Category-subcategory”, “Condition”, “Price” etc, or any other filter of your choice to narrow done the search results, and choose from the options provided.
3. Tap “Show results” to get to see the search results.', 108, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to change the view from only Products to only Map?', 'When map is displayed at Searchpage:
1. Find under the Search-page map, a text “Products”; for both mobile app and website.
2. Tap the text “Products” under Search-page map.
3. The “Products” are now displayed without map.
Note! You can find from the bottom of the Search-page map the alternatives “Products” or “Map”!', 109, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How to change the view from only Map to only Products?', '1. Find under the Search-page map, a text “Map”; for both mobile app and website.
2. Tap the text “Map” under Search-page map.
3. The “Map” are now displayed without products´windows.
Note! You can find from the bottom of the Search-page map the alternatives “Products” or “Map”!', 110, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'How do I quit the App?', 'From User account
1. Tap your Profile icon, at the Search-page; mobile app (bottom), website (top).
2. Tap “User account” from the top of the screen.
3. Tap “Quit app”, found from the bottom of the page.
From hamburger menu
1. Tap Hamburger menu icon, from the top of the Search-page.
2. Tap “Quit app”, found from the bottom of the page.', 111, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 112, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (9, 8, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/search-page/
We are always happy to help you! Email us: info@roundbuy.com', 113, true);


-- Category: My locations
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (10, 'My locations', 'My locations', 10, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (9, 10, 'General', 9, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What is centre-point, HomeMarket and default location?', 'The centre-point (icon) on the map is your default location, the search-point, which around you search buy products & services, which other users nearby are selling or renting, from their locations. Ideally, its close to your home, work or a place you spent time. Another name for your centre-point is HomeMarket.', 114, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What is product location?', 'The product location is the spot in which you advertise your products & services, you want to sell, and where you are ready to meet for an exchange. The product location could be close to your home, secondary residence, workplace, traffic junction or commercial centre for easy access (never precise home address).', 115, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'How many product locations can I have as private or business user?', 'As a private user, you can have from 1-5 product locations, depending on your plan. With Green membership you have one product location (your centre-point is also there). With Orange plan you have three product locations. While with Gold, you have five product locations.
As a business user, you can have from 1-5 product locations, depending on your plan. With Violet membership you have one product location (your centre-point is also there). With Purple plan you have three product locations. While with Blue, you have five product locations.', 116, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What is a good product location?', 'Ideally, you want to choose a place nearby your home, cottage or workplace etc. Preferably set the spot into suitable place easy to access, such as a square or marketplace, or the end of the street. The spot should be visited by other people, be open with good views around, and safe in all possible ways. It is an option to choose spots near to transport crossings or shopping centres, to attract more potential Buyer’s.', 117, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What are examples on setting product locations?', 'Product location 1 = imprecise home address of your choice . This is also your centre-point, or default location on the map.
Product location 2 = close to your cottage address or other location you visit often.
Product location 3 = close to your work address or other location you visit often e.g. near to train station.
Product location 4 = close to any spot or other location you visit often go e.g. on your way to work.
Product location 5 = close to your nearby commercial centre to attract more views.
Please note! None of the product locations nor centre-point should never be “precise location” for your safety.', 118, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What is a safe place for a default or product location?', 'A place you feel safe. It can be a street spot, a square, end of the road or market square or anything you feel good about. With good visibility, so you see other people and they can see you. It is not recommendable to meet in secretive, hidden or dark places, but rather on open, safe area with good visibility around, and lights on. If in city or countryside, make sure the locations are easy to get, without need to compromise your safety.', 119, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Where to change default location (centre-point)?', 'Centre-point & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.', 120, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What are product locations on the map?', 'The product location is the spot in which you advertise your products & services, you want to sell, and where you are ready to meet for an exchange. The product location could be close to your home, secondary residence, workplace, traffic junction or commercial centre for easy access (never precise home address).', 121, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Where to change product location(s)?', 'Centre-point & Product location 1
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product locations”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Centre-point & Product location 1”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Centre-point & Product location 1”.
You have changed your Default location & Product location 1. The other locations are changed similarly.
Product location 2
1. Tap your Profile icon, at the Search-page.
2. Tap “User settings” from the top of the screen.
3. Tap “Default location & Product location”, or “My locations”. CHOOSE EITHER YOU WANT TO USE!!!!
4. Tap “Set Product location 2”.
5. Type in the search-filed your imprecise address or choose it from the map.
6. Check under the map, the frame has the imprecise address you chose.
4. Tap ”Save Product location 2”.
You have changed your Product location 2. The other locations are changed similarly.', 122, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What are safe places for product locations?', 'A place you feel safe. It can be a street spot, a square, end of the road or market square or anything you feel good about. With good visibility, so you see other people and they can see you. It is not recommendable to meet in secretive, hidden or dark places, but rather on open, safe area with good visibility around, and lights on. If in city or countryside, make sure the locations are easy to get, without need to compromise your safety.', 123, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Can I change my default location and product locations?', 'Yes, both default location (centre-point) and product location(s) can be changed. However, as a rule the default location ought to be your imprecise home address, while product locations can be picked more freely, as long as you have the capability to Exchange the products & services physically at that location.', 124, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'What if I am visitng a place, how to search products & services aroudn you then?', 'For this purpose RoundBuy offers Visitor’s location, which is changeable centre-point, useful when visiting locations your reside only temporarily such as hotel in a different city or country. Please note that in “Visitor’s location” the other products and services you have listed at your default location and product locations are not available, as a preset.', 125, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'How will my products be displayed on the map and product gallery?', 'Your products & services will be displayed on Search-page: Product Gallery and on a Map. In the Product gallery your ads with images and descriptions are displayed with other user’s ads. On the Map, as clickable colour and letter coded activity circles. Same product can be displayed from 1 to up to 5 product locations at the same time for better commerce.', 126, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Can I have different products on different product locations?', 'Yes, with Gold and Orange plans for private users, you can choose, which products & services are displayed on which product locations. As a default, all items are displayed in all product locations, but this is changeable. With Green membership this is not possible, as it has only one product location. The same is possible with business plans Purple and Blue, but not with Violet. CHECK THIS FROM DEV.', 127, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 128, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (10, 9, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/locations/
We are always happy to help you! Email us: info@roundbuy.com', 129, true);


-- Category: Marketplace Ads & Manage Ads
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (11, 'Marketplace Ads & Manage Ads', 'Marketplace Ads & Manage Ads', 11, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (10, 11, 'General', 10, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What are marketplace ads?', 'Standard ads are available for all private and business users for free. Visibility ads & Boosts are paid ads and boosts, which a user can purchase to enhance the visibility of a standard ad, to gain wider reach and more buyers. For business users there are Banner ads, to promote brand awareness and presence.', 130, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to make a product or service ad (standard ad)?', 'Standard ad
1. Tap “Make an Ad” icon, from the bottom of the screen (mobile apps), or click “User Account” from the upper field (website).
2. Choose 1-3 images and the duration of display.
3. Add a title, description & display time, and tap “Continue”.
4. Set Filters, tap “Continue”.
5. Preview the ad, and “Publish”.
Now your Standard ad has been created.
For Visibility ads find more information from here.', 131, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a visibility ad to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose display time & radius (distance).
3. You can also purchase a Distance boost of your choice, and tap “Continue”.
3. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
4. Choose payment method, and tap “Continue” .
5. Tap “Done” on Transaction verification page.', 132, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to view your visibility ad?', 'To view your Visibility ad
1. Tap “User account”.
2. Tap “User settings”.
3. Tap “Visibility Ads & Purchase”.
4. Tap “View Visibility ads”.
5. Choose the specific product, which Visibility ad you wish to view.
For Standard ads find more information from here.', 133, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a visibility ad or boost to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type e.g “Rise to Top” boost. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 134, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Rise to Top boost” to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type “Rise to Top” boost. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 135, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Top Spot boost” to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type “Top Spot” boost. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 136, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Show Casing ad” to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type “Show Casing ad”. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 137, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Targeted ad” to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type “Targeted ad”. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 138, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Fast ad” to improve standard ad’s reach?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type “Fast ad”. You can also purchase a Distance boost of your choice.
3. Choose display time & radius (distance) and tap “Continue”.
4. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
5. Choose payment method, and tap “Continue” .
6. Tap “Done” on Transaction verification page.', 139, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase a “Distance boost” or a Visibility boost?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose the ad type e.g. “Fast ad”.
3. Choose display time & radius (distance).
4. You can also purchase a Distance boost of your choice: “Distance boost 5 km”, “Distance boost 7 km”, “Distance boost 10 km” and tap “Continue”.
5. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
6. Choose payment method, and tap “Continue” .
7. Tap “Done” on Transaction verification page.', 140, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to make a standard ad for a product?', 'Standard ad
1. Tap “Make an Ad” icon, from the bottom of the screen (mobile apps), or click “User Account” from the upper field (website).
2. Choose 1-3 images and the duration of display.
3. Add a title, description & display time, and tap “Continue”.
4. Set Filters, tap “Continue”.
5. Preview the ad, and “Publish”.
Now your Standard ad has been created.
For Visibility ads find more information from here.', 141, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to make a Visibility ad for a product?', 'Visibility ad
1. Tap “Purchase Visibility” from any product (Product page), you wish to purchase visibility.
2. Choose display time & radius (distance).
3. You can also purchase a Distance boost of your choice, and tap “Continue”.
3. View your cart, check the cart, and tap “Pay now”, after you are sure, you want to proceed.
4. Choose payment method, and tap “Continue” .
5. Tap “Done” on Transaction verification page.', 142, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What to do if we have moderated and removed your ad due to forbidden content? (Read forbidden content guide; do new Ad and follow guidelines)', 'As we remove or delete ads with forbidden content, you receive a notification of this. In some cases you might have a day or few to adjust, modify your ad. However, in some more severe cases we just immediate removal, remove content from the service to maintain safety and to remove forbidden content. For more information on Forbidden content click here.
For more information please read out policies:', 143, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What kind of Ads does RoundBuy have for its private users?', 'Standard ads the basic free ads. Visibility ads to get more visibility for standard ads. Targeted ads, in which a specific product or service is searched in an trageted area with targeted product or service. Fast ads, which are send fast around the user to find a psecific product quickly, as the notification reaches all users aroudn who have the setting on for notifications. This is similat to Search notification, but differes in many ways as it’s paid optioon.', 144, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What are Standard Ads?', 'Standard ads are available for all private and business users for free. These are created from “Make an Ad” page. Standard ads can be upgraded into visibility ads. Visibility ads are paid ads, which a user can purchase to enhance the visibility of a standard ad, to gain wider reach and more buyers. For business users there are Banner ads, to promote brand awareness and presence.', 145, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What are visibility Ads?', 'Visibility ads are paid ads, which a user can purchase to enhance the visibility of a standard ad, to gain wider reach and more buyers. For business users there are Banner ads, to promote brand awareness and presence.
Standard ads are available for all private and business users for free. These are created from “Make an Ad” page. Standard ads can be upgraded into visibility ads.', 146, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What kind of Ads does RoundBuy have for its company users?', 'Standard ads are available for all business and private users for free. These are created from “Make an Ad” page. Standard ads can be upgraded into visibility ads. We also offer visibility ads (paid ads), which a user can purchase to gain wider reach and more buyers. In addition, there are Banner ads for the promotion of brand awareness and presence, through product gallery and map.', 147, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'What are banner ads?', 'Banner ads are paid ads for business users, for the promotion of brand awareness and presence, through product gallery and map. A logo, slogan and possibly URL web address, can be promoted through the platform. These provide visibility in chosen locations for businesses.', 148, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'How to purchase them?', 'For companies:
1. Tap user icon for “User account”
2. Tap “User settings”
3. Tap “Purchase visibility”
4. Choose your desired options and pay.
Then to view your nw ads by clicking either Banner ad or Store View for a Map by .', 149, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 150, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (11, 10, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 151, true);


-- Category: Manage My Ads
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (12, 'Manage My Ads', 'Manage My Ads', 12, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (11, 12, 'General', 11, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find Manage My Ads?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu to choose: “All”, “Active” or “Inactive”, and to view your choice.', 152, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'What are active and inactive Ads and where can I find them?', 'The active ads are presently viewable by other users at the marketplace, while inactive ads have been removed from the marketplace by the user, or the ad has expired after 60 days.', 153, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find active and inactive ads ?', 'Active ads
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “Active” to view your choice.
Inactive ads
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “Inactive” to view your choice.', 154, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find active ads ?', 'Active ads
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “Active” to view your choice.', 155, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find inactive ads ?', 'Active ads
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “Inactive” to view your choice.', 156, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I read the status of my ads if they are active or inactive?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “All” to view your choice.', 157, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find the status or duration of my Ad?', 'The status can be found from “Manage My Ads”:
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “All” to view your choice.
The expiration can be found from “Manage My Ads”:
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap toggle menu choice: “All”, “Active”, “Inactive”, to view your ads expiration in days e.g. 55 days, for both inactive or active ads.', 158, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where to activate my Ads if I want to re-activate inactive ad?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap one of your Product ads.
5. On Product page, see title heading “Modify Inactive Ad”.
6. Tap either “Activate” ad, to view your your ads expiration in days e.g. 55 days, for both inactive or active ads.
Your ad has been activated.', 159, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where to modify my Ads if I want to de-activate my active ad?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap one of your Product ads.
5. On Product page, see title heading “Modify Inactive Ad”.
6. Tap either “Modify” ad, to view your your ads expiration in days e.g. 55 days, for both inactive or active ads.
Your ad has been modified.', 160, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find my Manage Ads settings?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap here the desired choice “All”, “Active” or “Inactive” and proceed to “Modify or “Activate”.', 161, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I locate Modify my ad?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap one of your Product ads.
5. On Product page, see title heading “Modify Inactive Ad”.
6. Tap either “Modify” ad, to view your your ads expiration in days e.g. 55 days, for both inactive or active ads.
Your ad has been modified.', 162, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find Remove my ad?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User settings”.
3. Tap “Manage My Ads”.
4. Tap one of your Product ads.
5. On Product page, see title heading “Modify Inactive Ad”.
6. Tap any of the ads you want to “Remove”, or delete from the archive.', 163, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 164, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (12, 11, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 165, true);


-- Category: Make an Offer & Binding offer
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (13, 'Make an Offer & Binding offer', 'Make an Offer & Binding offer', 13, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (12, 13, 'General', 12, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'Where can I access “Make an Offer” button?', 'User settings:
1. Tap user icon to access “User settings”
2. Tap “Manage Product Offers”
3. Tap “View Offer history” of any product.
4. Tap from the bottom of the page “Make an Offer”
From a product page:
1. Tap any product to open it
2. Scroll down until you find “Make an Offer” and tap it.
3. It leads you to “Product Chat”, and in there type the amount you want to offer.
4. Tap “Make an offer”
From product chat:
1. Tap any product to open it
2. Tap “Chat” to open it.
3. Type in the amount you want to offer
4. Tap “Make an offer”', 166, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What happens if I push the “Make an Offer” button?', 'By pushing the “Make an Offer” you are making a binding offer to the second party. If the second party accepts you have a Binding offer, which is a contract, upon fulfilment of the inspection. Note! All offers are conditionla, until the inspection has been done to verify the product or service is what promised. Before pushing the offer button, make carful considerations if you want to make an offer, as it is valid for 7 days if not an offer ecpiry deadline had been set e.g. “this offer is valid 24 hours!” or “This offer expires in 1 day”.', 167, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'When does an offer expire?', 'In UK law, an offer''s validity depends on whether it has a specified expiration date. If a deadline is set, the offer lapses when that time runs out. If no deadline is given, the offer is valid for a "reasonable time," but it can also be terminated by the offeror before it is accepted by communicating the revocationOffer expires at the deadline. If a specific date or time period is stated, the offer is nolonger valid once that time has passed. Any attempt to accept after this point will not form a binding contract.', 168, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'Why offers are conditional until inspection has been done?', 'Note! All offers are conditional, until the inspection has been done to verify the product or service is what promised.', 169, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'How long an offer can be withdrawn (revocation)?', 'An offer can be withdrawn at any time before it is accepted, provided the withdrawal is communicated to the person who received the offer. This is called revocation.', 170, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What is reasonable time in offers?', 'If no deadline is set, an offer must be accepted within a "reasonable time," which depends on the circumstances of the case. What is considered reasonable can vary greatly depending on the type of offer. At RoundBuy as a basic rule this reasonable time is 7 days or 3 days.', 171, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What happens to an offer upon rejection?', 'The offer is terminated if the offeree rejects it, and it thus binds not the maker. A counter-offer is a form of rejection, and it terminates the original offer.', 172, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What is a counter-offer?', 'A counter-offer is a form of rejection of the original offer, which it terminates.', 173, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'Validity or expiration of offers?', 'An offer can be withdrawn at any time before it is accepted, provided the withdrawl is communicated to the person who received the offer.', 174, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'How is it displayed on the chat an Accepted offer?', 'An accepted offer, is displayed on the “Chat” with a frame, which has a notice “Accepted for £245.00. Now Schedule a Pick Up & Exchange”.
From User account:
1. Tap user icon to access “User account”.
2. Tap “User settings”
3. Tap “Manage Product Offers” and choose any product.
4. Tap “View offer history”
5. Choose “Accepted” from the menu to view them.', 175, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What happens if I decline an offer?', 'An declined offer, is displayed on the “Chat” with a frame, which has a notice “Declined”.
From User account:
1. Tap user icon to access “User account”.
2. Tap “User settings”
3. Tap “Manage Product Offers” and choose any product.
4. Tap “View offer history”
5. Choose “Declined” from the menu to view them.', 176, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What happens if I accept an Offer?', 'You are bound to the “Binding offer”, and you must comply with the second party and proceed to fullfill the contract. The offer is still conditional until inspection you have verified the product corresponds to the description and images provided by the secodn party. If by any means you are unable to proceed, please negoatite with the second party to cancel the offer.', 177, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What is a Binding offer?', 'In UK law, a binding offer is a clear and specific proposal that, when accepted, creates a legally enforceable contract. To be binding, the offer must be complete, show a clear intention to be bound, and have the necessary elements of a contract: a valid offer and acceptance, consideration (something of value exchanged), and intention to create legal relations.
Key elements of a binding offer:
Clear and specific proposal: The offer must state the essential terms of the agreement clearly and be intended to be bound upon acceptance. It is a promise to enter a contract on certain terms.
Intention to be legally bound: Parties must intend for the agreement to be legally enforceable. For commercial agreements, this is usually presumed unless stated otherwise, while for social agreements, this is not presumed.
Distinction from an "invitation to treat": An offer is different from an "invitation to treat," which is merely an invitation for others to make an offer. A good example is goods displayed in a shop, which is an invitation to treat; the customer makes the offer when they take the goods to the till.
Acceptance: Acceptance must be a mirror image of the offer. If new terms are introduced, it becomes a counter-offer, and the original offer is no longer valid. Acceptance must be communicated to the offeror.
Consideration: Something of value must be exchanged between the parties, such as money, goods, services, or a promise to do or not do something.
Capacity: All parties must have the legal capacity to enter the contract, meaning they must be of sound mind and of the age of majority (over 18).', 178, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What responsibilities Seller has?', 'In the UK, a seller has a responsibility to pass all offers to the buyer, even after accepting one, until contracts are exchanged. Offers are not legally binding until contracts are exchanged, meaning either party can withdraw at any time. A seller must also provide accurate information about a property and deliver goods within a reasonable timeframe as agreed upon with the buyer.
Offers and contacts:
No legal obligation to respond: Sellers are not legally required to respond to an offer, but it is standard practice to do so.
Offers are not binding: An accepted offer is not a legally binding contract in England and Wales until contracts are exchanged. This means either the buyer or seller can pull out without penalty before this point.
Duty to pass on offers: Estate agents are legally obliged to pass on any further offers to the seller up until the point of exchange.
Seller’s responsibilities:
Honesty and disclosure: Sellers must provide accurate information about the property to avoid misleading buyers.
Right to sell: Sellers must have the right to sell the goods. They cannot sell goods in a way that infringes on a trademark.
Estate agent compliance: Sellers using an estate agent are responsible for the agent''s conduct. The agent must pass on all offers and not use misleading practices.
Contractual obligations: Once a contract is in place, sellers must adhere to its terms or risk being taken to court.', 179, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'What responsibilities Buyer has?', 'In the UK, a buyer''s offer is not legally binding until contracts are exchanged, meaning a buyer can withdraw at any time beforehand without penalty. However, once the offer is accepted, the buyer has a responsibility to take steps like instructing a conveyancer and formally applying for a mortgage. The contract becomes legally binding upon exchange, and at that point, the buyer pays a deposit and becomes legally obligated to complete the purchase.
Before exchange of contracts (offer accepted)
No legal obligation: The buyer is not legally bound and can withdraw from the purchase without penalty.
Seller''s risk: The seller can accept a higher offer from another buyer ("gazumping").
Buyer''s responsibilities: The buyer has a responsibility to act in a timely manner to move the process forward.
Instructive actions: A buyer should:
Instruct a conveyancer or solicitor to handle the legal aspects.
Formally apply for a mortgage, providing all necessary documentation.
Arrange for a property survey and valuation.
In some cases, a buyer may be asked to pay a deposit to secure the property.
After exchange of contracts
Legally binding: The deal is legally binding for both parties.
Buyer''s commitment: The buyer is legally obligated to complete the purchase.
Deposit paid: The buyer pays a deposit (typically 5-10%) which they forfeit if they pull out.
Completion: The sale is completed on a pre-agreed date.', 180, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'I changed my mind can I withdraw from a contract that is biding before inspection?', 'In UK law, an offer is generally only binding after acceptance creates a contract; before that point, an offer can be withdrawn. Once a binding contract is formed through acceptance, withdrawal can be a breach of contract, potentially leading to legal consequences. For job offers, unconditional offers are binding upon acceptance, but conditional offers can be withdrawn if the conditions are not met.
Before acceptance: An offer can be withdrawn at any time before it is accepted.
After acceptance: Once an offer is accepted, it creates a binding contract, and the parties are legally committed.
This is because the act of acceptance gives rise to the contractual agreement.
For property sales, a contract is not legally binding until contracts are exchanged, so either party can withdraw before this point without penalty.
For job offers, an unconditional offer becomes a legally binding contract upon acceptance.', 181, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'When is an offer binding?', 'An offer in UK law becomes binding when it is unequivocally accepted by the offeree and is supported by consideration, and both parties intend to create legal relations. In England and Wales, for certain transactions like property, the offer is not binding until "exchange of contracts," at which point either party can face penalties for withdrawing. For employment, the offer is binding upon acceptance unless it is conditional, in which case it becomes binding only after the conditions are met. Key elements that make an offer binding
Key elements that make an offer binding:
Offer and Acceptance: A clear offer must be made and then accepted unconditionally by the other party.
Consideration: Each party must provide something of value, such as money, goods, services, or a promise to do something.
Intention to Create Legal Relations: Both parties must have intended for the agreement to be legally binding. This is generally presumed in business contexts but not necessarily in social or domestic ones.
Capacity: All parties must be legally capable of entering a contract, such as being over the age of 18 and of sound mind.
Certainty: The terms of the contract must be clear and not vague or impossible to perform.', 182, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 183, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (13, 12, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 184, true);


-- Category: Conflict Resolution between Consumer-to-Consumer (C2C)
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (14, 'Conflict Resolution between Consumer-to-Consumer (C2C)', 'Conflict Resolution between Consumer-to-Consumer (C2C)', 14, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (13, 14, 'General', 13, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (14, 13, 'What steps to take if product & services are not what you had agreed?', 'Here are steps to take:
1.Contact the trader: Speak to the seller and explain the problem. Give them a chance to put things right.
2.Be clear about your rights: Refer to the Consumer Rights Act 2015 and clearly state what you want (e.g., a refund, repair, or replacement).
3.Gather evidence: Keep any receipts, emails, and photos of the faulty product or poor service.
4.Escalate the complaint: If you cannot resolve the issue directly, consider using an Alternative Dispute Resolution (ADR) scheme or complain to an ombudsman.
5.Consider legal action: If all other options fail, you may be able to take the seller to court, but you will usually be expected to have tried ADR first.
More information on Consumer Rights Act 2015 (UK): https://www.legislation.gov.uk/ukpga/2015/15/contents', 185, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (14, 13, 'How long an Offer is valid, only 3 or 7 days?', 'There is no specific UK law for consumer-to-consumer offers, as consumer protection laws generally apply to business-to-consumer transactions. This means that a private seller is not legally bound to accept an offer or to provide a refund if the buyer changes their mind, unless the terms of the sale were agreed upon beforehand or if the goods are faulty. A consumer''s rights only apply when they buy from a business, not from another individual.
Business-to-consumer transactions: The Consumer Rights Act 2015 applies to purchases from a business, giving consumers rights such as a 30-day right to reject goods that are faulty or not as described.
Consumer-to-consumer transactions: These are typically governed by contract law and the terms agreed upon by the buyer and seller at the time of the sale.
Faulty goods: If you buy from a private seller and the goods are faulty, your rights are limited to the terms of your agreement. If the seller misrepresented the item or sold you something that was not their to sell, you may be able to seek a remedy, but this is not a consumer right.
Changing your mind: A private seller is not legally obliged to accept a return if you simply change your mind.
Digital content: If you buy digital content from a business, you may have a 14-day cooling-off period, but this does not apply to consumer-to-consumer transactions.', 186, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (14, 13, 'Shall I receive confirmation when I have accepted an Offer?', 'Yes, you shall receive a confirmation notification with a date and the product.', 187, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (14, 13, 'How to remove or delete an ad entirely from the service?', '1. Tap user icon from the bottom of the page “Manage My Ads”
2. Tap any of the ads displayed with an image and title.
3. Tap “Modify” from the “Modify My Ad” page.', 188, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (14, 13, 'Where can I find more information an Make an Offer?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/', 189, true);


-- Category: Conflict Resolution between Business-to-Consumers (B2C)
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (15, 'Conflict Resolution between Business-to-Consumers (B2C)', 'Conflict Resolution between Business-to-Consumers (B2C)', 15, true);

-- Category: Manage Product Offers
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (16, 'Manage Product Offers', 'Manage Product Offers', 16, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (14, 16, 'General', 14, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I access “Manage Product offers”?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “All” from the menu to view them, or “Accepted” or “Declined” to view all their offers.
You can “View Offer History” from here.', 190, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to view all the offers a Product has received?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “All” from the menu to view them, or “Accepted” or “Declined” to view all their offers.
You can “View Offer History” from here.', 191, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I access “Product offer history”?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “All” from the menu to view them, or “Accepted” or “Declined” to view all their offers.
You can “View Offer History” from here.
From Product:
1. Tap any Product to view it.
2. Scroll down until you find “Offer History” and tap it.
3. Now you can see “Product Offer history” page for the product.
4. Tap “All” to view all offer history and the user who have made it; or, “Accepted”, “Declined”, depending which you want to view for the product.', 192, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to view accepted offers a Product has received?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “Accepted” to view all their offers.
You can “View Offer History” from here.', 193, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to view declined offers a Product has received?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “Declined” to view all their offers.
You can “View Offer History” from here.', 194, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'What is a Product offer history?', 'Product offer history shows all received, accepted and declined offers given to a particular product between two users, or if there are offer history between many users, you can view all histories individually with a user. From “Product Offer History” you can access “All” , or only “Accepted” or “Declined” offers, and their dates.', 195, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'What options does the “Product offer history” have?', 'Product offer history shows all received, accepted and declined offers given to a particular product between two users, or if there are offer history between many users, you can view all histories individually with a user. From “Product Offer History” you can access “All” , or only “Accepted” or “Declined” offers, and their dates.', 196, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I make Make an Offer?', 'From User account
1. Tap any Product to open it
2. Scroll down until you find “Make an Offer” and tap it.
3. Tap “Manage Product Offers”, and choose any product.
4. Tap “View Offer History”.
5. Choose “Make an Offer” to view all their offers.
6. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
7. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).
From a product page
1. Tap any Product from the Search-page: product gallery or map.
2. Scroll down until you find “Make an Offer” button and tap it.
3. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
4. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).
From product chat
1. On Product page, of any product or service you wish to offer.
2. Scroll down until you find “Make an Offer” button and tap it.
3. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
4. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).', 197, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How Make an Offer (and counter-offer) from “Product Offer History”?', 'A new offer can be made in three ways:
User settings
1. Tap user icon to access “User account”
2. Tap “User settings”
3. Tap “Manage Product Offers”
3. Tap “View Offer history” of any product.
4. Tap from the bottom of the page “Make an Offer”
5. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
6. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).
From a product page
1. Tap any Product to open it, at the Search-page.
2. Scroll down until you find “Make an Offer” and tap it.
4. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
5. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).
From product chat
1. On Product page, of any product or service you wish to offer.
2. Scroll down until you find “Make an Offer” button and tap it.
3. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
4. Tap “Make an offer” button.
You shall receive an in-app notification, and confirmation of the made offer. Your counterparty shall either: “Accept”, “Decline”, or “Make an Offer” (counter-offer, which is a new offer).', 198, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to Accept, Decline an offer?', 'User settings
1. Tap user icon to access “User account”
2. Tap “User settings”
3. Tap “Manage Product Offers”
3. Tap “View Offer history” of any product.
4. Tap from the bottom of the page “Make an Offer”
5. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
6. Tap “Accept”, “Decline”, “Make an Offer” button depending on your preferred choice.
An accepted offer, is displayed on the “Chat” with a frame, which has a notice “Accepted for £245.00. Now
Schedule a Pick Up & Exchange”. An declined offer, is displayed on the “Chat” with a frame, which has a notice “Declined”.
From product page
1. Tap any Product to open it, at the Search-page.
2. Scroll down until you find “Make an Offer” and tap it.
4. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
5. Tap “Accept”, “Decline”, “Make an Offer” button depending on your preferred choice.
An accepted offer, is displayed on the “Chat” with a frame, which has a notice “Accepted for £245.00. Now Schedule a Pick Up & Exchange”. An declined offer, is displayed on the “Chat” with a frame, which has a notice “Declined”.
From product chat
1. On Product page, of any product or service you wish to offer.
2. Scroll down until you find “Make an Offer” button and tap it.
3. It leads to “Product Chat”, and now type the amount you want to offer e.g. £240.
4. Tap “Accept”, “Decline”, “Make an Offer” button depending on your preferred choice.
An accepted offer, is displayed on the “Chat” with a frame, which has a notice “Accepted for £245.00. Now Schedule a Pick Up & Exchange”. An declined offer, is displayed on the “Chat” with a frame, which has a notice “Declined”.', 199, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How Schedule a Pick Up & Exchange) from “Product Offer History” or ”User account”?', 'From Product offer history
1. Tap “User account”.
2. Tap “User settings”.
3. Tap “Manage Product offers”.
4. Tap any product of your choice “View Offer history”.
5. From “Product offer history” page, you can choose the “Accepted” offers, and below it you can find the button “Schedule a Pick Up”.
6. Tap “Schedule a Pick Up” and you enter the page.
7. On “Schedule a Pick up” page you suggest a date, time and leave additional questions or info if you wish, tap “Suggest a Pick Up date”.
Wait for the counterparty’s response, and be ready to make changes to the schedule if needed.
From user account’s “Pick Ups & Exchanges”
1. Tap “User account”
2. Tap “User settings”
3. Tap “Pick Ups & Exchanges”
4. Tap “Schedule a Pick up”
5. Choose “Date” and “Time”, and if you leave “Questions”.
6. The send the suggestion by tapping “Suggest a Pick Up date”.', 200, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to pay Buyer’s fee and get to Give Feedback as a Buyer?', 'Buyer’s fee £1.00 (Pick Up & Exchange Fee £0.70 and Service Fee £0.30) is charged automatically after you confirm the “Pick Up & Exchange” of the product or service your exchanged in a meet up. You need not to pay it yourself, but we process it for you for free. You shall receive an in-app notification, when it has been charged.', 201, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I give Feedback to user I bought a product from?', 'You can Give Feedback in threes places as Buyer:
Feedbacks status
1. Tap “User account”.
2. Tap “User settings”.
3. Tap “Feedbacks”.
4. Tap “Feedback status”.
5. Choose the product you wish to “Give Feedback” and tap it.
6. On “Give Feedback” page follow the instructions, and provide feedback, tap “Send Feedback” button.
Give Feedback
1. Tap “User account”.
2. Tap “User settings”.
3. Tap “Feedbacks”.
4. Tap “Give Feedback”.
5. Choose the product you wish to “Give Feedback” and tap it.
6. On “Give Feedback” page follow the instructions, and provide feedback, tap “Send Feedback” button.
­Paid Pick Up & Exchange Fees
1. Tap “User account” icon on Search-page.
2. Tap “User settings” from the menu inactive / active.
3. Tap “Pick Up & Exchange”.
4. Tap “Paid Buyer’s fees” or “Paid Pick Up & Safe Service fees”.
5. Tap the product you wish to “Give Feedback”.
6. On “Give Feedback” page follow the instructions, and provide feedback, tap “Send Feedback” button.', 202, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'How to Give Feedback as a Seller?', 'After Buyer has paid Buyer’s fee the “Give Feedback” buttons become available, and notification reminders are send to both counterparties, from which you can find guidance how to proceed. You can Give Feedback in two places as Seller or Buyer:
Feedbacks status
1. Tap “User account”
2. Tap “User settings”
3. Tap “Feedbacks”
4. Tap “Feedback status”
5. Choose the product you wish to “Give Feedback” and tap it.
6. On “Give Feedback” page follow the instructions and provide feedback, tap “Send Feedback” button..
Give Feedback
1. Tap “User account”
2. Tap “User settings”
3. Tap “Feedbacks”
4. Tap “Give Feedback”
5. Choose the product you wish to “Give Feedback” and tap it.
6. On “Give Feedback” page follow the instructions and provide feedback, tap “Send Feedback” button..', 203, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 204, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (16, 14, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 205, true);


-- Category: Schedule Pick Up & Exchange
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (17, 'Schedule Pick Up & Exchange', 'Schedule Pick Up & Exchange', 17, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (15, 17, 'General', 15, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'When can I Schedule Pick Up & Exchange?', 'You can Schedule Pick Up & Exchange after your “Offer” has been accepted by the counterparty user. For this you shall receive in-app notification and email reminder.', 206, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I Schedule Pick Up & Exchange?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Pick Ups & Exchanges”, and choose any product.
4. Tap “Schedule Pick Up & Exchange”.
5. Choose “Date”, “Time” and leave additional “Questions” if needed.
6. Tap “Suggest Schedule Pick Up & Exchange”.
You shall receive a confirmation by in-app notification and email. The counterparty (other user) receives the suggestion from you, in which the user shall answer by accepting or suggesting re-scheduling.', 207, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How to find Schedule Pick Up & Exchange from Product page?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Pick Ups & Exchanges”, and choose any product.
5. Tap “Schedule Pick Up & Exchange”.
6. Choose “Date”, “Time” and leave additional “Questions” if needed.
7. Tap “Suggest Schedule Pick Up & Exchange”.
You shall receive a confirmation by in-app notification and email. The counterparty (other user) receives the suggestion from you, in which the user shall answer by accepting or suggesting re-scheduling.', 208, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'What options I have in the Schedule Pick Up & Exchange page?', 'You can suggest the “Date”, “Time” and ask “Questions” if needed. The “Schedule a Pick Up & Exchange” page is basically, a calendar, from which you suggest a time of meeting.', 209, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'What options I have in the Scheduled Pick Up & Exchange page after Inspection and Exchange?', 'You can either “Confirm” or “Disconfirm the exchange”. If you “Confirm” that you have Exchanged the product or service, after successful inspection and exchange of the product, you confirm the deal has been done as agreed in the offer. If you “Disconfirm” that you haven’t Exchanged the product or service, after unsuccessful inspection and exchange of the product, you disconfirm the deal hasn’t taken place fro some reason, and thus the binding offer has been cancelled, in accordance with user rights.', 210, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I suggest a Schedule for Pick Up & Exchange?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Pick Ups & Exchanges”, and choose any product.
4. Tap “Schedule Pick Up & Exchange”.
5. Choose “Date”, “Time” and leave additional “Questions” if needed.
6. Tap “Suggest Schedule Pick Up & Exchange”.
You shall receive a confirmation by in-app notification and email. The counterparty (other user) receives the suggestion from you, in which the user shall answer by accepting or suggesting re-scheduling.', 211, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I define the date of Schedule Pick Up & Exchange?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Pick Ups & Exchanges”, and choose any product.
4. Tap “Schedule Pick Up & Exchange”.
5. Choose “Date”, “Time” and leave additional “Questions” if needed.
6. Tap “Suggest Schedule Pick Up & Exchange”.
You shall receive a confirmation by in-app notification and email. The counterparty (other user) receives the suggestion from you, in which the user shall answer by accepting or suggesting re-scheduling.', 212, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I define the time of Schedule Pick Up & Exchange?', 'User account
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “Pick Ups & Exchanges”, and choose any product.
4. Tap “Schedule Pick Up & Exchange”.
5. Choose “Date”, “Time” and leave additional “Questions” if needed.
6. Tap “Suggest Schedule Pick Up & Exchange”.
You shall receive a confirmation by in-app notification and email. The counterparty (other user) receives the suggestion from you, in which the user shall answer by accepting or suggesting re-scheduling.', 213, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'What to do in Schedule Pick Up & Exchange page after inspection?', 'You can either “Confirm” or “Disconfirm the exchange”. If you “Confirm” that you have Exchanged the product or service, after successful inspection and exchange of the product, you confirm the deal has been done as agreed in the offer. If you “Disconfirm” that you haven’t Exchanged the product or service, after unsuccessful inspection and exchange of the product, you disconfirm the deal hasn’t taken place fro some reason, and thus the binding offer has been cancelled, in accordance with user rights. See below:
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Pick Ups & Exchanges”, and choose any product.
5. Tap “Scheduled Pick Up & Exchange”.
6. Tap “Scheduled Pick Up & Exchange” page
7. Choose either “Confirm” successful inspection and exchange, or “Disconfirm“ if it failed.
We will automatically charge Buyer’s Fee £1.00 from the Buyer. Seller pays nothing for selling.', 214, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'What to do after Pick Up & Exchange and inspection of the product?', 'You can either “Confirm” or “Disconfirm the exchange”. If you “Confirm” that you have Exchanged the product or service, after successful inspection and exchange of the product, you confirm the deal has been done as agreed in the offer. If you “Disconfirm” that you haven’t Exchanged the product or service, after unsuccessful inspection and exchange of the product, you disconfirm the deal hasn’t taken place fro some reason, and thus the binding offer has been cancelled, in accordance with user rights.
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Pick Ups & Exchanges”, and choose any product.
5. Tap “Scheduled Pick Up & Exchange”.
6. Tap “Scheduled Pick Up & Exchange” page
7. Choose either “Confirm” successful inspection and exchange, or “Disconfirm“ if it failed.
We will automatically charge Buyer’s Fee £1.00 from the Buyer. Seller pays nothing for selling.', 215, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How to find Schedule Pick Up & Exchange for an Accepted offer?', 'From Manage Product Offers
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Manage Product Offers”, and choose any product.
5. Tap any of the products for which you wish to “Schedule a Pick Up & Exchange”.
6. Tap “Product offers History”
7. Tap “Scheduled Pick Up & Exchange” by tapping the button.
From Pick Ups & Exchanges
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Pick Ups & Exchanges” page.
5. Tap “Scheduled Pick Up & Exchange”
6. Tap any of the products for which you wish to “Schedule a Pick Up & Exchange”.
7. Tap “Product offers History”
8. Tap “Scheduled Pick Up & Exchange” by tapping the button.
Search-page “Pick Ups & Exchanges” icon
1. Tap your Pick Ups and Exchanges icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “Scheduled Pick Up & Exchange”
3. Tap any of the products for which you wish to “Schedule a Pick Up & Exchange”.
4. Tap “Product offers History”
5. Tap “Scheduled Pick Up & Exchange” by tapping the button.', 216, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'What can I do with the Schedule Pick Up & Exchange?', 'You can Schedule an exchange of a product or service, and suggest a meeting in the product location shown on the for the product, or agree another place. You can alternatively schedule meeting anywhere you wish, but please take care of all the safety measures. Please see our Safety Guidelines here.', 217, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I view the Status of Pick Ups?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Pick Ups & Exchanges”.
5. Tap “Status of Pick Ups”.
6. Choose “All”, “Pending” or “Done” Pick Ups, to view them and give response.', 218, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I pay unpaid Pick Up & Exchange fees?', 'The Buyer’s Fee £1.00 is paid automatically, so you don’t need to do anything. If however, the payment cannot be processed you will be notified and given directions how to add a payment method for automatic charge, or how to process the payment yourself.', 219, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I pay unpaid Buyer’s Fees?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
4. Tap “Pick ups & Exchanges”, and choose any product.
5. Tap “Unpaid Pick Up & Safe Service Fees”
6. Choose the product with unpaid fees and proceed paying.
Add a new payment method (Add New card)
1. Tap your Profile icon, at the Search-page.
2. Tap “User account” from the top of the screen.
3. Tap “Billing & Payment”.
4. Provide your card information: card number, expiry date, and security number (CVC).
5. Tap “Add New card”.', 220, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'How do I view paid Pick Up & Exchange fees?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”
3. Tap “Pick ups & Exchanges”, and choose any product.
4. Tap “Paid Pick Up & Safe Service Fees”
5. Choose the product which paid fees your wish to view and tap it.', 221, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'When do I get to pay the fees?', 'As you have Inspected and Exchanged the product, or service (after the “Pick Up & Exchange”), in which you meet up with the other user. After that you confirm or disconfirm the meeting at “Schedule Pick Ups & Exchanges”, and if it is successfully completed, Buyer is charged the compulsory Buyer’s Fee £1.00 automatically. Seller has no fees whatsoever to be paid for the meet up.', 222, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'When do I get to Give Feedback to the other user?', 'You get to Give Feedback after you have confirmed the Exchange and inspection of the product or service successfully. You shall receive an in-app notification and email, from which you can follow the directions how to proceed.', 223, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 224, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (17, 15, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com', 225, true);


-- Category: Inspection & Confirmation of Exchange
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (18, 'Inspection & Confirmation of Exchange', 'Inspection & Confirmation of Exchange', 18, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (16, 18, 'General', 16, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'When do I get to do the Inspection of product or service?', 'After you have a binding offer (A conditional offer for the gorund if the product & srvie is what promised), and you Scheduled a Pick Up & Exchange with the other user of the tranasaction, in which you meet up. Then you shall inspect the prodduct or servie. If the product or service is what you expected and agreed then go ahed and finalise the deal by exchange. If not cancel it.', 226, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'How to Schedule a Pick Up & Exchange for a product or service?', '1. Tap “User account”
2. Tap “User settings”
3. Tap “Pick Ups & Exchanges”
4. Tap “Schedule a Pick up”
5. Choose “Date” and “Time”, and if you leave “Quetions”.
6. The send the suggestion by tapping “Suuggest a Pick Up date”
You shall receive a confirmation by notification. The other party (user) receives the suggestion from you, in which th user shall asnwer by accepting the suggestion or re-scheduling.', 227, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'How to Inspect a product or service?', 'To inspect a product or service you buy from a marketplace, thoroughly vet the seller by checking their ratings, reviews, and profile before purchasing. Once you receive a product, physically inspect it for any damage, compare it to the listing, and clean it if possible. For services, you can review the provider''s past work and the terms of service, and then evaluate their performance upon completion.
For physical products:
Research the seller: Look at the seller''s ratings, read recent comments from other buyers, and be cautious of reviews that seem fake or overly positive/negative.
Inspect upon receipt: When you receive the item, physically check it over for any damage, wear, or defects that weren''t in the description.
Compare with the listing: Ensure the product you received matches the photos and description provided by the seller in the listing.
Clean the item: For items like furniture or other goods, it''s a good practice to clean and disinfect them after you purchase and receive them.
For services:
Review the provider''s profile: Check the service provider''s ratings, reviews, and portfolio on the marketplace platform.
Read the service details carefully: Understand the scope of the service, what is included, and any terms or conditions before you book.
Communicate with the provider: Before and during the service, maintain clear communication with the provider to ensure expectations are aligned.
Evaluate after completion: Once the service is completed, evaluate whether it met the promises made in the listing and if the provider performed as expected.', 228, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What to do if after Inspection you find the product or service is not what agreed in the offer?', 'If you discover a fault in a used product after an inspection and exchange, you should contact the original seller immediately, as the legal rights are with the buyer of record, not you. You can seek a repair, replacement, or refund if the defect wasn''t obvious during the initial inspection or if the fault existed at the time of purchase. It is advisable to inform the seller in writing, providing proof of purchase, to ensure your claim is officially recorded.
Steps to take
Contact the original buyer: The exchange was between you and the original buyer, but your legal claim is against the original seller of the product. Inform the original buyer of the issue and ask them to contact the seller on your behalf.
Check the terms of the exchange: Review the terms of your exchange to see if there are any clauses regarding faults discovered after the transaction.
Act promptly: Contact the original seller as soon as possible. The longer you wait, the more difficult it may be to prove the fault was not caused by normal wear and tear or by your misuse.
Provide proof: You will likely need to provide proof of purchase from the original transaction. You may also need proof that the fault existed at the time of purchase, which can be challenging for a used product.
Seek a remedy: Your rights under consumer law are for a repair, replacement, or refund, depending on the seriousness of the defect.
Consider legal action: If you are unable to resolve the issue directly with the seller, you may have to pursue legal action to enforce your rights.
Key considerations
"As is" clauses: Be aware that some private sales of used goods may have an "as is" clause that removes the seller''s responsibility for faults discovered after the sale.
Proof of fault: It may be difficult to prove the fault was present at the time of the original sale, especially if the product is old or has been used extensively.
Proof of purchase: You may be required to provide proof of purchase from the original seller to claim a refund or replacement.', 229, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'How to complain if other user cancels exchange after Inspection unfairly?', 'When a seller cancels a consumer-to-consumer used goods deal after an inspection, it may be a breach of contract, especially if the agreement was legally binding. To resolve the situation, the buyer can try to negotiate with the seller, consult a lawyer to understand their rights and options, or, if the sale has settled, file a claim through a court system like the Disputes Tribunal. Depending on the agreement, a seller may have a right to cancel based on a specific contingency in the contract, but can face legal consequences like lawsuits for damages if they cancel without a valid reason.', 230, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'Why do I have to Inspect a product or service?', 'You should inspect a used product before buying it privately to check for hidden faults that could lead to costly repairs, as UK consumer law protections like the Consumer Rights Act 2015 do not apply when buying from a private seller. A physical inspection allows you to confirm the item''s condition, verify it matches the description, and avoid buying something that is damaged, worn, or not fit for purpose, which could otherwise be your responsibility to fix.
Why inspection is crucial for consumer-to-consumer sales
No statutory rights: When buying from a private individual, you are not protected by legislation like the Consumer Rights Act 2015, which applies to sales from businesses. This means you have no legal right to a refund, repair, or replacement if the item is faulty, unless the seller was dishonest about its condition.
Proves quality: Inspecting the product helps ensure it is of a satisfactory quality, which is not the case for goods sold by a private seller.
Avoids costly repairs: Hidden defects, such as engine trouble in a car or worn-out components in an appliance, can lead to expensive repair bills that you would be responsible for, as the law doesn''t protect you from buyer''s remorse.
Verifies description: A physical inspection allows you to check that the item matches the description and photos provided by the seller, especially for online sales.
Identifies defects: You can identify any existing faults that have been brought to your attention by the seller. If you proceed to buy the item despite being aware of the fault, you won''t be able to claim it''s not of satisfactory quality because of that specific issue later on.', 231, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What to do if the exchange, purchase or transaction goes wrong?', 'What to do if a private sale goes wrong
If the seller lied about the condition of the product, it may be possible to pursue a claim for misrepresentation through the small claims court. However, this can be a complex and time-consuming process.
It is best to err on the side of caution and rely on your inspection to make an informed decision rather than relying on legal remedies that are unlikely to apply.', 232, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'Why after Binding offer Inspection is necessary?', 'Offers are conditional until inspection and something else. You should inspect a used product before buying it privately to check for hidden faults that could lead to costly repairs, as UK consumer law protections like the Consumer Rights Act 2015 do not apply when buying from a private seller. A physical inspection allows you to confirm the item''s condition, verify it matches the description, and avoid buying something that is damaged, worn, or not fit for purpose, which could otherwise be your responsibility to fix.
Why inspection is crucial for consumer-to-consumer sales
No statutory rights: When buying from a private individual, you are not protected by legislation like the Consumer Rights Act 2015, which applies to sales from businesses. This means you have no legal right to a refund, repair, or replacement if the item is faulty, unless the seller was dishonest about its condition.
Proves quality: Inspecting the product helps ensure it is of a satisfactory quality, which is not the case for goods sold by a private seller.
Avoids costly repairs: Hidden defects, such as engine trouble in a car or worn-out components in an appliance, can lead to expensive repair bills that you would be responsible for, as the law doesn''t protect you from buyer''s remorse.
Verifies description: A physical inspection allows you to check that the item matches the description and photos provided by the seller, especially for online sales.
Identifies defects: You can identify any existing faults that have been brought to your attention by the seller. If you proceed to buy the item despite being aware of the fault, you won''t be able to claim it''s not of satisfactory quality because of that specific issue later on.', 233, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What to do if there is a minor defect in the product or service after Inspection?', '(fix, bring down price or cancel the exchange if not able to amend)
If you find a minor defect during a consumer-to-consumer inspection, the best approach is to first try to , such as offering a discount to keep the item. If that fails or the defect is more significant than you initially thought, you may be able to demand a price reduction, repair, or replacement. In a formal dispute, an expert can determine the defect''s severity and your legal rights.
Immediate actions:
Communicate with the seller: Contact the seller to point out the defect and try to find a resolution, like a partial refund or discount, to keep the peace.
Document everything: Take clear photos or videos of the defect as evidence.
Consider the defect''s severity: A minor defect that doesn''t affect the item''s primary function is often handled differently from a major defect. A defect that impairs the item''s intended use is considered a material defect.
Escalation options:
Request a price reduction: If you decide to keep the item, you can ask for a reduction in price that reflects the defect''s impact, such as the cost of repair.
Demand repair or replacement: In some cases, you may be entitled to have the item repaired or replaced, but this is less likely to apply if the defect is minor.
Seek expert assessment: If you can''t agree with the seller, you can have an impartial expert inspect the item to determine if there is a defect. The cost of this inspection may be covered by the seller if a defect is confirmed.
What to keep in mind
Legal rights: Your legal rights can vary depending on your local consumer protection laws and the nature of the transaction.
Proof is key: Having clear documentation, like photos and a report from an expert, is crucial if you need to prove the existence of a defect.
Minor vs. major defects: The distinction is important. A minor defect will not give you the right to cancel the sale, though you may still have the right to a price reduction.', 234, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What happens after Inspection?', 'You make the exchange or transaction. Then Buyer pays the Buyer’s fee (Pick Up & Exchange fee), and then both of you receive Give Feedback buttons, to provide feedback for the exchange. Please make sure to inscpect carefully and if in doubt or you hesitate do not make hurried decision to purchase the product or service.', 235, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'Where do I Confirm or Disconfirm the Exchange?', '1. Tap “User account”
2. Tap “User settings”
3. Tap “Pick Ups & Exchanges”
4. Tap “Scheduled Pick Up & Exchange” page
5. From the bottom of the screen choose either “Confirm” or “Disconfirm Exchange”.', 236, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'How do I Confirm or Disconfirm the Exchange?', '1. Tap “User account”
2. Tap “User settings”
3. Tap “Pick Ups & Exchanges”
4. Tap “Scheduled Pick Up & Exchange” page
5. From the bottom of the screen choose either “Confirm” or “Disconfirm Exchange”.', 237, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What it means to confirm or disconfirm an Exchange?', 'If you confirm that you have Picked Up the product or service by meeting the other user, and done Exchange and/or made the transaction to other user, it confirms the deal has been done. By disconfirming you do the opposite in the case you did not make an exchange even though if you met or if you di not meet, but the exchange and thus binding offer was cancelled.', 238, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'What happens after confirmation or disconfirmation?', 'Both users provide Feedback to each other truthfully. In addtion Buyer has to pay Buyer’s Fees to RoundBuy for the Pick Up & Exchange, whereas the Seller pays nothing.', 239, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (18, 16, 'Where to get more information?', 'For more information (email address: security@roundbuy.com)
Click here to access My Feedbacks : https://roundbuy.com/my-feedbacks/
DONe 18.12.2025', 240, true);


-- Category: Feedbacks
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (19, 'Feedbacks', 'Feedbacks', 19, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (17, 19, 'General', 17, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'What is My Feedbacks?', 'My feedbacks show your entire feedback history. From all the products or services you have acquired through RoundBuy service, the counterparty has had a chance to provide Feedback after the completed inspection and exchange. Make sure always to get as good Feedback as possible, as it increass your chances of sales.
To view your “My feedbacks”
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “My Feedback”.
6. From here you can see all the Feedbacks you have received.
1. Tap “user account”
2. Tap “user settings”
3. Tap “Feedbacks”
4. Tap “My Feedbacks”
5. From here you can see all the “Pending” or “Done” Feedbacks.', 241, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where to view Feedback status for pending and done feedbacks?', 'To view your “My feedbacks”
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “My Feedback”.
6. From here you can see all the “Pending” or “Done” Feedbacks. IS THIS COREECT CHECK', 242, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'What is Give Feedback? Is this again this same heading herE???', '“Give Feedbacks” is the page in which you give feedback to the counter party you completed a exchange traansaction e.g. gave a coffee maker and received cash. On Give Feedback page (1) you Rate the Experience with Positive, Negative or Neutral. (2) Then you proceed to Rate the User with stars from 1 to 10. (3) Then follows “Write a short Feedback text” of 50 characters. Which is then “Send your Feedback”.', 243, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where to Give Feedback?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Give Feedback”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.', 244, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where to view my Feedback status or score?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Feedback status”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.', 245, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where to read other users Feedbacks?', '1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Scroll down to “Chat” and below it, tap “User Feedbacks”.
3. Tap “User Feedbacks”.
4. Tap ““User Feedbacks”, and you see the history of received Feedbacks of the user.
Read careful all the Feedbacks to find out the possible trustworthiness of the user.', 246, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'How useful Feedbacks are for the evaluation of trustworthiness?', 'User’s trustworthiness can be indicated by the feedbacks history. In general positive feedbacks indicate good exchange history with other users, while negative the opposite. If it is neutral it could shows that there have been both good and bad experiences.
When assessing “Feedback history” please compare, three tools: 1) Rated experiences in % (positive, negative, neutral); 2) Rated User stars from 1 to 10; 3) Short Feedback descriptions. These can be valuable!', 247, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'How to get good as Seller or BuyerFeedback?', 'As a Seller, you can get good feedback as a Seller by being proactive throughout the communication with your counterparty. Be truthful, direct, open and transparent in your communications. Make things easy for the other user, and make sure to ask all questions you require to assess both the product and the other user. Always address issues politely and kindly! Be honest in your dealings!
As a Buyer, you can get good feedback as a Buyer by being proactive throughout the communication with your counterparty. Be truthful, direct, open and transparent in your communications. Make things easy for the other user, and make sure to ask all questions you require to assess both the product and the other user. Always address issues politely and kindly! Be honest in your dealings!', 248, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'When can I give Feedback?', 'You can “Give Feedback” after you have Exchanged the product and confirmed on the service that you have inspected the product or service and it corresponded to your expectations and what agreed. After this you will be able to give Feedback.', 249, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'I have confirmed tne Exchange of the product or service, can I give Feedback?', 'Yes, after you have done the inspection, and confirmed the successful exchange, you shall receive automagically a “Give Feedback” notification. You can tap the button “Give Feedback”, on the in-app notification or email to proceed to give Feedback. Alternatively you can go to:
Feedbacks status
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Feedback status”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.
Give Feedback:
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Give Feedback”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.
­Pick Ups & Exchanges
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Pick Ups & Exchanges”.
5. Tap “Feedbacks”.
5. Tap “Give Feedback”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.', 250, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where can I give Feedback?', 'You can Give Feedback in threes places:
Feedbacks status
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Feedback status”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.
Give Feedback
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Feedbacks”.
5. Tap “Give Feedback”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.
Pick Ups & Exchanges
1. Tap your Profile icon, at the Search-page, at the bottom of the mobile app (website at the top of page).
2. Tap “User account”.
3. Tap “User settings”.
4. Tap “Pick Ups & Exchanges”.
5. Tap “Feedbacks”.
5. Tap “Give Feedback”.
6. Choose the product you wish to “Give Feedback” and tap it.
7. On “Give Feedback” page follow the instructions and provide feedback.
This removed!!! As the service functionality is changed: Tap “Paid Buyer’s fees” or “Paid Pick Up & Safe Service fees” => Tap the product you wish to “Give Feedback”.', 251, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'What to do if I have received Feedback which is unjust?', 'First contact the user who gave you the Feedback, you feel is unjust, and request re-evaluation. There is window of 14 days, to re-consider the Feedback, or change mind. All “Feedbacks” should be fair, truthful and without any favouritism nor discrimination whatsoever. If you require, you can turn to our Customer support, and request assistance if facing problems. There are possible penalties for unjust “Feedbacks”.', 252, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 253, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (19, 17, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/feedbacks/
We are always happy to help you! Email us: info@roundbuy.com
DONe 18.12.2025', 254, true);


-- Category: Notifications & Chat
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (20, 'Notifications & Chat', 'Notifications & Chat', 20, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (18, 20, 'General', 18, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'What are notifications?', 'Mobile app notifications are messages or alerts sent from an app to user’s device to provide information and encourage engagement. There are two main types: push notifications, which appear outside the app on the lock screen or notification center and require user opt-in, and in-app notifications, which appear only while the user is actively using the app, such as banners or pop-ups.', 255, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'What are in-app notifications?', 'In-app notifications are messages displayed inside a mobile app while the user is actively using it, unlike push notifications which appear on the device''s home or lock screen. They can be used to provide updates, guide users with tips, highlight new features, or prompt specific actions like leaving a review or completing a purchase. These messages are designed to be contextual and appear in various forms, such as banners, tooltips, or pop-up modals, and are a way to engage users when they are already within the app environment', 256, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'What are push notifications?', 'Push notifications are pop-up messages sent by a mobile app to a user’s device, even when the app isn’t open, to inform them about updates, promotions, or other alerts. These messages appear on the lock screen or in the notification center and are initiated by the app''s server, not the user. They are a key tool for user engagement, as they allow apps to communicate important information directly to their audience.', 257, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where to access notifications?', 'User account
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
3. Tap “Notifications & Chat”
4. Tap “Notifications” heading from the top of the page, aside the “Chat”
Alternatively on “Search-page” click on the top the “Bell” icon to access your “Notifications & Chats”', 258, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to access notifications from User account?', 'User account
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
3. Tap “Notifications & Chat”
4. Tap “Notifications” heading from the top of the page, aside the “Chat”', 259, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to create search notifications from User account?', 'User account:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
4. Tap “Create new Notification”.
5. Follow the guidance from the page.', 260, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'What kind of notifications can you receive?', 'Mobile apps can send various types of notifications, including informative alerts like wheather or flight updates, promotional offers and sales, and transactional messages such as order confirmations or baking alerts. Other types include personalized messages, location-based alerts, and those prompting action or feedback, all designed to keep users engaged with the app even when it''s not open.
Informative notifications: General updates, Contenxtual alerts, and Transactional alerts.
Action and engagement notifications: promotional and marketing, personalized messages, reminders, and feedback requests.
Location-based notifications: Geo targeting.', 261, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where can I make a “Search notification”?', 'User account:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
4. Tap “Create new Notification”.
5. Follow the guidance from the page.', 262, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to remove or delete a “Search notification”?', 'User account:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
4. Tap “Delete Notification”.
5. Choose the notification you wish to delete and tap “Delete”.', 263, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to change notification settings?', 'User account
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
4. Tap “Notification settings”
5. Choose your choices for “Notification settings” in accordance with your preferences.
6. IF you wish to have Push notifications click “Push notification on” if you wish to have them off push “Puch notifications off”.', 264, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to access Notifications from the user icons Search page?', 'On “Search-page” click on the top the “Bell” icon to access your “Notifications & Chats”.
Alternatively through User account:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
3. Tap “Notifications & Chat”
4. Tap “Notifications” heading from the top of the page, aside the “Chat”', 265, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to switch between Notifications & Chat?', 'Accessing the Notifications & Chat:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
3. Tap “Notifications & Chat”
4. Tap “Notifications” heading from the top of the page, aside the “Chat”
5. Push “Notifications” or “ Chat” from the top of thp age, to toggle bwetween
Toggle menu: To toggle between “Notification” or “Chat”push either of them. If you wish to use “Notifications” push it.', 266, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to view your Chats histories?', 'Accessing the Notifications & Chat:
1. Tap “User account” by clicking the user icon profile
2. Tap “User settings”
3. Tap “Notifications”
3. Tap “Notifications & Chat”
4. Tap “Notifications” heading from the top of the page, aside the “Chat”
5. Choose “Chat” nby toggling into it by pushing it.
Toggle menu: To toggle between “Notification” or “Chat”push either of them. If you wish to use “Notifications” push it.', 267, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'How to view and write Product chat?', 'There are two ways to use the chat, from User account or through Product.
Through product:
1. Go to the Product,
2. and click from there the product specific “Chat”
3. Start chatting with the user.
Through User account:
1. Go to User account.
2. Tapa “User settings”
3. Tap “Notifications”.
4. Tap “Notifications & Chat”
5. Choose “Chat from the top of the page by tapping it.', 268, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where to report if I receive inappropriate chat content from a user?', 'Through the product, which owner provided you possibly inappropriate or forbidden content via chat. Alternatively you can do the same through Chat page by clicking the “Report content” or exlcmation mark to find the Report content button.', 269, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where can I find more information on Notifications or Chats?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help
SOME DATA MISSING: as you shall add new settings to notifications e.g. marketing ads etc.', 270, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 271, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (20, 18, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com
PAYMENTS', 272, true);


-- Category: Payments & Fees of Marketplace service
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (21, 'Payments & Fees of Marketplace service', 'Payments & Fees of Marketplace service', 21, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (19, 21, 'General', 19, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What fees and payments is there to be paid by users?', 'Users pay for yearly subscriptions or memberships plans (Green, Gold, Violet). Sellers can purchase visibility ads fro their products & services. In addition, fast and targeted ads can be purchased for a fee. Furthermore, Buyers pays upon completion of deal Buyer’s fees (Pick Up & Exchange fee £0.70 and Service fee £0.30).', 273, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What fees does Buyer have to pay? (Pick Up fee & Safe service fee)', 'For successful exchange (deal) Buyer pays charges, while Seller pays nothing for it (only paid visibility ads can be purchased to advertisethe product better)Buyer’s fees include: 1) Pick Up & Exchange fee £0.70, payable upon successful exchange between the other user. 2) Service fee £0.30, payablee upon succesfull exchange betweem the other users. Other fees include paying visibility ads.', 274, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What fees does Seller have to pay? (Pick Up fee & Safe service fee)', 'For succesful exchange (deal) Seller’s pay nothing. RoundBuy charged nothing for this. Only Buyer’s has to pay, Buyer’s fees, which are used to the running of the service. Seller can when advertising their products or services purchase visibility ads, to get more visibility, and find more buyer’s.', 275, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'Is the payment service safe and secure?', 'Yes. All our payments are processed through international secure payment service provider such as Stripes or Paddle payment service which is rated one of the best and securest payment services in the world. Rest assured your card or bank details are safe.', 276, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What card and payment details will we save?', 'We save only expiry date, and 4 last digits of your card, and in some cases the security code.', 277, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What payments are there to be made in RoundBuy?', '1. Membership for Green, Gold and Violet all can have paid subscriptions plan payments.
2. Visibility Ads purchased to make standard ad more highlighted and to attract more buyers.
3. Transactiosn and Pick up fees.', 278, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'How do we act as middlemen or intermediaries between two users at RoundBuy?', 'No we do not act as middlemen between the two users. What we do is we provide a platform for users to advertise, offer and find products & services. The transaction happen between users only. We only charge a nominal fee from the Buyer’s to facilitate the service. All changes and transactions are between the users, the money and the products, which makes the business more easier and safves money from users. The amounts are between users, all we know is the final amount documented on the chat or offer histor.', 279, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What is transaction & pick up fee (advertise fee)?', 'This fee is a nominal small fee that the userr has to pay for evey sell or sold product or service at the RoundBuy service. Only after this has been paid the user gets chance to provide feedback for other users for the transtion and exhcnage.', 280, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What is the Pick Up & Exchange fee Buyer has to pay for every product?', 'It is the same as Buyer’s fee £1.00m which is payable upon every succesful deal made between two users. For succesful eexchange (deal) Buyer pays charges, while Seller pays nothing for it (only paid visibility ads can be purchased to advertisethe product better)Buyer’s fees include: 1) Pick Up & Exchange fee £0.70, payable upon successful exchange between the other user. 2) Service fee £0.30, payablee upon succesfull exchange betweem the other users. Other fees include paying visibility ads.', 281, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What is Buyer’s fee?', 'It is the same as Pick Up & Service fee £1.00, which is payable upon every succesful deal made between two users. For succesful eexchange (deal) Buyer pays charges, while Seller pays nothing for it (only paid visibility ads can be purchased to advertisethe product better)Buyer’s fees include: 1) Pick Up & Exchange fee £0.70, payable upon successful exchange between the other user. 2) Service fee £0.30, payable upon successfully exchange between the other users. Other fees include paying visibility ads.', 282, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'What happens if I don’t pay the service fee?', 'Yes, you have to pay for each and every transaction & pick up, and its on the only way to get a chance to build your trust to other members as otherwise you will net get chance to offer feedback for transactions.
Part of the transaction fee is used to maintain the service level, and the Pick up fee for the advantage for the user as the user gets better chance to sell his items.
If you do not pay the Transaction & Pick up fee, you will get suspended, until you have paid all of the fees..', 283, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'Is there transaction fee at RoundBuy for every succesful sale?', 'No, transaction fee is a fee that Seller has to pay for the succesfull deal, for exmaple for selling a chair. This is usually is formed by a base amount of some euros plus a percentage e.g. 5% of the ale price. RoundBuy charges nothing from Sellers upon succesfull sale! Only Buyer pays a nominally small amount of Buyer’s fee to cover the upekeeping of the service.', 284, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (21, 19, 'Where can I get more information on payments and fees?', '(or contact Roundbuy via Contat Us, by clicking here)
For more information please read here: https://roundbuy.com/help/
REFERRAL PROGRAMS', 285, true);


-- Category: Referral & Rewards
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (22, 'Referral & Rewards', 'Referral & Rewards', 22, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (20, 22, 'General', 20, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'What is a referral program and reward?', 'These are the programs available for users. There are 4 x referral programs: 1) Earn Gold membership, 2) Earn 2 x visibility ad, 3) Earn 1 x visibility ad, 4) Earn Diligent Seller.', 286, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'What reward do we offer and how to get them?', '1. Get gold plan by getting 5 new membersp to join RoundBuy as a Green member, which is free.
2. Get 2x Visibility Ads. Get 5 new members to join RoundBuy service, and earn visibility ads for free.
3. Make 5 your own Ads selling products and publish them at RoundBuy, and get 1 x visibiity Ads for free.
4. Diligent Sleller mark, sell 10 products at Roundbuy and receive diligent seller mark for free. You get additional discounts as a Diligent Seller e.g. discounted price offers for Visibility Ads etc.', 287, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'How can I get Gold plan for free (Get Gold plan)?', 'Become a Green mmeber by creating an account. Give the Referral unique code to 5 friends or conenctions of yyours. As they become Green mebersm and they use your referrla unique code, you get Referral status updates to indicate how much you have earned. As you reach completion with 5 joinedd new members, you can redeem from the same page the rewards you have earned. Its that easy!
Please note the referral code unique is different for Referral Earn Gold membership and for Earn 1 x Visibility Ads, which both need 5 new joined members to get the reward.
Form ore information please refer to our Legal page here: https://roundbuy.com/memberships/', 288, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'How can I get 2 x Visibility Ads fro free (Get Visibility x2)?', 'Give the Referral unique code to 5 friends or conenctions of yyours. As they become Green mebersm and they use your referrla unique code, you get Referral status updates to indicate how much you have earned. As you reach completion with 5 joinedd new members, you can redeem from the same page the rewards you have earned. And it is, really that easy!
Please note the referral code unique is different for Referral Earn Gold membership and for Earn 1 x Visibility Ads, which both need 5 new joined members to get the reward.
Form ore information please refer to our Legal page here: https://roundbuy.com/memberships/', 289, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'What do I get if I make 5 x my own Ads for sale (Get Visibility x1)?', 'Make 5 x my won ads on the Roundbuy service for products or services. You do not need to get them sold, but what counts is that you try your best with a good ads, descriptions and images! This is how you earn 1 x visiblity ads fro free. And you know what you can do this many times!
Form ore information please refer to our Legal page here: https://roundbuy.com/memberships/', 290, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'How can I get Diligent Seller mark (Get Diligent Seller mark)?', 'Build trust as a Seller of products and earn Diligent seller mark. Images, descriptiions need to be top nothch! You need to put 10 x my own ads on sale. And you need to get 10 x good feedbacks on the sold products or services. You earn a Diligent seller mark, and become even more recognised at the service, gettign more attention and visibilitty and even more easily sells.
Form ore information please refer to our Legal page here: https://roundbuy.com/memberships/', 291, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'Where to read the status of my rewards?', 'Text here, go to user account, and click user setting, then click rewards. And from there lcick the speicific reward e,g. Gold membership Referral, and from there click the status of reward header.', 292, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'How do I get to Redeem my Rewards?', '1. Go to User account” thought the userp rofile icon.
2. Choosse the User settnings on the top.
3. Choose Rewards by cliking it
4. Then choose the particular Rewards program you decire to participate.
5. Follow the actionlist, guide what do do. Either collect new users by providing them the Referral code, which is unique for each reward and give it to your contacts. Or, create the amount of ads needed, and sstart selling 10 ads.
6. Follow the Referral status page to see howm uch you have earned, how much to go to get your reward.
7. Redeem finally, redeem your earned reward­ by following the isntructions on the page.
Link: https://roundbuy.com/user account/rewards/', 293, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (22, 20, 'How many times can I get these rewards?', '1. Get gold plan by getting 5 new membersp, => (only once! 1 x times)
2. Get 2x Visibility Ads. Get 5 new members to join => (as many times as you get 5 new members) free.
3. Make 5 your own Ads selling products => (as many times as you do it times)
4. Diligent Sleller mark, sell 10 products => (only once! 1 x times)
Where to get more information on referral programs
(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/
SAFETY GUIDELINES', 294, true);


-- Category: Safe Buying and Selling (old Safe Business) = Safety Guidelines
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (23, 'Safe Buying and Selling (old Safe Business) = Safety Guidelines', 'Safe Buying and Selling (old Safe Business) = Safety Guidelines', 23, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (21, 23, 'General', 21, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What is a good user like?', 'A Fair player. A good user is aware, considerate, vigilant and acts with discretion, who
takes care of everybody’s rights in his/her transactions. Everything has value, and in
business its good to thrive toward a fair price, and to oﬀers on which both parties are
content. There is nothing wrong in trying to pursue their own interests and get profit
for example by getting the best product with as low price as possible, or, getting the
product sold with highest price possible. In cases when the oﬀer seems too good, it
probably is that, so proceed with care. Find out the credentials, both the product and
the owner, but be respectfully no matter what the case, but if anxious or suspicious
back oﬀ.', 295, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What responsibilities user has?', 'All the users of the RoundBuy service are responsible for themselves and their
actions, and therefore it is also the users responsibility to make sure to promote
fairness, abide the rules, and observe the law, and comply with the oﬃcials in their
business transactions, but also to protect their own rights as well as others. Plus Buyers responsbilites. Plus Sellers responsibilites.', 296, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to choose wisely safe default location and product locations?', '(FOR THIS SEE THE RE-WRITE and REVIEW of the MY LOCATION CONTENT ABOVE
Also visibility is a of high concern here, you ant to attract as much views as possible from other users.
It is preferable to place the spot at the side, end or suitable part of a road, such as a ssquare or marketplace area or space yarea rather cloe to your home e.g. 200 m distnce from it, but not more if you do not wihs.
Product location 1 = close to your main home address (but never precise location for safety reasons). This is also your centre-point, or default location on the map.
Product location 2 = close to your work address or other location you frequently daily go e.g. near to train station (but never precise location for safety reasons)
Product location 3 = close to your work address or other location you frequently daily go e.g. near to train station (but never precise location for safety reasons)', 297, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What is a safe place for a default location (centre-point)?', 'Are, place where you feel safe. It can be a street spot, a square, end of the road or market square or anything you feel good about. Visibility that you can see others and others can see, as its not recommendable to meet in secretive or hidden or dark places. Rather at light and places where other people move. This depends of course your surrounding area, country and city. Where you can get easily without compromising your own safety, time etc. This is one product location at the same time as default location. Compare product location.', 298, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to protect your IDs?', 'Whenever possible do not provide any unnecessary personal information to the
partner of the business transaction. When performing the actual exchange of the
product e.g. buying it or providing the product for check up, it is advisable when
appropriate to enquire the ownership rights beforehand in writing through the chat.
The checking and showing of the ownership rights, is always the responsibility of the
trade partners, and never a responsibility of RoundBuy company.
For us at the RoundBuy the safe way to do business, between the users, is most
important, and therefore we try our best to improve our procedures to make the
service safer and to prevent fraudulent activity. RoundBuy service provides an online
marketplace for mainly private customers to trade and exchange their products
through the online marketplace. RoundBuy cannot assume any responsibility in
choosing the best way to oﬀer the product or service nor do we participate in thetransactions in any way. Even though most of the business transaction go through
successfully, it is wise and advisable to to make these performances with due care and
responsibility. We at RoundBuy cooperate fully with the governmental oﬃcials, and
national legislations in all matters.', 299, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to chat safely?', 'Furthermore, when doing business transaction e.g. contacting the other party, making
an oﬀer, or similar it is necessary that you do as much as possible, if not all, in writing
through the service chat. The chat service is available for those users who have gone
through the registration process and verification of eID. When problems and disputes
arise, they can more easily resolved if negotiations, oﬀers and similar have been made
in writing, and perhaps archived to your own computer by screenshots. This makes it
easier in both, in the help oﬀered by RoundBuy in disputes, and possible oﬃcial legal
mediation situations. By doing so both parties of the transaction protect heir own,
but also the others rights, so you are encouraged to use the chat service.', 300, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to pay safely?', 'When meeting the other user for the exchange or trade of the product, make sure to
take with you exact change, and not excessive amounts of money. Ascertain the
ownership rights before the exchange, and is possible ask to see a receipt of purchase
or a proof receipt for the exchange. The RoundBuy service has no part in the business
transactions between users, nor does it assume any responsibilities over it in any
cases. The way the users pay is between the users, but in everything abiding to law is
a must. We encourage however to check and find out that the money bills or notes
are not fake or in any way fraudulent. Whether a user chooses cash payment, mobile
payment, bank transfer, Paypal or similar, is totally up to the user, but please find out
the safe ways to use any service you choose.', 301, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What to do before making an offer?', 'Product Knowledge: It is of utmost importance to to read carefully the advertisement
of the product, and familiarise oneself to the product carefully. If the advertisement
seems to lack some information, or you cannot understand some part of it, it is
advisable to contact the other party and make appropriate enquiries to get the
missing info. Compre the product to similar new ones, their qualities and monetary
value, in order to ascertain, you have formed an appropriate view of the product. In
addition, before making an oﬀer, find out more about the seller.
Go through the Feedback history of the seller. If the user has received mostly positive
feedback the business transaction has good chances to go through well. If however
the business transaction partner has mostly negative feedback, then you should
proceed with caution. Form an opinion of the maximum amount you are willing to
pay.', 302, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'Question 2: variation: How to schedule a Pick Up and Exchange safely?', 'Contact the business transaction partner and arrange a meeting by suggesting date,
time (note you do not need to provider additional contact details), but conducting the
negotiations through chat and message service. At this point you should also make
the oﬀer of price and reach agreement of it. As a basis, the place of exchange should
be roughly the place in which the product location was marked to be, but this can be
changed if both wish so.', 303, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What to do after the transaction or exchange has been made?', 'Before making the transaction and exchange, you should have inspected the product
as you accepted it and provided a payment. The exchange of e.g. money should be
done after seeing and inspecting the product at the exchange, and not before hand. If
however you should do so make sure all is conducted in writing if possible. In the case
you agree sending the product further, use “cash on delivery” in which you can open
the package at the post oﬃce and inspect the goods before taking it. If the product is
send via mail, the seller should provide you a tracking code, which you should follow
via internet. Please note RoundBuy service does not provide any sending options, and
any sending contract and fees or similar are always entirely between the users
(RoundBuy is not a party of transaction between the two users or similar). After
arranging meeting the possibility appears to your user account, or to the product as
you have logged in, in which you can give and receive feedback of your business
transaction. If you made no exchange or transaction you should not leave feedback of
the other user.', 304, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to safely exchange a product or a service?', 'Always make sure the exchange is safe! If any concerns withdraw, and in extreme
cases call help or contact police. Remember you have always right to back oﬀ from a
transaction until the exchange of ownership. In order to improve the safety here is a
checklist:
Whenever possible make the exchange and transaction face to face in a public
place. Please do not enter houses unnecessarily but remain at street in a place you
can be seen and ask help if you need it.
Whenever possible use places as shopping centres, markets, parking lots, or
train or buss stations as meeting points. Never go to any dubious, too quiet, strange
places or any place you cannot escape easily or call help.
Whenever possible do not enter anyone’s houses nor do allow anyone enter
your house if by any means possible. However, in some cases when you consider it
safe for the business transaction partner to retrieve the product from your actual
location, please note you do not need to invite him or her inside your home, but again
use the safest and most public space in your home yard or similar whenever possible.
Whenever possible if for some reason you have to invite the other business
transaction partner inside to your home, please asks your family member, friend orneighbour to be present during the transaction or exchange. Also if anyone wants to
enter your house as a group then proceed with care.
Whenever you encounter situation that you are for example selling or renting a
product, but the other party rises your suspicion or makes you anxious please
withdraw from the transaction or exchange. For example if the other party suggests
strange arrangements for payment, asks payment time, hurries the exchange or
transaction, there are problems with ID or receipt then it could be advisable to
withdraw.
Whenever contacting the other party, make sure the sellers or buyers use, as
much as possible, the chat service. It is also imperative to prefer the use of SMS and
telephone, instead of emails, for which fake addresses can more easily be used.
Whenever you are selling and oﬀering valuables, be more careful. Also consider
not to reveal your precise home address, as it could attract thieves or fraudsters. Also
be cautious if you allow a test period for the testing of the product you are selling. In
those cases you should receive part of the payment, perhaps half of the payment or
other deposit for your safety, in the cases of theft.
Whenever exchanging bicycles or in fact anything with serial numbers, be
particularly strict to find out of the ownership of the vehicle or product. In the
inspection the original receipt of purchase can be valuable. Seek to be provided the
serial number of the bicycle. Ask additional details of the original purchase of the
bicycle for example place and time and year etc. Stay away of too cheap bicycles, they
could be part of a theft. Use moderation and report a suspicious advertisement if you
become suspicious about the seller. Do not purchase a stolen bicycle.', 305, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to give Feedback propperly?', 'The Feedbacks of any user, provides you with information about the previous
business transaction and exchange the other user has made. For each business
transaction, the other party is provided with an opportunity to give feedback with a
short sentence, and to choose one of the following a positive, neutral or negative
feedback marker. Both parties, for example the seller and buyer, each are provided
with the chance to give Feedback. The system will calculate also averages for each of
the positive, neutral and negative markings e.g. Positive 80 %, Neutral 10 % and
Negative 10 %. Any user can check the Feedbacks of the other user they want to make
business with. The higher the positive marking and average the more reliable the user
is. However, each user has to begin from zero feedbacks, which have to be taken into
account. Nevertheless reliably given and fair Feedbacks are important for the safety of
the service, so please make sure you provide only appropriate feedbacks, which
reflect the reality. Do not use it to punish the other party in any ways, or it could lead
to your User Account suspension or cancellation.', 306, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'Which IDs should you prefer in identifications for safety?', 'In any conditions, you should not provide your personal identity cards or similar to
the other person, except for short inspection in the exchange of products and money
(in some cases), at the end of the business transaction if necessary. Such IDs as
personal identification number, passports or driving license are not to be copied and
provided to the business partner. In the cases, where the other user desires to see
the ID, to ascertain safe business, and you provide a copy of your identification card
or similar for inspection, make sure all the unnecessary information has been edited
or cropped out of the copy. However, we do not recommend providing any copies of
IDs, and upon inspection, retain the ID at your own hand and possession at all times,
without handing it to anyone, in the case it would be stolen. Passports are too
valuable to be lost, so we recommend using a driving license or some other ID.
In RoundBuy service all users go through Electronic Identity check (eID) by SMS, email
and in some cases bank card verification. Users who have gone through the Electronic
Identity check, are more reliable and safer business partners, and provides a clear
message of trust. In the cases of identity thefts, where a user pretends to be someone
else by using other persons ID and bak card, RoundBuy takes no responsibility for any
damages suﬀered by any user. User cooperation and verification are necessary to
maintain the safety of the service.It is in the discretion of the seller to consider selling only to those whose identification has been strongly verified.
It is free to make the Electronic Identification, which is done during the registration
process to the online marketplace. All you require is a credit or debit card, mobile
phone with SMS service and email address for the verification process. This can be
renewed annually or otherwise periodically.', 307, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'How to moderate and report inappropriate or forbidden content?', 'The moderation of the RoundBuy benefits greatly from users vigilance. Whenever you
use the service as a user, and you encounter a suspicious advertisement, please use
the moderation button. Such inappropriate advertisements contain material, whichcould be inciting against a group of people, homophobic content, far right activities,
violence and sexual, or anything oﬀensive content. Propagation of any anti-
establishment movements or otherwise harmful content, is strictly forbidden in the
platform. For this purpose there is a Moderation Button in each of the advertisements
for informing the platform service provider of an inappropriate advertisement, which
we can then remove. There are other additional measures for moderation for
example in the publication of an advertisement. Please report any inappropriate
content and help us make the service even more safe and enjoyable.', 308, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What to do if there are fraudulent business transaction or need for dispute resolution?', 'Please make sure to follow all the guidelines provided by the RoundBuy service, for
safe business transactions and exchanges, in order to avoid most of the unpleasant
and fraudulent experiences. However, if you still feel that you have been cheated in
any way, it is advisable that you file a criminal complaint.
We at RoundBuy cooperates fully with authorities and government oﬃcials and
provide them (police and other oﬃcials) information from the service, which is
necessary for the investigation of the case. However, please exercise reason and
patience in any case and retain friendly manner of conversation with any party you
attempt to make business transactions even when encountering trouble, by asking
questions and finding out things first, as sometimes there are good explanations for
things, such as delays, misunderstandings and such.
Some times cases it is advisable to provide negative feedback to the fraudulent
user, who provides misinformation or otherwise misleads other users. Sometimes the
other user will change his or her behaviour after receiving such feedback, but this can
also help other users to stay away from the unfair business partner. If a user receives
continuously negative feedbacks his or her user account and membership can be
suspended or cancelled.
In some cases it is necessary to report an oﬀence to Police or make a complaint
to consumer protection authority. If you decide to make such oﬃcial complaint please
collect all useful evidence such as chat texts or similar and provide it to the oﬃcial in
question. Cooperation with oﬃcials is imperative.', 309, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (23, 21, 'What to do if you suspect fraud and there is dispute?', 'If you think you have been cheated please first contact the other party and demand:
transaction cancellation and or compensation for the product or service. If you
consider it necessary inform RoundBuy immediately of the cheating, make sure to
provide a detailed description of the event through the Help Centre Dispute page.
However here is a short order of process to follow:', 310, true);


-- Category: Safety Guidelines
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (24, 'Safety Guidelines', 'Safety Guidelines', 24, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (22, 24, 'General', 22, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'What are the Safety Guidelines in short?', '• Centre-point your default location
• Make sure to Advertise truthfully
•There are two kinds of products
• Check Feedbacks history
• Reach a mutual understanding
• Schedule a Pick Up & Exchange
• Approved inspection confirms the deal
• Give Feedback
Familiarize yourself with this Safety guide!
Go now, and enjoy the product & service you bought or sold safely!
Form ore information: https/roundbuy.com/safety-guide/
1/3', 311, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'What are the safety guidelines in detail?', '•Centre-point your default location', 312, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'How to choose a good and safe default location & product locations?', 'Safety: always use imprecise location.
• Make sure to Advertise truthfully', 313, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'Sometimes you need to report content, should I or should I not?', 'Safety: Be carefully, decent & no nudity.
•There are two kinds of products', 314, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'No prohibited items, but goods you find from jumble sale, right?', 'Safety: Only things suitable for all fmaily.
2/3
•Check Feedbacks history', 315, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'Reputation follows the diligent & trustworthy trade partner, how to spot?', 'Safety: No to negative & cancelled deals.
Reach a mutual understanding', 316, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'Take your time to decide, find out and agree or disagree, to be sure?', 'Safety: Dodgy, unresponsive & no ownership.
Schedule a Pick Up & Exchange In a safe place with light,
other people & accompanied, for sure we can meet.
Safety: make sure to meet safely
3/3
Approved inspection confirms the deal
Condition, brand & ownership, and finalise it!
Safety: Be sure to meet and exchange safely!
•Give just Feedback', 317, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (24, 22, 'If the experience was good & product what you expected, give many stars?', 'Safety: be accurate, no false feedbacks.
Read more!
Go now, and enjoy the product & service you Bought or Sold!
Familiarize yourself with this Safety guide!
Go now, and enjoy the product & service you bought or sold safely!
Form ore information: https/roundbuy.com/safety-guide/
MODERATION', 318, true);


-- Category: Forbidden Products
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (25, 'Forbidden Products', 'Forbidden Products', 25, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (23, 25, 'General', 23, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What can I sell, buy, give or rent at RoundBuy?', 'Please refer to our more exhaustive list here to find out what is forbidden: https://roundbuy.com/help/
All products that can be sold at the RoundBuy service are commonly such which cause harm to no one, and which could be sold in the presence of minors between adults.
However, you must refer to your country specific list of items, services and goods that can be legally sold by consumers. RoundBuy assumes no liabilities on what you sell.', 319, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What products are restricted & prohibited at the marketplace?', 'Products and services that are forbidden on the service indluce anythng that is banned or forbidden in your country, and also all banned and forbidden at RoundBuy service, such as Please refer to our more exhaustive list here: https://roundbuy.com/help/', 320, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What services are restricted & prohibited at the mrketplace?', 'Forbidden services at marketplaces include illegal services, those violating community standards, and professional services offered without proper certification. This covers a wide range of activities such as illegal drug-related services, human trafficking, and services that promote violence or discrimination. Additionally, professional services like legal or financial advice require the correct qualifications, and services that involve fraud or hacking are also prohibited', 321, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Why do we prohibit & restrict certain products and services?', 'Marketplaces prohibit certain products . These prohibitions cover a wide range of items, including illegal goods, items that violate community standards (like adult content, alcohol, or hate speech), inaccurate listings, and products that are dangerous or may facilitate illegal activity.', 322, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Reasons for prohibitng certain products & services?', 'Legal and regulatory compliance: Marketplaces must follow federal, state, and international laws. This includes prohibitions on weapons, certain drugs, and items sourced from regions under sanctions or from forced labor, says Walmart Marketplace Learn.
Community safety and standards: To protect users, platforms ban items that are harmful, dangerous, or inappropriate. Examples include e.g. adult content etc.
Preventing fraud and scams: Marketplaces ban listings that are fraudulent, inaccurate, or designed to deceive buyers. This includes things like "in search of" or lost and found posts that aren''t a physical product for sale, notes Facebook.
Prohibiting illegal goods and services: Items that are illegal to sell, such as counterfeit goods or devices that facilitate copyright infringement, are prohibited. Services like house cleaning are also often not allowed on product-focused marketplaces, according to Facebook.
Policy enforcement: Marketplaces have their own internal rules that sellers must follow. Non-compliance can result in a listing being rejected, a temporary ban, or a permanent ban from the platform.', 323, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What are community safety and standards?', 'Community safety and standards: To protect users, platforms ban items that are harmful, dangerous, or inappropriate. Examples include e.g. adult content etc. Adult content: Selling or promoting adult products or sexually suggestive content is prohibited. Alcohol and drugs: Listings for alcohol and illegal drugs are not allowed. Human body parts and fluids: These are explicitly banned. Hate speech and discrimination: Content that promotes discrimination or violates community standards is prohibited', 324, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What kind of prohibitions and restrictions do we have?', 'Some examples include, but are not limited to:
Commonly prohibited items in marketplaces include illegal drugs, weapons and firearms, counterfeit goods, and adult-themed material. Other forbidden products are those that are hazardous, stolen, or contain personal information. Marketplaces also often ban specific items like live animals, certain medical supplies, food, and items that promote illegal activity or hate speech.
Please refer to our more exhaustive list here to find out what is forbidden: https://roundbuy.com/help/', 325, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What to do if a listing is prohibited?', 'Review the policies: Check the marketplace''s specific policies for prohibited items. Contact support: If you are unsure why a listing was rejected, contact customer support for clarification. Correct listings: Ensure that your listings are accurate and comply with all rules before re-listing', 326, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How do we enforce and monitor prohibited & restricted items?', 'Marketplaces monitor for prohibited listings using a combination of automated systems (like AI, keyword/image filters) and human review. They analyze text and images, and can also monitor user activity and account data to identify suspicious patterns. In addition to these proactive measures, they use user-flagging systems and respond to reports from authorities to catch listings that slip through.', 327, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What are the Seller responsibilities?', 'Prohibited listings are . Seller responsibilities include understanding these policies, ensuring all listed items are authentic and lawfully obtained, and complying with all local laws and regulations. Sellers are accountable for any policy violations, which can lead to listing removal or account suspension.', 328, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What are the Buyer responsibilities?', 'Prohibited listings on marketplaces include items that are illegal, unsafe, or violate specific platform policies, such as weapons, drugs, certain animals, and medical supplies. Buyer responsibilities include', 329, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How and where can I find more information on prohibited & restricted items?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/', 330, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How can you report forbidden or inapprirate contnet?', 'Reporting content on marketplaces involves , with robust moderation often using AI and human oversight to maintain standards and protect users from fraud and abuse. Content reporting ensures quality, safety, and legal compliance for buyers and sellers on platforms like Amazon, eBay, and Facebook. You report by: (1) in-Product Reporting buttons, (2) through reporting forms or contact us, (3) IP reporting tools for legal takedowns on legal breaches, or IP theft.', 331, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How to report Ads with inappropriate or forbidden content?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”
Note! In possibly severe or urgent case, requiring urgent attention, please write to us: security@roundbuy.com
For more information: https://roundbuy.com/security/Report-content/', 332, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How to report inappropriate or forbidden chat content?', 'Go here:
1. Tap “
2. Tap “
3. Tap “
4. Tap “', 333, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How to report inappropriate or forbidden textual content?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 334, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'How to report inappropriate or forbidden image content?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 335, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to report prohibited or illegal items?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 336, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to report scams & fraud?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 337, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to report Intellectual Property (IP) infringement?', 'Intellectual Property (IP) infringement is unauthorized use of photos, branding, or copied creative assets.
Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 338, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to inform if someone infringes RoundBuy’s Intellectual Property right’s?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 339, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to inform if someone infringes RoundBuy’s patent rights?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 340, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to inform if someone infringes RoundBuy’s trademark rights?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 341, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'Where to inform if someone infringes RoundBuy’s copyrights?', 'Go here:
1. Tap “User account”
2. Tap “User settings”
3. Tap “Report content” from the headings menu.
4. Fill in the appropriate information, and give all the details requested.
5. Tap “Report content”', 342, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (25, 23, 'What happens after reporting?', 'Marketplaces review reported content using automated tools (AI, image recognition) and human moderators.
They may remove, limit access, or block the content/user, and provide statements of reason for moderation decisions, especially under regulations like the EU''s Digital Services Act (DSA).', 343, true);


-- Category: Report Content
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (26, 'Report Content', 'Report Content', 26, true);

-- Category: Moderation
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (27, 'Moderation', 'Moderation', 27, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (24, 27, 'General', 24, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'In what ways do we moderate the service? (automated, AI?, human, users)', 'RoundBuy© works constantly to improve and guarantee, that its online service is both safe to use, and free of forbidden content. We use various measures to ensure the safety, such as, automated and manual systems, preventive and responsive technologies. However, we hope also that active measure by users are taken if encountering something suspicious. Moderation in its simplest form means the removal of something harmful for example content or chat exchange.', 344, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What is forbidden, inappropriate or unpermitted content? (texts, images)', 'In general normal items can be sold on the platform, but you need to be aware what is prohibited in your country’s legislation what you cannot sell, or which require extra condition to be met. Please have a look for the following link: (link).
For more information: https://roundbuy.com/forbidden-content/', 345, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What kind of content is not for the online service?', 'The online service is not place for spreading of any ideologies, purporting hate crimes in any form, threatening, harassing, racism, as the previous and similar unacceptable, and will be directed to appropriate governmental officials. For this reason also any adult material is not presently available, and should not be advertised in any form.', 346, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What does it mean that RoundBuy© follows the sanctions of EU and USA?+', 'It means that the RoundBuy© online service are not available for Russia, Ukraine or any other country on the prohibition list of European Union. We comply and follow EUs and USAs sanctions for third countries. Therefore the use of the online service is prohibited in those countries.', 347, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What to be aware when making a product & service Ad?', 'Normal everyday items can be sold on the RoundBuy© online service. Be aware that firearms, ammunition, chemicals, animals and foods require permission for sale, and appropriate government officials should be consulted to ascertain. These items cannot be sold at the online service presently.', 348, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What to do if you find (possibly) forbidden content on an Ad or service?', 'We do our best to ensure that all the accepted advertisement are free of forbidden content, but should you encounter one, which you suspect might be such, please inform us about it, by clicking the Moderation button, or sending email and describing your suspicion. We will check it carefully, and should we find that the content reported is not forbidden, but acceptable content, we will allow it to remain, if not we will delete it from the online service, and inform the advertiser. We thank you for your attempt to make the Online service safer place for all of us. Please note the owner of the advertisement containing something forbidden, will not get any knowledge who made the moderation.', 349, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What to do if you suspect forbidden content on product chat?', 'We do our best to ensure that all the accepted advertisement are free of forbidden content, but should you encounter one, which you suspect might be such, please inform us about it, by clicking the Moderation button, or sending email and describing your suspicion. We will check it carefully, and should we find that the content reported is not forbidden, but acceptable content, we will allow it to remain, if not we will delete it from the online service, and inform the advertiser. We thank you for your attempt to make the Online service safer place for all of us. Please note the owner of the advertisement containing something forbidden, will not get any knowledge who made the moderation.', 350, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (27, 24, 'What to do if you suspect a fraud or identity theft?', 'Should you suspect a fraud in any form, or you have provided some personal information by mistake which might be compromised, we recommend you to act swiftly. You should cancel your possible bank cards, close temporarily bank account, change password or username. You should also consider informing Police if necessary. All the necessary RoundBuy© online service UserAccount details should also be changed if needed. We also always suggest informing us so we can put on hold ,a member who is not following law and the rules of the online service.', 351, true);


-- Category: Demo page
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (28, 'Demo page', 'Demo page', 28, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (25, 28, 'General', 25, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What is the main concept of RoundBuy service?', 'All happens around you, and your imprecise location. You Sell & Buy from this spot, and in addition you have
up to 5 more spots to Sell. Around you are other users with same possibilities.
You choose yourself a default location, which is your imprecise home address (e.g. 200 m away, a Square) in
a safe spot. It is also called centre-point, you search around this spot, to Buy products & services located
around you, and preferably nearby.
You choose yourself up to 5 product locations, in which you Sell or advertise your own products & services to
others around those spots. In these product locations you arrange Pick Up & Exchange of the items you have
sold to buyers.', 352, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What does it mean to search products & services around you?', 'It means you define a centre-point or default location for yourself, which is your imprecise home address.
For safety, it might be a Street’s end c. 0.5 km away. From this spot you conduct searches around you, to find what you want to Buy. Other users around you, are selling products & services, which you can Buy.', 353, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How do you advertise with Ads on the service?', 'Both private and business users can make Standard ads for free, which are for the advertising of your products & services you want to Buy & Sell etc. If you wish to get more visibility, you can purchase Visibility Ads, which duration and boosts, such as it’s reach (distance) and you can choose. With visibility ads you can get more buyers, views and clicks, and a better deal.', 354, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to access Demo page?', 'Firstly, from Registration page, as you have to choose between “Sign in” or Register” above it there is an option button “Test RoundBuy Demo”.
Secondly, after your “User account” has been verified, you are encouraged to choose membership “Choose Your Plan”, then above it, is a button “Try the demo”.
Thirdly, from the mobile app or website, tap the Hamburger menu, top right corner, and from there “Try the Demo”.', 355, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Can I access Demo page from “Sing in” or “Register” page?', 'Yes, you can from Registration page, as you have to choose between “Sign in” or Register” above it there is an option button “Test RoundBuy Demo”.
Also, after your “User account” has been verified, you are encouraged to choose membership “Choose Your Plan”, then above it, is a button “Try the Demo”.
You can also access the “Demosite” from the mobile app or website, tap the Hamburger menu, top right corner, and from there “Try the Demo”.', 356, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Can I access Demo page before I choose my Plan after registration?', 'Yes, after your “User account” has been verified, you are encouraged to choose membership “Choose Your Plan”, then above it, is a button “Try the demo”.
You can also access “Demosite” from the mobile app or website, tap the Hamburger menu, top right corner, and from there “Try the Demo”.', 357, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Can I access Demo page after getting a membership plan? (from menu???)', 'Yes, you can. is through the right upper hand corner hamburger menu, “Try the Demo”.', 358, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Where can I view the Instructions for Demo?', 'As you click the “Try the Demo”, or “Test the Demo” buttons, or if you enter through any other way to the “Demosite”, you can locate the instructions for the “Demosite” from above the map. Tap “Instructions”.', 359, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What if I click the “Instructions” button over the Map?', 'Then the Instructions for the demo and RoundBuy opens up, and yo ucan see:
1. Your default location.
2. Around you are products & services as circles.
3. These are colour coded activities.
4. Choose test city with a test location (London, Paris, New York or Tokyo).', 360, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What cities can I use as my Test cities in the Demo version?', 'The test cities with a test centre-points, are London “Trafalgar square”, Paris “Place de la Concorde”, New York “Manhattan” or Tokyo “Shibuya Square”. Each test-city shows the centre-point or default location of a user, which signifies the imprecise “home address” of the user, or you in the test.', 361, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What happens if I click “Quit and Register” at the Demop age?', 'You will be lead to either (A) to “Sign in” and “Register” page or the “Choose your plan” page after verification of account; or (B) Search-page if you are already registered. You can either start searching or you can finish off setting up your account. CHECK THIS FROM DEV where we go from this button!!!', 362, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What are the number 1, 2, 3, 4, 5 on the map?', '1. Signifies your default location (centre-point) & 1 product location.
2. Signifies your product location 2.
3. Signifies your product location 3.
4. Signifies your product location 4.
5. Signifies your product location 5.
Please note! In Green plan there are only 1x default location & 1x product location 1; while for Orange 1x default location & 3x product locations, and for Gold 1x default location & 5 x product locations.', 363, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to change the Radius ring and distance?', 'Search-page:
1. On Search-page, under the map, you can see “Distance”.
2. Tap the “Distance”, a radius slider opens up.
3. Move the white circle in the slider, to change the distance and the indicator, showing the radius e.g. 2.5 km.
4. The map view and zoom in or out level changes automatically.
Alternatively:
1. Tap “Filters” below the searchbar.
2. Tap “Distance”.
3. From there you can choose the distance in increments e.g. “2.5 km)
4. Tap “Show results”, and you can view them on them.', 364, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to change the Filters?', '1. Tap the “Filters”.
2. Tap the filter heading e.g. “Activity”, “Category-subcategory”, “Condition”, “Price” etc, or any other filter of your choice to narrow done the search results, and choose from the options provided.
3. Tap “Show results” to get to see the search results.', 365, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to view walking distance and time from your “home address” to the product?', 'On the Map
1. Tap any “Activity circle” (product) visible on the map, which are colour and letter coded.
2. A small product window opens up, on the map.
2. Tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.
On the Product Gallery
1. Tap the text “Products”, under the map, if the map is displayed,
2. On the “Product Gallery” page you can see any product displayed with a small image. Under the image, you can see walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
3. Alternatively, you can also tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
4. Under the product image you can walking “Distance” e.g. 500 m, and “Time” e.g. 10 mins.
Please note! If you scroll down the product page, you can find “Navigate to Product”.', 366, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'What happens if I click the plus (+) and minus (-) on the map?', 'By tapping the plus (+) sign you can zoom in closer on the map, or by tapping the minus (-) sign you can zoom out further on the map repsectively.', 367, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How do I get to see only products or services on Sale?', 'On the Search-page
1. Tap “Filters” below the Searchbar.
2. Tap “Activity” from the choices.', 368, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, '3. Tap “Products” or “Services” from the choices, depending on your needs. Do we want option Products or Services?', '3. Tap “Buy” and click it.
4. Then click “Show results” and you shall see the map only with products or services to “Buy”.', 369, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to change Activity (sell, buy, rent, give and Form groups)?', 'On the Search-page:
1. Tap “Filters” below the Searchbar.
2. Tap “Activity” from the choices.
3. Tap your choice of preferred activity e.g. “Sell”, “Give” or “Buy” etc.
4. Then click “Show results” and you shall see the map only with products or services to “Buy”.', 370, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to click open a product window and view a product?', 'On the Search-page
1. Tap any “Activity circle” (product) visible on the map, which are colour and letter coded.
2. A small product window opens up, on the map.
2. Tap the product title or image to open it up.
3. A full sized product page opens up, with an image, descriptives etc.
Note! If you scroll down on the Product page, you find more info and options such as “Chat” and “Make an Offer”.', 371, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to use the search-field and make adjustments?', '1. Tap on the searchbar to use the keyword search.
2. Type in a keyword e.g. “basketball”. As you write it, auto-suggestions and predictive texts, provide suggestions, which you can choose if you wish.', 372, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How can I adjust the search results with the filters?', '1. Tap the “Filters”.
2. Tap the filter heading e.g. “Activity”, “Category-subcategory”, “Condition”, “Price” etc, or any other filter of your choice to narrow done the search results, and choose from the options provided.
3. Tap “Show results” to get to see the search results.', 373, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to change the view from only Products to only Map?', 'When map is displayed at Searchpage:
1. Find under the Search-page map, a text “Products”; for both mobile app and website.
2. Tap the text “Products” under Search-page map.
3. The “Products” are now displayed without map.
Note! You can find from the bottom of the Search-page map the alternatives “Products” or “Map”!', 374, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'How to change the view from only Map to only Products?', '1. Find under the Search-page map, a text “Map”; for both mobile app and website.
2. Tap the text “Map” under Search-page map.
3. The “Map” are now displayed without products´windows.
Note! You can find from the bottom of the Search-page map the alternatives “Products” or “Map”!', 375, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 376, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (28, 25, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/demo-site/
We are always happy to help you! Email us: info@roundbuy.com
DISPUTES & LIMITATIONS', 377, true);


-- Category: Disputes and Limitations
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (29, 'Disputes and Limitations', 'Disputes and Limitations', 29, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (26, 29, 'General', 26, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Why RoundBuy doesn’t offer actual Dispute Resolution?', 'Firstly RoundBuy does not offer Dispute Resolution between users, as we do not have any escrow services or we will not have any Buyer’s payment to hold in an account before it is given to the Seller. Furthermore, we are not a third party in the exchange, which only happens between two users (mainly consumer to consumer). RoundBuy only provides the platform for advertising, and negotiating deals, and arranging meetings for pick up. All exchanges are between two parties, both private users only.', 378, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'How to avoid disputes between users?', 'Be open and clear in your communication to avoid disputes. When providing images, descriptions or any details Sellers should be precise, clear and truthful. Buyers should asks enough questions to make sure all is as is should be, and then be precise to do inspection before exchanging. Both Sellers and Buyers should communicate in writing through the chat, and maintain good relationships through proactive dealings. When problems arise, address them promptly and professionally to find a fair resolution, which can prevent escalation into formal disputes. Formal disputes are your last resort, and very expensive. In the cases', 379, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'What happens if there is dispute between users?', 'For serious issues as like scams, in addition to reporting through the app, contact your bak to secure your bank account and flag fraudulent transactions if needed.
You can indicate to second party exchange partner that you have an issue from the File an Issue” page from User account. If the product ad has been removed you can file it via “File an Issue” page, from which you can find all the past Exchanges.
1. Firstly start by clicking “I have an issue”, which will notify the other user of your dissatisfaction, and type in your reasons specified on the page questions shortly.
2. Second “Send the issue” to the other user, which will notify the second party of the issues. Now the second party writes in the answers shortly.
3. Thirdly, RoundBuy will send its Basic Dispute Resolution Guidelines to the two parties of the exchange, for their discretion to the “File an Issue” page between the two parties.
4. After 7 days consideration period, users will receive alert to action, in which they either agree to cancel the exchange and return to both parties what they exchanged, or they decide to continue dispute. (mutual benefit or further official dispute)
5. At final stage RoundBuy closes the issue on the platform: Resolution between users reached by the two parties, or Resolution not reached between two parties.
If you''re still unsatisfied, you can contact your bank or pursue legal action for serious issues, or alternatively contact police for criminal filing.', 380, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Why RoundBuy doesn’t do dispute arbitration or resolution?', 'Firstly RoundBuy does not offer Dispute Resolution between users, as we do not have any escrow services or we will not have any Buyer’s payment to hold in an account before it is given to the Seller. Furthermore, we are not a third party in the exchange, which only happens between two users (mainly consumer to consumer). RoundBuy only provides the platform for advertising, and negotiating deals, and arranging meetings for pick up. All exchanges are between two parties, both private users only.', 381, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Why Dispute resolution is between users only?', 'Furthermore, we are not a third party in the exchange, which only happens between two users (mainly consumer to consumer). RoundBuy only provides the platform for advertising, and negotiating deals, and arranging meetings for pick up. All exchanges are between two parties, both private users only.', 382, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Can RoundBuy be disputed for the failed sell or transaction?', 'No, as we are not part of the exchange in any possible way, except that we provide you a place to advertise, sell & buy, negotiate a deal, and make binding offers, and schedule exchange between users. Weare not liable for users violations , but the users are fully responsible themselves to organise these. We do not sell nor buy at the service any user products or services.', 383, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Best practices for dispute resolution?', 'The “5 Cs” approach to conflict resolution in the workplace involves five steps: 1) Clear communication to express concerns, 2) calmness to avoid escalation, 3) clarification to understand all perspectives, 4) collaboration to find common ground, and 5) compromise to reach a solution.', 384, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (29, 26, 'Where can I get more information?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/', 385, true);


-- Category: Policies
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (30, 'Policies', 'Policies', 30, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (27, 30, 'General', 27, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (30, 27, 'What policies do we have?', 'Legal & Policy updates: to view click here
We update our policies regularly, please make sure to visit the Legal page to see the most updated versions. Thank you!
All User Agreements:
Terms & Conditions PDF
Privacy Policy PDF
Cookies Policy PDF
Prohibited & Restricted Items Policy PDF
Seller Business Terms PDF
Content & Moderation Policy
Subscriptions & Billing Policy
Referral & Credits Policy PDF
End User License Agreement (EULA) PDF
Register and Record Statement PDF
Refund Policy PDF
Safe Business PDF
Safety Guidelines PDF', 386, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (30, 27, 'Where can I find policy pdates?', 'For more information on policy updates click here: https://roundbuy.com/help/', 387, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (30, 27, 'What other policies & legal documents do we have?', 'IP Rights:
Intellectual Property & Notice Policy
Intellectual Property Register & Rights Management Statement
Pending Patents & Patents:
RoundBuy patents and pending patents
Additional information:
Infringement Report Policy
These legal agreements and notices provide terms and conditions related to specific RoundBuy services.', 388, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (30, 27, 'Where can I get more information?', 'For more information on legal & policy updates click here: https://roundbuy.com/help/', 389, true);


-- Category: Legal info
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (31, 'Legal info', 'Legal info', 31, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (28, 31, 'General', 28, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (31, 28, 'What legal documents do we have?', 'Legal & Policy updates: to view click here
We update our policies regularly, please make sure to visit the Legal page to see the most updated versions. Thank you!
All User Agreements:
Terms & Conditions PDF
Privacy Policy PDF
Cookies Policy PDF
Prohibited & Restricted Items Policy PDF
Seller Business Terms PDF
Content & Moderation Policy
Subscriptions & Billing Policy
Referral & Credits Policy PDF
End User License Agreement (EULA) PDF
Register and Record Statement PDF
Refund Policy PDF', 390, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (31, 28, 'Where can I find legal & policy pdates?', 'For more information on policy updates click here: https://roundbuy.com/help/', 391, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (31, 28, 'What other policies & legal documents do we have?', 'IP Rights:
Intellectual Property & Notice Policy
Intellectua Property Register & Rights Management Statement
Pending Patents & Patents:
RoundBuy patents and pending patents
Additional information:
Infringement Report Policy', 392, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (31, 28, 'Where can I get more information?', 'For more information on legal & policy updates click here: https://roundbuy.com/help/', 393, true);


-- Category: RoundBuy Pending Patents & Patents info
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (32, 'RoundBuy Pending Patents & Patents info', 'RoundBuy Pending Patents & Patents info', 32, true);

-- Category: Tax information
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (33, 'Tax information', 'Tax information', 33, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (29, 33, 'General', 29, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'What is the VAT tax rate in the UK (20%) on goods and services?', 'The standard rate of VAT is 20% in United Kingdom. RoundBuy service collects VAT from users in accordance to this. This indirect tax is calculated b yadding 20% to the price of the goods or services.', 394, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'Why do users pay taxes after UK VAT rate? (because company resides in UK)', 'Because RoundBuy Ltd is based in United Kingdom, and has to pay taxes to UK. So we charge UK taxes from our customers in every purchase if not tax exempt.', 395, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'How much do we tax private users per payment?', 'Private users get taxed 20% of VAT on every purchase. Business users the tax rate for VAT is also 20%.', 396, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'How do I take care of local taxes?', 'In some countries you may have to pay GST (Federal Goods and Service Tax) for digital services, even though purchased from overseas service provider, and suctomer is not physically located where the services are performed. GST or Harmonized Sales tax (HST). Please find out from yout country’s tax officer Iif you need to pay local taxes in your country.', 397, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'How much do we tax company users per payment?', 'Business users the tax rate for VAT is also 20%.', 398, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'How much private and company members have to pay taxes?', 'Proivate memebrs have to pay this amount of taxes per purchase: Company members have to pay this much taxes: 20% , 5% and 0&.', 399, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (33, 29, 'Where can I get more information?', 'VAT is effectively a sales tax that businesses charge on ''taxable supplies'', such as sales of goods and services, hiring goods and commission. There are three VAT rates, standard rate, which is charged on most items and is 20%, reduced rate (5%) and zero rated (0%).
More information: https://www.gov.uk/government/organisations/hm-revenue-customs', 400, true);


-- Category: Data & Security
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (34, 'Data & Security', 'Data & Security', 34, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (30, 34, 'General', 30, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'How do we handle personal data and keep it safe?', 'Personal data is any information that, by itself or in combination with other information, may be used to identify an individual. Examples of personal information include name, home address, email address, phone number, or financial information. As explained in our Privacy Statement, we use your personal data to process payments, prevent fraud and abuse, resolve disputes, create a personalised experience, and inform you about offers, products, and services. We may also use your personal data with your consent.
We understand how important your data is to you. We''re committed to keeping it secure and in line with applicable laws and regulations, as well as industry-leading privacy standards. Rest assured that we don''t engage in selling your data.', 401, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'Where can I correct my personal data? 8Copied from paypal so change!!!)', 'You can correct your personal data in your PayPal account, such as from the account settings or your Wallet. You can also contact us to request we correct the data for you.
Personal account customers in the US, UK or European Union may access and correct their personal data following these steps:
Go to Settings.
Click Data & Privacy.
Click Correct your data.
Follow the instructions on the screen.
Personal account customers in the US, UK, or European Union may access and correct their personal data following these steps on the app:
Tap your profile icon.
Tap Data & Privacy.
Tap Correct your data.
Follow the instructions on the screen.
If you don’t have an account, you can submit a request here by clicking I can''t login or I don''t have an account. This will require verification of your identity before we can assist you.
We can only correct personal data when requested by the owner of that data or by a party authorized by the account holder.
If you want us to correct data that we''re legally required to verify, as a financial services provider we may request additional information from you to confirm your personal data. For example, a marriage license may be required to confirm a name change.
As part of any request to access or change personal data, we’ll conduct reasonable identity and verification checks to make sure you’re the account holder to ensure the security of your personal data. We reserve the right to disallow access or alteration to data if we''re unable to verify your identity, if there is a conflicting legal obligation, or if doing so would put PayPal or other parties at risk.', 402, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'What if I want to delete my personal data permanently?', 'You have the right to object to the processing of your personal data. However, if you object to the processing of your personal data for the provision of financial or other services, you may no longer be able to use some or all PayPal services. For example, you must use your real name on your account and cannot use a false name.
If you no longer want PayPal to process your data for the purposes of providing you with financial or other services, please close your account. If you close your account, PayPal will retain the data until the retention period has elapsed and there''s no other legal reason to keep it longer.
On the web:
Go to Settings.
Click Close your account under "Account options."
Click Close Account.
You can decide which emails you want us to send you and whether you want to receive promotions from our partners. You can also choose to receive emails in an HTML or plain text format.
Here''s how you can view and edit your notification emails in your account profile:
Click the Settings icon next to "Log out."
Click Notifications.
Check and uncheck the boxes according to your preference.
Here''s how to manage the notifications on the PayPal app:
Tap your profile picture.
Tap Notification preferences.
Choose which notifications you want to get in your app.', 403, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'You can acces it htorugh your own settings?????? PDF, password protect + security questions?', 'You can contact us to request a copy of your data.
Personal account customers may download their personal data following these steps:
Go to Settings.
Click Data & Privacy.
Click Download your data.
Select data options, and click Submit Request.
To access specific types of data that aren’t listed, (for example copies of interactions, IP’s, web usage data) please contact us.
Personal account customers may download their personal data following these steps in the app:
Tap your profile icon.
Tap Data & privacy.
Tap Download your data.
Select data options, and tap Submit Request.
If you don’t have an account, you can submit a request here by clicking I can''t login or I don''t have an account. This will require verification of your identity before we can assist you.
We only disclose personal data to the owner of that data or a party authorised by the account holder.
As part of any request to access or change personal data, we’ll conduct reasonable identity and verification checks to make sure you’re the account holder to ensure the security of your personal data. We reserve the right to disallow access or alteration to data if we''re unable to verify your identity, if there is a conflicting legal obligation, or if doing so would put PayPal or other parties at risk.', 404, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'In the app go to your user account and click Privacy & security: CHECK THIS FULLY???', 'Tap your profile icon.
Tap Data & privacy.
Tap Download your data PDF.
Select data options, and tap Submit Request.', 405, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'Where to manage my Privacy preferences?', 'Note this is for Paypal Privacy so change You can update your privacy settings in your PayPal Profile.
Here''s how you can manage your personal data and privacy settings:
Go to Settings.
Click Data & Privacy.
Select an available feature and edit if needed.
Here''s how you can manage your personal data and privacy settings in the app:
Tap your Profile photo.
Tap Data and privacy.
Select an available feature and edit if needed.
In ''manage your privacy settings'', you can update:
Permissions you’ve given to keep track of the data and permissions you’re sharing with the apps and sites you use.
Manage your cookies to control how PayPal uses cookies and manages your browsing experience.
Personalized offers and ads to control whether the ads and offers you see from us and our ad partners are personalised to you – see offers and promotions based on your interests.
In ''manage your data'', you can:
Download your data to get a copy of your personal data.
Correct your data to change or update your personal information.
Delete your data/ close account ask us to delete your data. To do this, we’ll also need to close your account.
The above information doesn''t apply to Business accounts.
Learn more about your privacy rights and the personal data we collect in our Privacy Statement.', 406, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'Where can I change ATT preferences (for iPhone)?', 'Note this is for Paypal Privacy so change You can update your privacy settings in your PayPal Profile.
Here''s how you can manage your personal data and privacy settings:
1. Go to Settings.
2. Click Data & Privacy.
3. Select an available feature and edit if needed.
Here''s how you can manage your personal data and privacy settings in the app:
Tap your Profile photo.
Tap Data and privacy.
Select an available feature and edit if needed.
In ''manage your privacy settings'', you can update:
Permissions you’ve given to keep track of the data and permissions you’re sharing with the apps and sites you use.
Manage your cookies to control how PayPal uses cookies and manages your browsing experience.
Personalized offers and ads to control whether the ads and offers you see from us and our ad partners are personalised to you – see offers and promotions based on your interests.
In ''manage your data'', you can:
Download your data to get a copy of your personal data.
Correct your data to change or update your personal information.
Delete your data/ close account ask us to delete your data. To do this, we’ll also need to close your account.
The above information doesn''t apply to Business accounts.Learn more about your privacy rights and the personal data we collect in our Privacy Statement.', 407, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'Where can I read Privacy Policy?', 'You can access RoundBuy Privacy Policy from herE: https://roundbuy.com/privacy/', 408, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'RoundBuy Privacy Policy?', '(RoundBuy privacy policy??? a new question perhaps) At PayPal, we put your privacy first. As a trusted global payments company, we not only protect your data, we respect it. To accomplish that, we do more than just comply with privacy regulations. We integrate a privacy-first approach mindset into all our products and services.
PayPal''s Privacy Statement describes PayPal''s information collection practices, and how we use, store, disclose, and protect that information. The Privacy Statement applies to the PayPal website and all related sites, applications, services, and tools regardless of the device or method you use to access those platforms. You accept the Privacy Statement when you sign up for, access, or use our products, services, content, features, technologies, or functions.', 409, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'How long does RoundBuy retain my data?', 'As a financial service company, PayPal is required by law to retain information related to the provision of financial services to our customers for a certain time, during which the data may not be erased. Your data may be automatically erased once the retention time has ended and there''s no other legal reason to keep it longer.
We retain data to comply with the law, prevent fraud, collect any fees owed, resolve disputes, troubleshoot problems, assist with any investigations, enforce a site''s terms and conditions, protect PayPal from legal risks, and take other actions otherwise permitted by law in the country and regions where we operate.', 410, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'How can I get my personal data erased from RoundBuy?', 'Copied from paypal so change You have the right to request that your data is deleted. PayPal will delete your personal data if it''s lawful for us to do so. As part of any request to access or change personal data, we’ll conduct reasonable identity and verification checks to make sure you’re the account holder to ensure the security of your personal data. We reserve the right to disallow access or alteration to data if we''re unable to verify your identity, if there is a conflicting legal obligation, or if doing so would put PayPal or other parties at risk.', 411, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (34, 30, 'How to get more information?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/
USER ACCOUNT', 412, true);


-- Category: Conflict Resolution between business to Consumers (B2C)
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (35, 'Conflict Resolution between business to Consumers (B2C)', 'Conflict Resolution between business to Consumers (B2C)', 35, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (31, 35, 'General', 31, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (35, 31, 'What if the product & service is not what agreed on the offer (contract)?', 'BELOW FOR Conumsumer Rights Act 2015 from business to consumer
If a product or service isn''t what was agreed upon, you have legal rights under the Consumer Rights Act 2015 to a remedy. Within 30 days, you can reject the item for a full refund. If the issue is with a service, the provider must bring it into line with what was agreed or offer a partial refund if that''s not practical. After 30 days, you can ask for a repair or replacement, and if that''s not possible or successful, you can ask for a price reduction or a full refund.
For products:
Within 30 days: You have a "short-term right to reject" the product and get a full refund if it is faulty, not as described, or not fit for purpose.
After 30 days: If the product is still faulty, you have the right to ask for a replacement or repair. If this isn''t possible or successful, you can then claim a price reduction or a full refund.
Digital content: If digital content is faulty, you are entitled to a repair or replacement. If that doesn''t work, you can ask for a price reduction, up to the full cost
For services
Reasonable care and skill: Services must be performed with "reasonable care and skill," or they must match the description and what was agreed.
Within a reasonable time: If a completion date was not agreed upon, the service must be provided within a reasonable timeframe.
Remedies: You have the right to ask the provider to redo the service or fix the problem. If this is not practical or doesn''t work, you are entitled to a partial or full refund.
CONTINUE FROM HERE!!!!!', 413, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (35, 31, 'Where can I get help?', 'You can find more answers from Customer support pages, for various topics. Additionally, if you can’t find an answer, our Customer support team is ready to help. Email us: info@roundbuy.com', 414, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (35, 31, 'Where can I find more information?', 'For more information please see: https://roundbuy.com/customer-support/
We are always happy to help you! Email us: info@roundbuy.com
USE the baove', 415, true);


-- Category: Cancellation of cards: There are various situations which could cause your
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (36, 'Cancellation of cards: There are various situations which could cause your', 'Cancellation of cards: There are various situations which could cause your', 36, true);

-- Category: Mediation: In addition when the transaction parties have dissenting opinions
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (37, 'Mediation: In addition when the transaction parties have dissenting opinions', 'Mediation: In addition when the transaction parties have dissenting opinions', 37, true);

-- Category: Criminal complaint: If however after attempts have been made to mediate
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (38, 'Criminal complaint: If however after attempts have been made to mediate', 'Criminal complaint: If however after attempts have been made to mediate', 38, true);

-- Category: Crime: In the cases a crime has been done to you or you have witnessed a
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (39, 'Crime: In the cases a crime has been done to you or you have witnessed a', 'Crime: In the cases a crime has been done to you or you have witnessed a', 39, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (32, 39, 'General', 32, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (39, 32, 'Where to find more information?', 'Contact Information
Our contact information are as follows:
RoundBuy Ltd
support@roundbuy.com', 416, true);


-- Category: Advertisements with products that cannot be sold according to the legislation of your country, or which break RoundBuy© Terms of Use, such as weapons, explosives, certain dangerous chemicals etc. (2) Advertisement which break the rights of third entity, or trademark rights for a material e.g. wrongful usage of songs, videos, text or plagiarism. (3) Advertisements with forbidden or otherwise criminalised content e.g. criminalised actions, violence, explosive or such. (4) Advertisements or discussions with harassment, threatening, racism or some other content or exchange which is offensive, or abusive towards the party you are in connection with. (5) Anything which has to do with fraud or its attempt, or phising companies or private individuals.
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (40, 'Advertisements with products that cannot be sold according to the legislation of your country, or which break RoundBuy© Terms of Use, such as weapons, explosives, certain dangerous chemicals etc. (2) Advertisement which break the rights of third entity, or trademark rights for a material e.g. wrongful usage of songs, videos, text or plagiarism. (3) Advertisements with forbidden or otherwise criminalised content e.g. criminalised actions, violence, explosive or such. (4) Advertisements or discussions with harassment, threatening, racism or some other content or exchange which is offensive, or abusive towards the party you are in connection with. (5) Anything which has to do with fraud or its attempt, or phising companies or private individuals.', 'Advertisements with products that cannot be sold according to the legislation of your country, or which break RoundBuy© Terms of Use, such as weapons, explosives, certain dangerous chemicals etc. (2) Advertisement which break the rights of third entity, or trademark rights for a material e.g. wrongful usage of songs, videos, text or plagiarism. (3) Advertisements with forbidden or otherwise criminalised content e.g. criminalised actions, violence, explosive or such. (4) Advertisements or discussions with harassment, threatening, racism or some other content or exchange which is offensive, or abusive towards the party you are in connection with. (5) Anything which has to do with fraud or its attempt, or phising companies or private individuals.', 40, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (33, 40, 'General', 33, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (40, 33, 'What are the benefits of informing possible inappropriate content?', 'RoundBuy© takes every measure to help improve the online service, but should you discover any suspicious content, please let us know about it, and inform us about it, through the moderation button of individual advertisement, or contact form so we can improve the safety even more.', 417, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (40, 33, 'What to do if you feel your Ad was deleted without acceptable reason?', 'Please write to use in person, and we shall go through the content of the advertisement or similar in detail, and in the rare instance there was a mistake of removing an advertisement please contact us, and we will help you to place the advertisement again.', 418, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (40, 33, 'Where to get more information?', '(email address: security@roundbuy.com)
For more information please read here: https://roundbuy.com/help/
DEMOSITE', 419, true);


-- Category: RoundBuy Pending Patents & Patents info new !!!!!!
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (41, 'RoundBuy Pending Patents & Patents info new !!!!!!', 'RoundBuy Pending Patents & Patents info new !!!!!!', 41, true);
INSERT INTO faq_subcategories (id, category_id, name, sort_order, is_active) VALUES (34, 41, 'General', 34, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'What is a patent?', 'A pending patent means . A granted patent is the final legal status, providing exclusive rights to the inventor to prevent others from making, using, or selling the invention.', 420, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'Where can I find more info on RoundBuy patents?', 'RoundBuy has pending patents, or filed patent application in both United Kingdom and Finalnd (for EU and International patents)
For more info on pending patents click here: https://roundbuy.com/pending-patents/
To contact Finnish Patent Registration office click here: https://www.prh.fi/en/intellectualpropertyrights/patentit.html
To contact the Intellectual Property Office (UK): https://www.gov.uk/search-for-patent', 421, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'What is the RoundBuy pending patent filed in Finland?', '1. Patent pending: RoundBuy has filed patent to the Finnish patent and Registration
Office ´(PRH, Patnetti ja rekisterihallitus (PRH). See details below.
[INSERT HERE THE NAME OF THE PATENTED PRODUCT, TRADE NAME ALSO]
[Insert brief description of your patented product here]
Title of the invetion: “Name of the patent application”
Application number: “e.g. 1223424232”
Link to Finnish Patent and Registration Office: https://www.prh.fi/en/intellectualpropertyrights/patentit.html
For more info on pending patents click here: https://roundbuy.com/pending-patents/
To contact Finnish Patent Registration office click here: https://www.prh.fi/en/intellectualpropertyrights/patentit.html', 422, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'What is the RoundBuy pending patent filed in united Kingdom?', '2. Patent pending: RoundBuy has filed patent to the Intellectual Property Office. See details below.
[INSERT HERE THE NAME OF THE PATENTED PRODUCT, TRADE NAME ALSO]
[Insert brief description of your patented product here]
Title of the invetion: “Name of the patent application”
Application number: “e.g. 1223424232”
Links to the Intellectual Property Office (in UK):
https://www.gov.uk/search-for-patent
For more info on pending patents click here: https://roundbuy.com/pending-patents/
To contact the Intellectual Property Office (in UK):
https://www.gov.uk/search-for-patent', 423, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'Infringement and stealing?', 'Please contact us, so our team of lawyer’s can start the proactive legal measures, in the cases you suspect there has been infringement of RoundBuy’s IP rights.
A patent pending status doe not allow RoundBuy to sue for infringement, but as the patent is granted we will sue any infringers; copying RoundBuy’s invention is technically "stealing" but not legally actionable "infringement" until the patent is issued. As the patent is granted we will sue infringers retrospectively from filing date onwards. If copying or stealing RoundBuy invention, you risk loosing all revenue gathered from the date of filing to RoundBuy. We shall take proactive steps immediately as our team of lawyer’s find out of possible infringement, we shall also sue promptly as the patent is granted.', 424, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'Please refer to RoundBuy mobile app guide book for user manual of the service?', 'This simplified user manual shows the RoundBuy mobile app, and it’s main features in a PDF file with copyright. Please download it and see how the mobile essentially functions.', 425, true);
INSERT INTO faqs (category_id, subcategory_id, question, answer, sort_order, is_active) VALUES (41, 34, 'What other protected IP rights RoundBuy has?', 'RoundBuy has: Copyrights (c), trademarks (r), patents (pending or patents mark). These are all RoundBuy immaterial porperty, and we own all rights to their use.
(NEW) Patent pending page
On this page you can find information on RoundBuy pending patents and patents.
We indicate clearly on our website, mbile apps and services the status “Pending Patent” or “Patent Applied for” or with similar phrasing to notify others that a patent application has been filed.
We shall update the “Patent Pending” status to “patent” once the patent is granted.
Note “Aptent pending” is a notice and while patent pending provides no legal protection on its own. What it does it puts competitors on notice that a ptent I being pursued for the invention and that they could be sued for infringement if they copy the invention and the patent is eventually granted.
FINNISH PATENT PENDING (EU, International)
1. Patent pending: RoundBuy has filed patent to the Finnish patent and Registration Office ´(PRH, Patnetti ja rekisterihallitus (PRH). See details below.
[INSERT HERE THE NAME OF THE PATENTED PRODUCT, TRADE NAME ALSO]
[Insert brief description of your patented product here]
Title of the invetion: “Name of the patent application”
Application number: “e.g. 1223424232”
Link to Finnish Patent and Registration Office: https://www.prh.fi/en/intellectualpropertyrights/patentit.html
Additoonal details:
Description what the app does:
Link to official website: https://roundbuy.com
Procedurial updates:
1. Patent applied and filed for 30.09.2025
2.
Date becoming public: it will become public after 18 months (Priority date) ­from the filing date (if it has not been cancelled or rejected). This date is: april/may 2027.
UK PATENT PENDING
2. Patent pending: RoundBuy has filed patent to the Intellectual Property Office. See details below.
[INSERT HERE THE NAME OF THE PATENTED PRODUCT, TRADE NAME ALSO]
[Insert brief description of your patented product here]
Title of the invetion: “Name of the patent application”
Application number: “e.g. 1223424232”
the Intellectual Property Office:
https://www.gov.uk/search-for-patent
Additoonal details:
Description what the app does:
Link to official website: https://roundbuy.com
Procedurial updates:
1. Patent applied and filed for 31.12.2025
Date becoming public: it will become public after 18 months (Priority date) from the filing date (if it has not been cancelled or rejected). This date is: july 2027.
If the patent(s) will be granted, the protection begins from the date of filing, which means possible infringers and infringement will be liable to RoundBuy from that date onwards if using the protected invention in business activities.
For RoundBuy the invention, for which patent has been filed, forms the essential component of its activities and businessm odel and concept.
Once an inventor has filed a patent application with the Patent office, he can claim patent pending status for the invention,whcih starts immediately.
Once the “Patent pending” hs been approved by the Patent Office, you must change the patent pending marking status on the website, mobile app and service so the current state of your patent is reflected.
We will update patent page regularly. For more information on RoundBuy pending patents please get in touch!
For more on EU patents:
https://europa.eu/youreurope/business/running-business/intellectual-property/patents/index_en.htm
For more on International patents:
https://patentscope.wipo.int/search/en/search.jsf
For more on Finnish patents:
https://www.prh.fi/en/intellectualpropertyrights/patentit.html
For more on UK patents:
https://www.gov.uk/government/collections/intellectual-property-patents
Email to us: patents@roundbuy.com', 426, true);


-- Category: RoundBuy App Guide (for copyright purposes to protect the design)
INSERT INTO faq_categories (id, name, description, sort_order, is_active) VALUES (42, 'RoundBuy App Guide (for copyright purposes to protect the design)', 'RoundBuy App Guide (for copyright purposes to protect the design)', 42, true);
