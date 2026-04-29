import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Built-in platform translations
const resources = {
  en: {
    translation: {
      // Auth
      'auth.login': 'Sign In',
      'auth.register': 'Create Account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.name': 'Full Name',
      'auth.submit': 'Continue',
      'auth.logout': 'Sign Out',
      'auth.noAccount': "Don't have an account?",
      'auth.hasAccount': 'Already have an account?',
      // Nav
      'nav.apps': 'My Apps',
      'nav.create': 'New App',
      'nav.settings': 'Settings',
      'nav.profile': 'Profile',
      // Apps
      'apps.title': 'My Applications',
      'apps.empty': 'No apps yet. Create your first app!',
      'apps.create': 'Create App',
      'apps.created': 'App created successfully',
      'apps.deleted': 'App deleted',
      // Table
      'table.noData': 'No records found',
      'table.loading': 'Loading...',
      'table.add': 'Add Record',
      'table.edit': 'Edit',
      'table.delete': 'Delete',
      'table.confirm': 'Are you sure?',
      // Form
      'form.save': 'Save',
      'form.cancel': 'Cancel',
      'form.required': 'This field is required',
      'form.saved': 'Saved successfully',
      // CSV
      'csv.import': 'Import CSV',
      'csv.preview': 'Preview',
      'csv.mapping': 'Map Fields',
      'csv.importing': 'Importing...',
      'csv.success': '{{count}} records imported',
      // Notifications
      'notif.title': 'Notifications',
      'notif.markAll': 'Mark all read',
      'notif.empty': 'No notifications',
      // Errors
      'error.generic': 'Something went wrong',
      'error.notFound': 'Not found',
      'error.unauthorized': 'Please log in',
    },
  },
  hi: {
    translation: {
      'auth.login': 'साइन इन करें',
      'auth.register': 'खाता बनाएं',
      'auth.email': 'ईमेल',
      'auth.password': 'पासवर्ड',
      'auth.name': 'पूरा नाम',
      'auth.submit': 'जारी रखें',
      'auth.logout': 'साइन आउट',
      'auth.noAccount': 'खाता नहीं है?',
      'auth.hasAccount': 'पहले से खाता है?',
      'nav.apps': 'मेरे ऐप्स',
      'nav.create': 'नया ऐप',
      'nav.settings': 'सेटिंग्स',
      'nav.profile': 'प्रोफाइल',
      'apps.title': 'मेरे एप्लिकेशन',
      'apps.empty': 'अभी तक कोई ऐप नहीं। पहला ऐप बनाएं!',
      'apps.create': 'ऐप बनाएं',
      'table.noData': 'कोई रिकॉर्ड नहीं मिला',
      'table.loading': 'लोड हो रहा है...',
      'table.add': 'रिकॉर्ड जोड़ें',
      'table.edit': 'संपादित करें',
      'table.delete': 'हटाएं',
      'form.save': 'सहेजें',
      'form.cancel': 'रद्द करें',
      'form.required': 'यह फ़ील्ड आवश्यक है',
      'csv.import': 'CSV आयात करें',
      'error.generic': 'कुछ गलत हो गया',
    },
  },
  es: {
    translation: {
      'auth.login': 'Iniciar sesión',
      'auth.register': 'Crear cuenta',
      'auth.email': 'Correo electrónico',
      'auth.password': 'Contraseña',
      'auth.name': 'Nombre completo',
      'auth.submit': 'Continuar',
      'auth.logout': 'Cerrar sesión',
      'nav.apps': 'Mis Apps',
      'nav.create': 'Nueva App',
      'apps.title': 'Mis Aplicaciones',
      'apps.empty': 'Aún no hay apps. ¡Crea tu primera!',
      'apps.create': 'Crear App',
      'table.noData': 'No se encontraron registros',
      'table.loading': 'Cargando...',
      'table.add': 'Agregar registro',
      'table.edit': 'Editar',
      'table.delete': 'Eliminar',
      'form.save': 'Guardar',
      'form.cancel': 'Cancelar',
      'error.generic': 'Algo salió mal',
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: typeof window !== 'undefined' ? (localStorage.getItem('af_locale') || 'en') : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function addAppTranslations(appI18n: { supportedLocales: string[]; translations?: Record<string, Record<string, string>> }) {
  if (!appI18n.translations) return;
  for (const [locale, translations] of Object.entries(appI18n.translations)) {
    if (i18n.hasResourceBundle(locale, 'translation')) {
      i18n.addResourceBundle(locale, 'translation', translations, true, true);
    } else {
      i18n.addResourceBundle(locale, 'translation', translations, false, false);
    }
  }
}
