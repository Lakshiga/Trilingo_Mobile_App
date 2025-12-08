export type Language = 'English' | 'Tamil' | 'Sinhala';

export interface Translations {
  // Home Screen
  welcome: string;
  welcomeTo: string;
  learnWithFun: string;
  startLearningAdventure: string;
  
  // Profile Screen
  settings: string;
  changeLanguage: string;
  darkMode: string;
  notifications: string;
  changePassword: string;
  logout: string;
  version: string;
  
  // Registration
  whatIsYourName: string;
  enterYourFullName: string;
  whatIsYourAge: string;
  enterYourAge: string;
  whatIsYourEmail: string;
  enterYourEmail: string;
  createAccount: string;
  username: string;
  chooseUsername: string;
  password: string;
  choosePassword: string;
  whatIsYourNativeLanguage: string;
  whichLanguageToLearn: string;
  back: string;
  next: string;
  continue: string;
  complete: string;
  step: string;
  of: string;
  
  // Password validation
  passwordRequired: string;
  passwordMinLength: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumber: string;
  passwordSpecialChar: string;
  
  // Email validation
  emailInvalid: string;
  emailAlreadyTaken: string;
  
  // Common
  pleaseAnswer: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  edit: string;
  
  // Stats
  lessons: string;
  points: string;
  days: string;
  
  // Activities
  funActivities: string;
  chooseYourAdventure: string;
  loadingActivities: string;
  noActivitiesAvailable: string;
  funActivityLabel: string;
  start: string;
  
  // Videos
  educationalVideos: string;
  learnThroughEngagingContent: string;
  loadingVideos: string;
  noVideosAvailable: string;
  checkBackLater: string;
  educationalVideo: string;

  // Pagination
  pageLabel: string;
  nextPage: string;
  previousPage: string;
  completeExercisesBelow: string;
}

const translations: Record<Language, Translations> = {
  English: {
    welcome: 'Welcome to Trilingo!',
    welcomeTo: 'Welcome to',
    learnWithFun: 'Learn with Fun & Creativity',
    startLearningAdventure: '🌟 Start learning 🌟',
    settings: 'Settings',
    changeLanguage: 'Change Language',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    changePassword: 'Change Password',
    logout: 'Logout',
    version: 'Version 1.0.0',
    whatIsYourName: 'What is your name?',
    enterYourFullName: 'Enter your full name',
    whatIsYourAge: 'What is your age?',
    enterYourAge: 'Enter your age',
    whatIsYourEmail: 'What is your email address?',
    enterYourEmail: 'Enter your email',
    createAccount: 'Create an account — please enter:',
    username: 'Username',
    chooseUsername: 'Choose a username',
    password: 'Password',
    choosePassword: 'Choose a password',
    whatIsYourNativeLanguage: 'What is your native language?',
    whichLanguageToLearn: 'Which language would you like to learn?',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    complete: 'Complete',
    step: 'Step',
    of: 'of',
    passwordRequired: 'Password is required.',
    passwordMinLength: 'Password must be at least 8 characters long.',
    passwordUppercase: 'Password must contain at least one uppercase letter.',
    passwordLowercase: 'Password must contain at least one lowercase letter.',
    passwordNumber: 'Password must contain at least one number.',
    passwordSpecialChar: 'Password must contain at least one special character.',
    emailInvalid: 'Please enter a valid email address.',
    emailAlreadyTaken: 'This email is already registered. Please use a different email.',
    pleaseAnswer: 'Please answer the question',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    lessons: 'Lessons',
    points: 'Points',
    days: 'Days',
    funActivities: 'Fun Activities!',
    chooseYourAdventure: 'Choose your adventure',
    loadingActivities: 'Loading activities...',
    noActivitiesAvailable: 'No activities available',
    funActivityLabel: 'Fun activity',
    start: 'Start',
    educationalVideos: 'Educational Videos',
    learnThroughEngagingContent: 'Learn through engaging content',
    loadingVideos: 'Loading videos...',
    noVideosAvailable: 'No videos available yet.',
    checkBackLater: 'Check back later!',
    educationalVideo: 'Educational video',
    pageLabel: 'Page',
    nextPage: 'Next',
    previousPage: 'Previous',
    completeExercisesBelow: 'Complete the exercises below',
  },
  Tamil: {
    welcome: 'ட்ரிலிங்கோவிற்கு வரவேற்கிறோம்!',
    welcomeTo: 'வரவேற்கிறோம்',
    learnWithFun: 'வேடிக்கையுடனும் படைப்பாற்றலுடனும் கற்றுக்கொள்ளுங்கள்',
    startLearningAdventure: '🌟கற்கத் தொடங்குங்கள்!🌟',
    settings: 'அமைப்புகள்',
    changeLanguage: 'மொழியை மாற்றவும்',
    darkMode: 'இருண்ட பயன்முறை',
    notifications: 'அறிவிப்புகள்',
    changePassword: 'கடவுச்சொல்லை மாற்றவும்',
    logout: 'வெளியேறு',
    version: 'பதிப்பு 1.0.0',
    whatIsYourName: 'உங்கள் பெயர் என்ன?',
    enterYourFullName: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    whatIsYourAge: 'உங்கள் வயது என்ன?',
    enterYourAge: 'உங்கள் வயதை உள்ளிடவும்',
    whatIsYourEmail: 'உங்கள் மின்னஞ்சல் முகவரி என்ன?',
    enterYourEmail: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    createAccount: 'கணக்கை உருவாக்கவும் — தயவுசெய்து உள்ளிடவும்:',
    username: 'பயனர்பெயர்',
    chooseUsername: 'பயனர்பெயரைத் தேர்ந்தெடுக்கவும்',
    password: 'கடவுச்சொல்',
    choosePassword: 'கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்',
    whatIsYourNativeLanguage: 'உங்கள் தாய்மொழி என்ன?',
    whichLanguageToLearn: 'நீங்கள் எந்த மொழியைக் கற்றுக்கொள்ள விரும்புகிறீர்கள்?',
    back: 'பின்',
    next: 'அடுத்து',
    continue: 'தொடரவும்',
    complete: 'முடிக்க',
    step: 'படி',
    of: 'இல்',
    passwordRequired: 'கடவுச்சொல் தேவை.',
    passwordMinLength: 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்.',
    passwordUppercase: 'கடவுச்சொல் குறைந்தது ஒரு பெரிய எழுத்தைக் கொண்டிருக்க வேண்டும்.',
    passwordLowercase: 'கடவுச்சொல் குறைந்தது ஒரு சிறிய எழுத்தைக் கொண்டிருக்க வேண்டும்.',
    passwordNumber: 'கடவுச்சொல் குறைந்தது ஒரு எண்ணைக் கொண்டிருக்க வேண்டும்.',
    passwordSpecialChar: 'கடவுச்சொல் குறைந்தது ஒரு சிறப்பு எழுத்தைக் கொண்டிருக்க வேண்டும்.',
    emailInvalid: 'தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.',
    emailAlreadyTaken: 'இந்த மின்னஞ்சல் ஏற்கனவே பதிவுசெய்யப்பட்டுள்ளது. வேறு மின்னஞ்சலைப் பயன்படுத்தவும்.',
    pleaseAnswer: 'தயவுசெய்து கேள்விக்கு பதிலளிக்கவும்',
    error: 'பிழை',
    success: 'வெற்றி',
    cancel: 'ரத்துசெய்',
    save: 'சேமி',
    edit: 'திருத்து',
    lessons: 'பாடங்கள்',
    points: 'புள்ளிகள்',
    days: 'நாட்கள்',
    funActivities: 'வேடிக்கையான செயல்பாடுகள்!',
    chooseYourAdventure: 'உங்கள் சாகசத்தைத் தேர்ந்தெடுக்கவும்',
    loadingActivities: 'செயல்பாடுகளை ஏற்றுகிறது...',
    noActivitiesAvailable: 'செயல்பாடுகள் எதுவும் இல்லை',
    funActivityLabel: 'வேடிக்கையான செயல்பாடு',
    start: 'தொடங்கு',
    educationalVideos: 'கல்வி வீடியோக்கள்',
    learnThroughEngagingContent: 'ஈர்க்கக்கூடிய உள்ளடக்கத்தின் மூலம் கற்றுக்கொள்ளுங்கள்',
    loadingVideos: 'வீடியோக்களை ஏற்றுகிறது...',
    noVideosAvailable: 'வீடியோக்கள் இன்னும் இல்லை.',
    checkBackLater: 'பின்னர் சரிபார்க்கவும்!',
    educationalVideo: 'கல்வி வீடியோ',
    pageLabel: 'பக்கம்',
    nextPage: 'அடுத்து',
    previousPage: 'முன்',
    completeExercisesBelow: 'கீழே உள்ள பயிற்சிகளை முடிக்கவும்',
  },
  Sinhala: {
    welcome: 'ට්‍රිලිංගෝ වෙත සාදරයෙන් පිළිගනිමු!',
    welcomeTo: 'සාදරයෙන් පිළිගනිමු',
    learnWithFun: 'විනෝදයෙන් සහ නිර්මාණශීලීව ඉගෙන ගන්න',
    startLearningAdventure: '🌟 කර්ක තොඩංගුන්කල් 🌟',
    settings: 'සැකසීම්',
    changeLanguage: 'භාෂාව වෙනස් කරන්න',
    darkMode: 'අඳුරු ප්‍රකාරය',
    notifications: 'දැනුම්දීම්',
    changePassword: 'මුරපදය වෙනස් කරන්න',
    logout: 'පිටවීම',
    version: 'අනුවාදය 1.0.0',
    whatIsYourName: 'ඔබේ නම කුමක්ද?',
    enterYourFullName: 'ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
    whatIsYourAge: 'ඔබේ වයස කුමක්ද?',
    enterYourAge: 'ඔබේ වයස ඇතුළත් කරන්න',
    whatIsYourEmail: 'ඔබේ විද්‍යුත් තැපැල් ලිපිනය කුමක්ද?',
    enterYourEmail: 'ඔබේ විද්‍යුත් තැපැල් ඇතුළත් කරන්න',
    createAccount: 'ගිණුමක් සාදන්න — කරුණාකර ඇතුළත් කරන්න:',
    username: 'පරිශීලක නාමය',
    chooseUsername: 'පරිශීලක නාමයක් තෝරන්න',
    password: 'මුරපදය',
    choosePassword: 'මුරපදයක් තෝරන්න',
    whatIsYourNativeLanguage: 'ඔබේ මව් භාෂාව කුමක්ද?',
    whichLanguageToLearn: 'ඔබ ඉගෙන ගැනීමට කැමති භාෂාව කුමක්ද?',
    back: 'ආපසු',
    next: 'ඊළඟ',
    continue: 'ඉදිරියට ගොඩනෙතින්න',
    complete: 'සම්පූර්ණ කරන්න',
    step: 'පියවර',
    of: 'හි',
    passwordRequired: 'මුරපදය අවශ්‍යයි.',
    passwordMinLength: 'මුරපදය අවම වශයෙන් අක්ෂර 8 ක් විය යුතුය.',
    passwordUppercase: 'මුරපදය අවම වශයෙන් එක් විශාල අක්ෂරයක් අඩංගු විය යුතුය.',
    passwordLowercase: 'මුරපදය අවම වශයෙන් එක් කුඩා අක්ෂරයක් අඩංගු විය යුතුය.',
    passwordNumber: 'මුරපදය අවම වශයෙන් එක් අංකයක් අඩංගු විය යුතුය.',
    passwordSpecialChar: 'මුරපදය අවම වශයෙන් එක් විශේෂ අක්ෂරයක් අඩංගු විය යුතුය.',
    emailInvalid: 'කරුණාකර වලංගු විද්‍යුත් තැපැල් ලිපිනයක් ඇතුළත් කරන්න.',
    emailAlreadyTaken: 'මෙම විද්‍යුත් තැපැල් ලිපිනය දැනටමත් ලියාපදිංචි කර ඇත. කරුණාකර වෙනත් විද්‍යුත් තැපැල් ලිපිනයක් භාවිතා කරන්න.',
    pleaseAnswer: 'කරුණාකර ප්‍රශ්නයට පිළිතුරු දෙන්න',
    error: 'දෝෂය',
    success: 'සාර්ථකත්වය',
    cancel: 'අවලංගු කරන්න',
    save: 'සුරකින්න',
    edit: 'සංස්කරණය කරන්න',
    lessons: 'පාඩම්',
    points: 'ලකුණු',
    days: 'දින',
    funActivities: 'විනෝදකාරී ක්‍රියාකාරකම්!',
    chooseYourAdventure: 'ඔබේ වික්‍රමය තෝරන්න',
    loadingActivities: 'ක්‍රියාකාරකම් පූරණය වෙමින්...',
    noActivitiesAvailable: 'ක්‍රියාකාරකම් නොමැත',
    funActivityLabel: 'විනෝදකාරී ක්‍රියාකාරකම',
    start: 'ආරම්භ කරන්න',
    educationalVideos: 'අධ්‍යාපනික වීඩියෝ',
    learnThroughEngagingContent: 'ආකර්ෂණීය අන්තර්ගතය හරහා ඉගෙන ගන්න',
    loadingVideos: 'වීඩියෝ පූරණය වෙමින්...',
    noVideosAvailable: 'වීඩියෝ තවම නොමැත.',
    checkBackLater: 'පසුව පරීක්ෂා කරන්න!',
    educationalVideo: 'අධ්‍යාපනික වීඩියෝ',
    pageLabel: 'පිටුව',
    nextPage: 'ඊළඟ',
    previousPage: 'පෙර',
    completeExercisesBelow: 'පහත ඇති අභ්‍යාස සම්පූර්ණ කරන්න',
  },
};

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language]?.[key] || translations.English[key];
};

export const getTranslations = (language: Language): Translations => {
  return translations[language] || translations.English;
};

