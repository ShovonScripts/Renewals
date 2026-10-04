export const en = {
  // Tabs
  'tabs.upcoming': 'Upcoming',
  'tabs.all': 'All',
  'tabs.subscriptions': 'Subscriptions',
  'tabs.settings': 'Settings',

  // Categories
  'category.passport': 'Passport',
  'category.visa': 'Visa',
  'category.license': 'License',
  'category.id_card': 'ID Card',
  'category.vehicle': 'Vehicle',
  'category.insurance': 'Insurance',
  'category.subscription': 'Subscription',
  'category.warranty': 'Warranty',
  'category.domain_hosting': 'Domain & Hosting',
  'category.other': 'Other',

  // Billing cycles
  'billing.none': 'One-time',
  'billing.weekly': 'Weekly',
  'billing.monthly': 'Monthly',
  'billing.yearly': 'Yearly',

  // Buckets & Status
  'bucket.overdue': 'Overdue',
  'bucket.today': 'Due Today',
  'bucket.next7': 'Next 7 Days',
  'bucket.next30': 'Next 30 Days',
  'bucket.later': 'Later',
  'status.active': 'Active',
  'status.archived': 'Archived',

  // Common actions & labels
  'common.add': 'Add',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.search': 'Search items...',
  'common.filter': 'Filter',
  'common.back': 'Back',
  'common.renew': 'Renew',
  'common.archive': 'Archive',
  'common.restore': 'Restore',
  'common.confirm': 'Confirm',
  'common.notes': 'Notes',
  'common.amount': 'Cost',
  'common.daysLeft': '{count} days left',
  'common.dayLeft': '1 day left',
  'common.overdueDays': '{count} days overdue',
  'common.overdueDay': '1 day overdue',
  'common.today': 'Due today',

  // Home / Upcoming
  'home.title': 'Renewals',
  'home.overdueCount': '{count} items overdue',
  'home.emptyTitle': 'No upcoming renewals',
  'home.emptySubtitle': 'Tap + to add your first passport, subscription or warranty.',
  'home.permissionBanner': 'Notifications are disabled. Tap to enable reminders.',

  // All items
  'all.title': 'All Items',
  'all.empty': 'No items found',

  // Subscriptions
  'subscriptions.title': 'Subscriptions',
  'subscriptions.monthlyTotal': 'Monthly Total',
  'subscriptions.yearlyTotal': 'Yearly Total',
  'subscriptions.empty': 'No active subscriptions with cost.',
  'subscriptions.emptySubtitle': 'Add subscriptions with cost and billing cycle to track monthly and yearly spending.',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.currencyCode': 'Currency Code',
  'settings.currencySymbol': 'Currency Symbol',
  'settings.notifyHour': 'Notification Hour (0-23)',
  'settings.theme': 'Theme',
  'settings.themeSystem': 'System',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.backup': 'Backup and Restore',
  'settings.helpReminders': 'Not getting reminders?',
  'settings.about': 'About Renewals',
  'settings.testNotification': 'Send test notification in 10s',

  // Add / Edit item
  'item.newTitle': 'Add Item',
  'item.editTitle': 'Edit Item',
  'item.titleLabel': 'Title',
  'item.categoryLabel': 'Category',
  'item.expiresOnLabel': 'Expiry Date (YYYY-MM-DD)',
  'item.reminderDaysLabel': 'Reminder Days (comma separated)',
  'item.costsMoney': 'This costs money',
  'item.billingCycleLabel': 'Billing Cycle',
  'item.autoRenewsLabel': 'Auto-renews',
  'item.notesPlaceholder': 'Avoid entering ID numbers...',
  'item.attachmentsLabel': 'Photos (max 3)',
  'item.titleRequired': 'Title is required (1-60 chars)',
  'item.dateRequired': 'Valid expiry date (YYYY-MM-DD) is required',

  // Item detail
  'detail.title': 'Item Details',
  'detail.history': 'Renewal History',
  'detail.deleteConfirm': 'Delete this item and its reminders?',
  'detail.archiveConfirm': 'Archive this item?',

  // Renew modal
  'renew.title': 'Mark as Renewed',
  'renew.newExpiry': 'New Expiry Date',

  // Backup screen
  'backup.title': 'Backup and Restore',
  'backup.export': 'Export Backup (JSON)',
  'backup.import': 'Import Backup (JSON)',
  'backup.note': 'Note: Attachment photos are not included in backups.',
  'backup.successExport': 'Backup exported successfully',
  'backup.successImport': 'Successfully imported {count} items',
  'backup.invalid': 'Invalid backup file',

  // Help reminders
  'help.title': 'Not Getting Reminders?',
  'help.permissionStatus': 'Notification Permission: {status}',
  'help.openSettings': 'Open System Settings',
  'help.batteryNote': 'Check your phone battery settings. Some manufacturers (Xiaomi, Samsung, Oppo) restrict background notifications. Ensure Renewals is allowed to run in the background.',
  'help.testSent': 'Test notification scheduled for 10 seconds from now.',

  // Onboarding
  'onboarding.slide1Title': 'Track Every Expiry',
  'onboarding.slide1Text': 'Passports, visas, driver licenses, warranties and subscriptions in one place.',
  'onboarding.slide2Title': '100% Offline & Private',
  'onboarding.slide2Text': 'No accounts, no cloud sync, no tracking. Your data stays securely on your phone.',
  'onboarding.slide3Title': 'Never Miss a Date',
  'onboarding.slide3Text': 'Get timely local reminders before items expire so you never pay late fees.',
  'onboarding.skip': 'Skip',
  'onboarding.next': 'Next',
  'onboarding.getStarted': 'Get Started',
};

export type TranslationKey = keyof typeof en;
