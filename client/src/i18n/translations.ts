export const translations = {
  it: {
    // Navigation
    'nav.goals': 'Obiettivi',
    'nav.marketing': 'Marketing',
    'nav.social': 'Collega Social',
    'nav.crm': 'Commerciale',
    'nav.tasks': 'Attività',
    'nav.marketplace': 'Marketplace',
    'nav.vendor': 'Vendor Console',
    'nav.notifications': 'Notifiche',
    'nav.chat': 'Chat',
    'nav.settings': 'Impostazioni',
    
    // Header
    'header.settings': 'Impostazioni',
    'header.notifications': 'Notifiche',
    'header.feedback': 'Feedback',
    'header.help': 'Assistenza',
    'header.account': 'Account',
    'header.profile': 'Profilo',
    'header.logout': 'Logout',
    
    // Common
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.create': 'Crea',
    'common.search': 'Cerca',
    'common.filter': 'Filtra',
    'common.export': 'Esporta',
    'common.import': 'Importa',
    'common.close': 'Chiudi',
    'common.open': 'Apri',
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    
    // Accessibility
    'a11y.skipToMain': 'Vai al contenuto principale',
    'a11y.openMenu': 'Apri menu di navigazione',
    'a11y.closeMenu': 'Chiudi menu di navigazione',
    'a11y.mainNav': 'Navigazione principale',
    
    // Settings
    'settings.title': 'Impostazioni',
    'settings.general': 'Generale',
    'settings.language': 'Lingua',
    'settings.selectLanguage': 'Seleziona lingua',
    'settings.theme': 'Tema',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifiche',
    'settings.billing': 'Fatturazione',
    
    // Languages
    'lang.it': 'Italiano',
    'lang.en': 'English',
  },
  en: {
    // Navigation
    'nav.goals': 'Goals',
    'nav.marketing': 'Marketing',
    'nav.social': 'Connect Social',
    'nav.crm': 'Sales',
    'nav.tasks': 'Tasks',
    'nav.marketplace': 'Marketplace',
    'nav.vendor': 'Vendor Console',
    'nav.notifications': 'Notifications',
    'nav.chat': 'Chat',
    'nav.settings': 'Settings',
    
    // Header
    'header.settings': 'Settings',
    'header.notifications': 'Notifications',
    'header.feedback': 'Feedback',
    'header.help': 'Help',
    'header.account': 'Account',
    'header.profile': 'Profile',
    'header.logout': 'Logout',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Accessibility
    'a11y.skipToMain': 'Skip to main content',
    'a11y.openMenu': 'Open navigation menu',
    'a11y.closeMenu': 'Close navigation menu',
    'a11y.mainNav': 'Main navigation',
    
    // Settings
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select language',
    'settings.theme': 'Theme',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifications',
    'settings.billing': 'Billing',
    
    // Languages
    'lang.it': 'Italiano',
    'lang.en': 'English',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.it;
