import type { en } from './en';

export const bn: typeof en = {
  // Tabs
  'tabs.upcoming': 'আসন্ন',
  'tabs.all': 'সব',
  'tabs.subscriptions': 'সাবস্ক্রিপশন',
  'tabs.settings': 'সেটিংস',

  // Categories
  'category.passport': 'পাসপোর্ট',
  'category.visa': 'ভিসা',
  'category.license': 'লাইসেন্স',
  'category.id_card': 'আইডি কার্ড',
  'category.vehicle': 'যানবাহন',
  'category.insurance': 'বীমা',
  'category.subscription': 'সাবস্ক্রিপশন',
  'category.warranty': 'ওয়ারেন্টি',
  'category.domain_hosting': 'ডোমেইন ও হোস্টিং',
  'category.other': 'অন্যান্য',

  // Billing cycles
  'billing.none': 'এককালীন',
  'billing.weekly': 'সাপ্তাহিক',
  'billing.monthly': 'মাসিক',
  'billing.yearly': 'বার্ষিক',

  // Buckets & Status
  'bucket.overdue': 'মেয়াদোত্তীর্ণ',
  'bucket.today': 'আজ মেয়াদ শেষ',
  'bucket.next7': 'আগামী ৭ দিন',
  'bucket.next30': 'আগামী ৩০ দিন',
  'bucket.later': 'পরে',
  'status.active': 'সক্রিয়',
  'status.archived': 'সংরক্ষিত',

  // Common actions & labels
  'common.add': 'যোগ করুন',
  'common.edit': 'সম্পাদনা',
  'common.delete': 'মুছে ফেলুন',
  'common.save': 'সংরক্ষণ',
  'common.cancel': 'বাতিল',
  'common.search': 'অনুসন্ধান করুন...',
  'common.filter': 'ফিল্টার',
  'common.back': 'পেছনে',
  'common.renew': 'নবায়ন',
  'common.archive': 'আর্কাইভ',
  'common.restore': 'পুনরুদ্ধার',
  'common.confirm': 'নিশ্চিত করুন',
  'common.notes': 'নোট',
  'common.amount': 'খরচ',
  'common.daysLeft': '{count} দিন বাকি',
  'common.dayLeft': '১ দিন বাকি',
  'common.overdueDays': '{count} দিন মেয়াদোত্তীর্ণ',
  'common.overdueDay': '১ দিন মেয়াদোত্তীর্ণ',
  'common.today': 'আজ মেয়াদ শেষ',

  // Home / Upcoming
  'home.title': 'রিনিউয়ালস',
  'home.overdueCount': '{count}টি আইটেম মেয়াদোত্তীর্ণ',
  'home.emptyTitle': 'কোন আসন্ন নবায়ন নেই',
  'home.emptySubtitle': 'আপনার প্রথম পাসপোর্ট, সাবস্ক্রিপশন বা ওয়ারেন্টি যোগ করতে + এ ট্যাপ করুন।',
  'home.permissionBanner': 'নোটিফিকেশন বন্ধ আছে। রিমাইন্ডার চালু করতে ট্যাপ করুন।',

  // All items
  'all.title': 'সব আইটেম',
  'all.empty': 'কোন আইটেম পাওয়া যায়নি',

  // Subscriptions
  'subscriptions.title': 'সাবস্ক্রিপশন',
  'subscriptions.monthlyTotal': 'মাসিক মোট',
  'subscriptions.yearlyTotal': 'বার্ষিক মোট',
  'subscriptions.empty': 'কোন খরচসহ সক্রিয় সাবস্ক্রিপশন নেই।',
  'subscriptions.emptySubtitle': 'মাসিক ও বার্ষিক খরচ ট্র্যাক করতে খরচ এবং বিলিং চক্রসহ সাবস্ক্রিপশন যোগ করুন।',

  // Settings
  'settings.title': 'সেটিংস',
  'settings.language': 'ভাষা',
  'settings.currencyCode': 'মুদ্রা কোড',
  'settings.currencySymbol': 'মুদ্রা প্রতীক',
  'settings.notifyHour': 'নোটিফিকেশনের সময় (০-২৩)',
  'settings.theme': 'থিম',
  'settings.themeSystem': 'সিস্টেম',
  'settings.themeLight': 'হালকা',
  'settings.themeDark': 'গাঢ়',
  'settings.backup': 'ব্যাকআপ এবং পুনরুদ্ধার',
  'settings.helpReminders': 'রিমাইন্ডার পাচ্ছেন না?',
  'settings.about': 'সম্পর্কে',
  'settings.testNotification': '১০ সেকেন্ডে টেস্ট নোটিফিকেশন পাঠান',

  // Add / Edit item
  'item.newTitle': 'আইটেম যোগ করুন',
  'item.editTitle': 'আইটেম সম্পাদনা',
  'item.titleLabel': 'শিরোনাম',
  'item.categoryLabel': 'বিভাগ',
  'item.expiresOnLabel': 'মেয়াদ শেষের তারিখ (YYYY-MM-DD)',
  'item.reminderDaysLabel': 'রিমাইন্ডার দিন (কমা দিয়ে আলাদা করুন)',
  'item.costsMoney': 'এতে খরচ হয়',
  'item.billingCycleLabel': 'বিলিং চক্র',
  'item.autoRenewsLabel': 'স্বয়ংক্রিয় নবায়ন',
  'item.notesPlaceholder': 'আইডি নম্বর দেওয়া থেকে বিরত থাকুন...',
  'item.attachmentsLabel': 'ছবি (সর্বোচ্চ ৩টি)',
  'item.titleRequired': 'শিরোনাম আবশ্যক (১-৬০ অক্ষর)',
  'item.dateRequired': 'সঠিক মেয়াদ শেষের তারিখ (YYYY-MM-DD) আবশ্যক',

  // Item detail
  'detail.title': 'আইটেমের বিবরণ',
  'detail.history': 'নবায়নের ইতিহাস',
  'detail.deleteConfirm': 'এই আইটেম এবং এর রিমাইন্ডার মুছে ফেলবেন?',
  'detail.archiveConfirm': 'আইটেমটি আর্কাইভ করবেন?',

  // Renew modal
  'renew.title': 'নবায়ন করুন',
  'renew.newExpiry': 'নতুন মেয়াদ শেষের তারিখ',

  // Backup screen
  'backup.title': 'ব্যাকআপ এবং পুনরুদ্ধার',
  'backup.export': 'ব্যাকআপ এক্সপোর্ট (JSON)',
  'backup.import': 'ব্যাকআপ ইমপোর্ট (JSON)',
  'backup.note': 'দ্রষ্টব্য: ব্যাকআপে সংযুক্তি ছবি অন্তর্ভুক্ত থাকে না।',
  'backup.successExport': 'সফলভাবে ব্যাকআপ এক্সপোর্ট করা হয়েছে',
  'backup.successImport': 'সফলভাবে {count}টি আইটেম ইমপোর্ট করা হয়েছে',
  'backup.invalid': 'অস্বীকৃত ব্যাকআপ ফাইল',

  // Help reminders
  'help.title': 'রিমাইন্ডার পাচ্ছেন না?',
  'help.permissionStatus': 'নোটিফিকেশন অনুমতি: {status}',
  'help.openSettings': 'সিস্টেম সেটিংস খুলুন',
  'help.batteryNote': 'আপনার ফোনের ব্যাটারি সেটিংস পরীক্ষা করুন। কিছু নির্মাতা (Xiaomi, Samsung, Oppo) ব্যাকগ্রাউন্ড নোটিফিকেশন সীমিত করে। ব্যাকগ্রাউন্ডে চলার অনুমতি নিশ্চিত করুন।',
  'help.testSent': '১০ সেকেন্ডের জন্য টেস্ট নোটিফিকেশন নির্ধারিত হয়েছে।',

  // Onboarding
  'onboarding.slide1Title': 'প্রতিটি মেয়াদ ট্র্যাক করুন',
  'onboarding.slide1Text': 'পাসপোর্ট, ভিসা, ড্রাইভিং লাইসেন্স, ওয়ারেন্টি এবং সাবস্ক্রিপশন এক জায়গায়।',
  'onboarding.slide2Title': '১০০% অফলাইন ও নিরাপদ',
  'onboarding.slide2Text': 'কোন অ্যাকাউন্ট নেই, কোন ক্লাউড সিঙ্ক নেই। আপনার ডেটা আপনার ফোনেই সুরক্ষিত থাকে।',
  'onboarding.slide3Title': 'কখনোই তারিখ ভুলবেন না',
  'onboarding.slide3Text': 'মেয়াদ শেষ হওয়ার আগে সময়মতো স্থানীয় রিমাইন্ডার পান।',
  'onboarding.skip': 'এড়িয়ে যান',
  'onboarding.next': 'পরবর্তী',
  'onboarding.getStarted': 'শুরু করুন',
};
