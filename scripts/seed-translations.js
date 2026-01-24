const { promisePool } = require('../src/config/database');

/**
 * Seed Translation Keys and Translations
 * Populates translation_keys and translations tables with 100+ common app strings
 * Categories: auth, home, products, chat, profile, settings, common, errors, success, subscription, ads, filter, sort
 * Languages: English (en), Hindi (hi), Spanish (es), French (fr)
 */

// Translation data - flattened structure
const translationData = {
    // ==================== AUTHENTICATION (13 keys) ====================
    'auth.login': { en: 'Login', hi: 'लॉगिन', es: 'Iniciar sesión', fr: 'Connexion' },
    'auth.register': { en: 'Register', hi: 'रजिस्टर करें', es: 'Registrarse', fr: 'S\'inscrire' },
    'auth.email': { en: 'Email', hi: 'ईमेल', es: 'Correo electrónico', fr: 'E-mail' },
    'auth.password': { en: 'Password', hi: 'पासवर्ड', es: 'Contraseña', fr: 'Mot de passe' },
    'auth.confirm_password': { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें', es: 'Confirmar contraseña', fr: 'Confirmer le mot de passe' },
    'auth.full_name': { en: 'Full Name', hi: 'पूरा नाम', es: 'Nombre completo', fr: 'Nom complet' },
    'auth.phone': { en: 'Phone Number', hi: 'फ़ोन नंबर', es: 'Número de teléfono', fr: 'Numéro de téléphone' },
    'auth.forgot_password': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?', es: '¿Olvidaste tu contraseña?', fr: 'Mot de passe oublié?' },
    'auth.reset_password': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करें', es: 'Restablecer contraseña', fr: 'Réinitialiser le mot de passe' },
    'auth.logout': { en: 'Logout', hi: 'लॉगआउट', es: 'Cerrar sesión', fr: 'Déconnexion' },
    'auth.sign_in': { en: 'Sign In', hi: 'साइन इन करें', es: 'Iniciar sesión', fr: 'Se connecter' },
    'auth.sign_up': { en: 'Sign Up', hi: 'साइन अप करें', es: 'Registrarse', fr: 'S\'inscrire' },
    'auth.verify_email': { en: 'Verify Email', hi: 'ईमेल सत्यापित करें', es: 'Verificar correo', fr: 'Vérifier l\'e-mail' },

    // ==================== HOME (5 keys) ====================
    'home.welcome': { en: 'Welcome to RoundBuy', hi: 'RoundBuy में आपका स्वागत है', es: 'Bienvenido a RoundBuy', fr: 'Bienvenue sur RoundBuy' },
    'home.search_placeholder': { en: 'Search for products...', hi: 'उत्पाद खोजें...', es: 'Buscar productos...', fr: 'Rechercher des produits...' },
    'home.featured': { en: 'Featured Products', hi: 'विशेष उत्पाद', es: 'Productos destacados', fr: 'Produits en vedette' },
    'home.categories': { en: 'Categories', hi: 'श्रेणियाँ', es: 'Categorías', fr: 'Catégories' },
    'home.new_arrivals': { en: 'New Arrivals', hi: 'नए आगमन', es: 'Nuevos productos', fr: 'Nouveautés' },

    // ==================== PRODUCTS (12 keys) ====================
    'products.search': { en: 'Search', hi: 'खोजें', es: 'Buscar', fr: 'Rechercher' },
    'products.filter': { en: 'Filter', hi: 'फ़िल्टर', es: 'Filtrar', fr: 'Filtrer' },
    'products.sort': { en: 'Sort By', hi: 'क्रमबद्ध करें', es: 'Ordenar por', fr: 'Trier par' },
    'products.price': { en: 'Price', hi: 'कीमत', es: 'Precio', fr: 'Prix' },
    'products.condition': { en: 'Condition', hi: 'स्थिति', es: 'Condición', fr: 'État' },
    'products.location': { en: 'Location', hi: 'स्थान', es: 'Ubicación', fr: 'Emplacement' },
    'products.description': { en: 'Description', hi: 'विवरण', es: 'Descripción', fr: 'Description' },
    'products.seller': { en: 'Seller', hi: 'विक्रेता', es: 'Vendedor', fr: 'Vendeur' },
    'products.contact_seller': { en: 'Contact Seller', hi: 'विक्रेता से संपर्क करें', es: 'Contactar vendedor', fr: 'Contacter le vendeur' },
    'products.add_to_favorites': { en: 'Add to Favorites', hi: 'पसंदीदा में जोड़ें', es: 'Añadir a favoritos', fr: 'Ajouter aux favoris' },
    'products.share': { en: 'Share', hi: 'साझा करें', es: 'Compartir', fr: 'Partager' },
    'products.report': { en: 'Report', hi: 'रिपोर्ट करें', es: 'Reportar', fr: 'Signaler' },

    // ==================== CHAT (6 keys) ====================
    'chat.messages': { en: 'Messages', hi: 'संदेश', es: 'Mensajes', fr: 'Messages' },
    'chat.send_message': { en: 'Send Message', hi: 'संदेश भेजें', es: 'Enviar mensaje', fr: 'Envoyer un message' },
    'chat.type_message': { en: 'Type a message...', hi: 'संदेश लिखें...', es: 'Escribe un mensaje...', fr: 'Tapez un message...' },
    'chat.online': { en: 'Online', hi: 'ऑनलाइन', es: 'En línea', fr: 'En ligne' },
    'chat.offline': { en: 'Offline', hi: 'ऑफ़लाइन', es: 'Desconectado', fr: 'Hors ligne' },
    'chat.typing': { en: 'Typing...', hi: 'टाइप कर रहे हैं...', es: 'Escribiendo...', fr: 'En train d\'écrire...' },

    // ==================== PROFILE (7 keys) ====================
    'profile.my_profile': { en: 'My Profile', hi: 'मेरी प्रोफ़ाइल', es: 'Mi perfil', fr: 'Mon profil' },
    'profile.edit_profile': { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें', es: 'Editar perfil', fr: 'Modifier le profil' },
    'profile.my_ads': { en: 'My Advertisements', hi: 'मेरे विज्ञापन', es: 'Mis anuncios', fr: 'Mes annonces' },
    'profile.favorites': { en: 'Favorites', hi: 'पसंदीदा', es: 'Favoritos', fr: 'Favoris' },
    'profile.settings': { en: 'Settings', hi: 'सेटिंग्स', es: 'Configuración', fr: 'Paramètres' },
    'profile.subscription': { en: 'Subscription', hi: 'सदस्यता', es: 'Suscripción', fr: 'Abonnement' },
    'profile.notifications': { en: 'Notifications', hi: 'सूचनाएं', es: 'Notificaciones', fr: 'Notifications' },

    // ==================== SETTINGS (6 keys) ====================
    'settings.language': { en: 'Language', hi: 'भाषा', es: 'Idioma', fr: 'Langue' },
    'settings.currency': { en: 'Currency', hi: 'मुद्रा', es: 'Moneda', fr: 'Devise' },
    'settings.theme': { en: 'Theme', hi: 'थीम', es: 'Tema', fr: 'Thème' },
    'settings.privacy': { en: 'Privacy', hi: 'गोपनीयता', es: 'Privacidad', fr: 'Confidentialité' },
    'settings.terms': { en: 'Terms & Conditions', hi: 'नियम और शर्तें', es: 'Términos y condiciones', fr: 'Termes et conditions' },
    'settings.help': { en: 'Help & Support', hi: 'सहायता और समर्थन', es: 'Ayuda y soporte', fr: 'Aide et support' },

    // ==================== COMMON ACTIONS (15 keys) ====================
    'common.save': { en: 'Save', hi: 'सहेजें', es: 'Guardar', fr: 'Enregistrer' },
    'common.cancel': { en: 'Cancel', hi: 'रद्द करें', es: 'Cancelar', fr: 'Annuler' },
    'common.delete': { en: 'Delete', hi: 'हटाएं', es: 'Eliminar', fr: 'Supprimer' },
    'common.edit': { en: 'Edit', hi: 'संपादित करें', es: 'Editar', fr: 'Modifier' },
    'common.update': { en: 'Update', hi: 'अपडेट करें', es: 'Actualizar', fr: 'Mettre à jour' },
    'common.submit': { en: 'Submit', hi: 'जमा करें', es: 'Enviar', fr: 'Soumettre' },
    'common.confirm': { en: 'Confirm', hi: 'पुष्टि करें', es: 'Confirmar', fr: 'Confirmer' },
    'common.close': { en: 'Close', hi: 'बंद करें', es: 'Cerrar', fr: 'Fermer' },
    'common.back': { en: 'Back', hi: 'वापस', es: 'Atrás', fr: 'Retour' },
    'common.next': { en: 'Next', hi: 'अगला', es: 'Siguiente', fr: 'Suivant' },
    'common.previous': { en: 'Previous', hi: 'पिछला', es: 'Anterior', fr: 'Précédent' },
    'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...', es: 'Cargando...', fr: 'Chargement...' },
    'common.yes': { en: 'Yes', hi: 'हाँ', es: 'Sí', fr: 'Oui' },
    'common.no': { en: 'No', hi: 'नहीं', es: 'No', fr: 'Non' },
    'common.ok': { en: 'OK', hi: 'ठीक है', es: 'Aceptar', fr: 'OK' },

    // ==================== ERRORS (7 keys) ====================
    'error.required_field': { en: 'This field is required', hi: 'यह फ़ील्ड आवश्यक है', es: 'Este campo es obligatorio', fr: 'Ce champ est obligatoire' },
    'error.invalid_email': { en: 'Invalid email address', hi: 'अमान्य ईमेल पता', es: 'Dirección de correo no válida', fr: 'Adresse e-mail invalide' },
    'error.password_mismatch': { en: 'Passwords do not match', hi: 'पासवर्ड मेल नहीं खाते', es: 'Las contraseñas no coinciden', fr: 'Les mots de passe ne correspondent pas' },
    'error.network': { en: 'Network error. Please try again.', hi: 'नेटवर्क त्रुटि। कृपया पुन: प्रयास करें।', es: 'Error de red. Inténtalo de nuevo.', fr: 'Erreur réseau. Veuillez réessayer.' },
    'error.server': { en: 'Server error. Please try again later.', hi: 'सर्वर त्रुटि। कृपया बाद में पुन: प्रयास करें।', es: 'Error del servidor. Inténtalo más tarde.', fr: 'Erreur serveur. Réessayez plus tard.' },
    'error.not_found': { en: 'Not found', hi: 'नहीं मिला', es: 'No encontrado', fr: 'Introuvable' },
    'error.unauthorized': { en: 'Unauthorized access', hi: 'अनधिकृत पहुंच', es: 'Acceso no autorizado', fr: 'Accès non autorisé' },

    // ==================== SUCCESS MESSAGES (4 keys) ====================
    'success.saved': { en: 'Saved successfully', hi: 'सफलतापूर्वक सहेजा गया', es: 'Guardado exitosamente', fr: 'Enregistré avec succès' },
    'success.updated': { en: 'Updated successfully', hi: 'सफलतापूर्वक अपडेट किया गया', es: 'Actualizado exitosamente', fr: 'Mis à jour avec succès' },
    'success.deleted': { en: 'Deleted successfully', hi: 'सफलतापूर्वक हटाया गया', es: 'Eliminado exitosamente', fr: 'Supprimé avec succès' },
    'success.sent': { en: 'Sent successfully', hi: 'सफलतापूर्वक भेजा गया', es: 'Enviado exitosamente', fr: 'Envoyé avec succès' },

    // ==================== SUBSCRIPTION (5 keys) ====================
    'subscription.plans': { en: 'Subscription Plans', hi: 'सदस्यता योजनाएं', es: 'Planes de suscripción', fr: 'Plans d\'abonnement' },
    'subscription.upgrade': { en: 'Upgrade Plan', hi: 'योजना अपग्रेड करें', es: 'Mejorar plan', fr: 'Mettre à niveau' },
    'subscription.current': { en: 'Current Plan', hi: 'वर्तमान योजना', es: 'Plan actual', fr: 'Plan actuel' },
    'subscription.expires': { en: 'Expires on', hi: 'समाप्त होता है', es: 'Expira el', fr: 'Expire le' },
    'subscription.renew': { en: 'Renew', hi: 'नवीनीकरण करें', es: 'Renovar', fr: 'Renouveler' },

    // ==================== ADVERTISEMENTS (9 keys) ====================
    'ads.create': { en: 'Create Advertisement', hi: 'विज्ञापन बनाएं', es: 'Crear anuncio', fr: 'Créer une annonce' },
    'ads.title': { en: 'Title', hi: 'शीर्षक', es: 'Título', fr: 'Titre' },
    'ads.category': { en: 'Category', hi: 'श्रेणी', es: 'Categoría', fr: 'Catégorie' },
    'ads.images': { en: 'Images', hi: 'चित्र', es: 'Imágenes', fr: 'Images' },
    'ads.upload_images': { en: 'Upload Images', hi: 'चित्र अपलोड करें', es: 'Subir imágenes', fr: 'Télécharger des images' },
    'ads.publish': { en: 'Publish', hi: 'प्रकाशित करें', es: 'Publicar', fr: 'Publier' },
    'ads.draft': { en: 'Save as Draft', hi: 'ड्राफ्ट के रूप में सहेजें', es: 'Guardar como borrador', fr: 'Enregistrer comme brouillon' },
    'ads.status': { en: 'Status', hi: 'स्थिति', es: 'Estado', fr: 'Statut' },
    'ads.views': { en: 'Views', hi: 'दृश्य', es: 'Vistas', fr: 'Vues' },

    // ==================== FILTERS (5 keys) ====================
    'filter.price_range': { en: 'Price Range', hi: 'मूल्य सीमा', es: 'Rango de precio', fr: 'Fourchette de prix' },
    'filter.min_price': { en: 'Min Price', hi: 'न्यूनतम मूल्य', es: 'Precio mínimo', fr: 'Prix minimum' },
    'filter.max_price': { en: 'Max Price', hi: 'अधिकतम मूल्य', es: 'Precio máximo', fr: 'Prix maximum' },
    'filter.apply': { en: 'Apply Filters', hi: 'फ़िल्टर लागू करें', es: 'Aplicar filtros', fr: 'Appliquer les filtres' },
    'filter.clear': { en: 'Clear Filters', hi: 'फ़िल्टर साफ़ करें', es: 'Limpiar filtros', fr: 'Effacer les filtres' },

    // ==================== SORT OPTIONS (5 keys) ====================
    'sort.newest': { en: 'Newest First', hi: 'नवीनतम पहले', es: 'Más reciente primero', fr: 'Plus récent d\'abord' },
    'sort.oldest': { en: 'Oldest First', hi: 'सबसे पुराना पहले', es: 'Más antiguo primero', fr: 'Plus ancien d\'abord' },
    'sort.price_low': { en: 'Price: Low to High', hi: 'कीमत: कम से अधिक', es: 'Precio: Menor a Mayor', fr: 'Prix: Croissant' },
    'sort.price_high': { en: 'Price: High to Low', hi: 'कीमत: अधिक से कम', es: 'Precio: Mayor a Menor', fr: 'Prix: Décroissant' },
    'sort.popular': { en: 'Most Popular', hi: 'सबसे लोकप्रिय', es: 'Más popular', fr: 'Plus populaire' }
};

async function seedTranslations() {
    try {
        console.log('🌍 Starting translation seeding...\n');

        // Get all languages
        const [languages] = await promisePool.query(
            'SELECT id, code, name FROM languages WHERE is_active = TRUE'
        );

        if (languages.length === 0) {
            console.error('❌ No active languages found. Please seed languages first.');
            process.exit(1);
        }

        console.log(`✅ Found ${languages.length} active languages:`);
        languages.forEach(lang => console.log(`   - ${lang.name} (${lang.code})`));
        console.log('');

        // Create language map
        const languageMap = {};
        languages.forEach(lang => {
            languageMap[lang.code] = lang.id;
        });

        let keysAdded = 0;
        let translationsAdded = 0;
        let keysSkipped = 0;

        const totalKeys = Object.keys(translationData).length;
        console.log(`📝 Processing ${totalKeys} translation keys...\n`);

        // Process each translation key
        for (const [fullKey, translations] of Object.entries(translationData)) {
            // Extract category from key (e.g., 'auth.login' -> 'auth')
            const category = fullKey.split('.')[0];
            const keyName = fullKey;
            const defaultText = translations.en;

            // Check if key already exists
            const [existingKeys] = await promisePool.query(
                'SELECT id FROM translation_keys WHERE key_name = ?',
                [keyName]
            );

            let keyId;

            if (existingKeys.length > 0) {
                keyId = existingKeys[0].id;
                keysSkipped++;
            } else {
                // Insert translation key
                const [result] = await promisePool.query(
                    `INSERT INTO translation_keys (key_name, category, default_text, description)
           VALUES (?, ?, ?, ?)`,
                    [keyName, category, defaultText, `Translation for ${keyName}`]
                );
                keyId = result.insertId;
                keysAdded++;

                if (keysAdded % 10 === 0) {
                    process.stdout.write(`   Processed ${keysAdded}/${totalKeys} keys...\r`);
                }
            }

            // Insert translations for each language
            for (const [langCode, translatedText] of Object.entries(translations)) {
                const languageId = languageMap[langCode];

                if (!languageId) {
                    continue;
                }

                // Check if translation already exists
                const [existingTrans] = await promisePool.query(
                    'SELECT id FROM translations WHERE translation_key_id = ? AND language_id = ?',
                    [keyId, languageId]
                );

                if (existingTrans.length === 0) {
                    await promisePool.query(
                        `INSERT INTO translations (translation_key_id, language_id, translated_text, is_auto_translated)
             VALUES (?, ?, ?, ?)`,
                        [keyId, languageId, translatedText, false]
                    );
                    translationsAdded++;
                }
            }
        }

        console.log('\n');
        console.log('='.repeat(60));
        console.log('✅ Translation seeding completed!');
        console.log('='.repeat(60));
        console.log(`📊 Summary:`);
        console.log(`   Translation Keys Added: ${keysAdded}`);
        console.log(`   Translation Keys Skipped: ${keysSkipped}`);
        console.log(`   Translations Added: ${translationsAdded}`);
        console.log(`   Total Keys: ${totalKeys}`);
        console.log('');

        // Show category breakdown
        const categories = {};
        Object.keys(translationData).forEach(key => {
            const category = key.split('.')[0];
            categories[category] = (categories[category] || 0) + 1;
        });

        console.log('📋 Keys by Category:');
        Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`   ${cat.padEnd(15)}: ${count} keys`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ Error seeding translations:', error);
        throw error;
    } finally {
        await promisePool.end();
        process.exit();
    }
}

seedTranslations();
