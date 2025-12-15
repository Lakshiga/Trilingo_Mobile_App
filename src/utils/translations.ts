export type Language = 'English' | 'Tamil' | 'Sinhala';

export interface Translations {
  // Home Screen
  welcome: string;
  welcomeTo: string;
  learnWithFun: string;
  startLearningAdventure: string;
  homeHello: string;
  homeProgressTitle: string;
  homeNextLevel: string;
  homeStarsLabel: string;
  homeLevelLabel: string;
  homeAccuracyLabel: string;
  homeTimeLabel: string;
  homeAdventureTitle: string;
  homeAdventureSubtitle: string;
  homeCategoriesTitle: string;
  homeStoryTitle: string;
  homeStorySubtitle: string;
  homeVideosTitle: string;
  homeVideosSubtitle: string;
  homeSongsTitle: string;
  homeSongsSubtitle: string;
  homeConversationTitle: string;
  homeConversationSubtitle: string;
  homeQuickActionsTitle: string;

  // Songs Screen
  songsTitle: string;
  songsSearchPlaceholder: string;
  songsLoading: string;
  songsEmptyTitle: string;
  songsEmptySubtitle: string;
  songsNowPlaying: string;
  songsUnknown: string;

  // Stories Screen
  storiesTitle: string;
  storiesLoading: string;
  storiesEmptyTitle: string;
  storiesEmptySubtitle: string;
  storiesSubtitle: string;
  storiesReadLabel: string;

  // Conversation Screen
  conversationTitle: string;
  conversationSubtitle: string;
  conversationLoading: string;
  conversationEmptyTitle: string;
  conversationEmptySubtitle: string;
  conversationCardSubtitle: string;
  
  // Profile Screen
  settings: string;
  changeLanguage: string;
  darkMode: string;
  notifications: string;
  changePassword: string;
  logout: string;
  version: string;
  editProfile: string;
  name: string;
  email: string;
  age: string;
  nativeLanguage: string;
  learningLanguage: string;
  enterYourName: string;
  enterYourEmail: string;
  enterYourAge: string;
  enterYourNativeLanguage: string;
  enterLanguageLearning: string;
  saveChanges: string;
  saving: string;
  profileUpdatedSuccessfully: string;
  failedToUpdateProfile: string;
  nameAndEmailRequired: string;
  myProfile: string;
  myDetails: string;
  backgroundMusic: string;
  nightMode: string;
  level1Explorer: string;
  stars: string;
  completed: string;
  ready: string;
  pickSticker: string;
  profilePicture: string;
  changePicture: string;
  saveLocally: string;
  uploadFailed: string;
  savedLocally: string;
  sessionExpired: string;
  pleaseLoginAgain: string;
  uploadBlocked: string;
  serverUnavailable: string;
  awesome: string;
  profileUpdated: string;
  cool: string;
  pictureSaved: string;
  ohNo: string;
  needCameraPermission: string;
  needGalleryPermission: string;
  newLook: string;
  howWantToLook: string;
  pickAvatar: string;
  takePhoto: string;
  gallery: string;
  stay: string;
  byeBye: string;
  leaving: string;
  seeYou: string;
  verified: string;
  
  // Registration
  whatIsYourName: string;
  enterYourFullName: string;
  whatIsYourAge: string;
  enterYourAgeReg: string;
  whatIsYourEmail: string;
  enterYourEmailReg: string;
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
    homeHello: 'Hello',
    homeProgressTitle: 'Your Progress',
    homeNextLevel: 'Next level:',
    homeStarsLabel: 'Stars',
    homeLevelLabel: 'Level',
    homeAccuracyLabel: 'Accuracy',
    homeTimeLabel: 'Time',
    homeAdventureTitle: 'Adventure Map',
    homeAdventureSubtitle: 'Continue your journey',
    homeCategoriesTitle: 'Learning Categories',
    homeStoryTitle: 'Story Time',
    homeStorySubtitle: 'Read',
    homeVideosTitle: 'Cartoons',
    homeVideosSubtitle: 'Watch',
    homeSongsTitle: 'Music',
    homeSongsSubtitle: 'Dance',
    homeConversationTitle: 'Speak Up',
    homeConversationSubtitle: 'Talk',
    homeQuickActionsTitle: 'Quick Actions',
    songsTitle: 'Songs',
    songsSearchPlaceholder: 'Search songs or artists...',
    songsLoading: 'Loading songs...',
    songsEmptyTitle: 'No songs available yet.',
    songsEmptySubtitle: 'Check back later!',
    songsNowPlaying: '🎵 Now Playing 🎵',
    songsUnknown: 'Unknown Song',
    storiesTitle: 'Stories',
    storiesLoading: 'Loading stories...',
    storiesEmptyTitle: 'No stories available yet.',
    storiesEmptySubtitle: 'Check back later!',
    storiesSubtitle: 'Pick a story to read',
    storiesReadLabel: 'Read',
    conversationTitle: 'Speak Up!',
    conversationSubtitle: 'Practice speaking with guided chats',
    conversationLoading: 'Loading conversations...',
    conversationEmptyTitle: 'No conversations available yet. 🎤',
    conversationEmptySubtitle: 'Check back later for fun chats!',
    conversationCardSubtitle: 'Conversation • Guided',
    settings: 'Settings',
    changeLanguage: 'Change Language',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    changePassword: 'Change Password',
    logout: 'Logout',
    version: 'Version 1.0.0 • Q-bit Kids',
    editProfile: 'Edit Profile',
    name: 'Name',
    email: 'Email',
    age: 'Age',
    nativeLanguage: 'Native Language',
    learningLanguage: 'Learning Language',
    enterYourName: 'Enter your name',
    enterYourEmail: 'Enter your email',
    enterYourAge: 'Enter your age',
    enterYourNativeLanguage: 'Enter your native language',
    enterLanguageLearning: 'Enter language you\'re learning',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    profileUpdatedSuccessfully: 'Profile updated successfully',
    failedToUpdateProfile: 'Failed to update profile',
    nameAndEmailRequired: 'Name and email are required',
    myProfile: 'My Profile',
    myDetails: 'My Details',
    backgroundMusic: 'Background Music',
    nightMode: 'Night Mode',
    level1Explorer: '⭐ Level 1 Explorer',
    stars: 'Stars',
    completed: 'Completed',
    ready: 'Ready to learn!',
    pickSticker: 'Pick a Sticker!',
    profilePicture: 'Profile Picture',
    changePicture: 'Change Picture',
    saveLocally: 'Saved on device',
    uploadFailed: 'Server upload failed',
    savedLocally: 'Image saved on this device. Server upload failed.',
    sessionExpired: 'Session Expired',
    pleaseLoginAgain: 'Please log in again to upload images.',
    uploadBlocked: 'Upload Blocked',
    serverUnavailable: 'Image saved locally. Server upload is temporarily unavailable.',
    awesome: 'Awesome!',
    profileUpdated: 'Profile picture updated!',
    cool: 'Cool!',
    pictureSaved: 'Picture saved on this device.',
    ohNo: 'Oh no!',
    needCameraPermission: 'We need camera permission.',
    needGalleryPermission: 'We need gallery permission.',
    newLook: 'New Look!',
    howWantToLook: 'How do you want to look today?',
    pickAvatar: 'Pick Avatar',
    takePhoto: 'Take Photo',
    gallery: 'Gallery',
    stay: 'Stay',
    byeBye: 'Bye Bye',
    leaving: 'Leaving?',
    seeYou: 'See you next time, hero!',
    verified: 'Verified',
    whatIsYourName: 'What is your name?',
    enterYourFullName: 'Enter your full name',
    whatIsYourAge: 'What is your age?',
    enterYourAgeReg: 'Enter your age',
    whatIsYourEmail: 'What is your email address?',
    enterYourEmailReg: 'Enter your email',
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
    welcome: 'Q-bit ற்கு வரவேற்கிறோம்!',
    welcomeTo: 'வரவேற்கிறோம்',
    learnWithFun: 'வேடிக்கையுடனும் படைப்பாற்றலுடனும் கற்றுக்கொள்ளுங்கள்',
    startLearningAdventure: '🌟கற்கத் தொடங்குங்கள்!🌟',
    homeHello: 'வணக்கம்',
    homeProgressTitle: 'உங்கள் முன்னேற்றம்',
    homeNextLevel: 'அடுத்த நிலை:',
    homeStarsLabel: 'நட்சத்திரங்கள்',
    homeLevelLabel: 'நிலை',
    homeAccuracyLabel: 'துல்லியம்',
    homeTimeLabel: 'நேரம்',
    homeAdventureTitle: 'சாகச வரைபடம்',
    homeAdventureSubtitle: 'உங்கள் பயணத்தைத் தொடருங்கள்',
    homeCategoriesTitle: 'கற்பது வகைகள்',
    homeStoryTitle: 'கதைகள்',
    homeStorySubtitle: 'படிக்க',
    homeVideosTitle: 'கார்ட்டூன்கள்',
    homeVideosSubtitle: 'பார்க்க',
    homeSongsTitle: 'பாடல்கள்',
    homeSongsSubtitle: 'நடனமாட',
    homeConversationTitle: 'பேசிப் பழகுங்கள்',
    homeConversationSubtitle: 'பேச',
    homeQuickActionsTitle: 'விரைவு செயல்கள்',
    songsTitle: 'பாடல்கள்',
    songsSearchPlaceholder: 'பாடல்கள் அல்லது கலைஞர்களைத் தேடவும்...',
    songsLoading: 'பாடல்கள் ஏற்றப்படுகிறது...',
    songsEmptyTitle: 'பாடல்கள் இதுவரை இல்லை.',
    songsEmptySubtitle: 'பிறகு சரிபார்க்கவும்!',
    songsNowPlaying: '🎵 தற்போது இயங்குகிறது 🎵',
    songsUnknown: 'அறியப்படாத பாடல்',
    storiesTitle: 'கதைகள்',
    storiesLoading: 'கதைகள் ஏற்றப்படுகிறது...',
    storiesEmptyTitle: 'கதைகள் இதுவரை இல்லை.',
    storiesEmptySubtitle: 'பிறகு சரிபார்க்கவும்!',
    storiesSubtitle: 'படிக்க ஒரு கதையைத் தேர்ந்தெடுக்கவும்',
    storiesReadLabel: 'படிக்க',
    conversationTitle: 'பேசிப் பழகுங்கள்!',
    conversationSubtitle: 'வழிகாட்டிய உரையாடல்களுடன் பேச பழகவும்',
    conversationLoading: 'உரையாடல்கள் ஏற்றப்படுகிறது...',
    conversationEmptyTitle: 'உரையாடல்கள் இன்னும் இல்லை. 🎤',
    conversationEmptySubtitle: 'பின்னர் வேடிக்கையான உரையாடல்களைச் சரிபார்க்கவும்!',
    conversationCardSubtitle: 'உரையாடல் • வழிகாட்டப்பட்டது',
    settings: 'அமைப்புகள்',
    changeLanguage: 'மொழியை மாற்றவும்',
    darkMode: 'இருண்ட பயன்முறை',
    notifications: 'அறிவிப்புகள்',
    changePassword: 'கடவுச்சொல்லை மாற்றவும்',
    logout: 'வெளியேறு',
    version: 'பதிப்பு 1.0.0 • Q-bit Kids',
    editProfile: 'சுயவிவரத்தை திருத்தவும்',
    name: 'பெயர்',
    email: 'மின்னஞ்சல்',
    age: 'வயது',
    nativeLanguage: 'தாய்மொழி',
    learningLanguage: 'கற்றுக்கொள்ளும் மொழி',
    enterYourName: 'உங்கள் பெயரை உள்ளிடவும்',
    enterYourEmail: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    enterYourAge: 'உங்கள் வயதை உள்ளிடவும்',
    enterYourNativeLanguage: 'உங்கள் தாய்மொழியை உள்ளிடவும்',
    enterLanguageLearning: 'நீங்கள் கற்றுக்கொள்ளும் மொழியை உள்ளிடவும்',
    saveChanges: 'மாற்றங்களை சேமிக்கவும்',
    saving: 'சேமிக்கிறது...',
    profileUpdatedSuccessfully: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    failedToUpdateProfile: 'சுயவிவரத்தை புதுப்பிக்க முடியவில்லை',
    nameAndEmailRequired: 'பெயர் மற்றும் மின்னஞ்சல் தேவை',
    myProfile: 'என் சுயவிவரம்',
    myDetails: 'என் விவரங்கள்',
    backgroundMusic: 'பின்னணி இசை',
    nightMode: 'இரவு நிலை',
    level1Explorer: '⭐ நிலை 1 ஆராய்ச்சியாளர்',
    stars: 'நட்சத்திரங்கள்',
    completed: 'நிறைவு',
    ready: 'படிக்க தயாராக!',
    pickSticker: 'ஒரு ஸ்டிக்கரைத் தேர்ந்தெடு!',
    profilePicture: 'சுயவிவரப் படம்',
    changePicture: 'படத்தை மாற்றவும்',
    saveLocally: 'சாதனத்தில் சேமிக்கப்பட்டது',
    uploadFailed: 'சேவையக பதிவேற்றம் தோல்வியுற்றது',
    savedLocally: 'படம் இந்த சாதனத்தில் சேமிக்கப்பட்டது. சேவையக பதிவேற்றம் தோல்வியுற்றது.',
    sessionExpired: 'அமர்வு காலாவதியானது',
    pleaseLoginAgain: 'படங்களைப் பதிவேற்ற மீண்டும் உள்நுழைக.',
    uploadBlocked: 'பதிவேற்றம் தடுக்கப்பட்டது',
    serverUnavailable: 'படம் உள்ளூரில் சேமிக்கப்பட்டது. சேவையக பதிவேற்றம் தற்காலிகமாக கிடைக்கவில்லை.',
    awesome: 'அருமை!',
    profileUpdated: 'சுயவிவரப் படம் புதுப்பிக்கப்பட்டது!',
    cool: 'அருமை!',
    pictureSaved: 'படம் இந்த சாதனத்தில் சேமிக்கப்பட்டது.',
    ohNo: 'அடடா!',
    needCameraPermission: 'கேமரா அனுமதி தேவை.',
    needGalleryPermission: 'கேலரி அனுமதி தேவை.',
    newLook: 'புதிய தோற்றம்!',
    howWantToLook: 'இன்று நீங்கள் எப்படி தோற்றம் காட்ட விரும்புகிறீர்களா?',
    pickAvatar: 'அவதாரத்தைத் தேர்ந்தெடுக்கவும்',
    takePhoto: 'புகைப்படம் எடுக்கவும்',
    gallery: 'கேலரி',
    stay: 'இரு',
    byeBye: 'பை பை',
    leaving: 'செல்கிறீர்களா?',
    seeYou: 'அடுத்த முறை உங்களை பார்க்கலாம், ஹீரோ!',
    verified: 'சரிபார்க்கப்பட்டது',
    whatIsYourName: 'உங்கள் பெயர் என்ன?',
    enterYourFullName: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    whatIsYourAge: 'உங்கள் வயது என்ன?',
    enterYourAgeReg: 'உங்கள் வயதை உள்ளிடவும்',
    whatIsYourEmail: 'உங்கள் மின்னஞ்சல் முகவரி என்ன?',
    enterYourEmailReg: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
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
    homeHello: 'හෙලෝ',
    homeProgressTitle: 'ඔබේ ප්‍රගතිය',
    homeNextLevel: 'ඊළඟ මට්ටම:',
    homeStarsLabel: 'තරු',
    homeLevelLabel: 'මට්ටම',
    homeAccuracyLabel: 'නායනිකතාව',
    homeTimeLabel: 'කාලය',
    homeAdventureTitle: 'ඇඩ්වෙන්චර් මැප්',
    homeAdventureSubtitle: 'ඔබේ ගමන දිගටම',
    homeCategoriesTitle: 'ඉගෙනීමේ ප්‍රභේද',
    homeStoryTitle: 'කතා',
    homeStorySubtitle: 'කියවන්න',
    homeVideosTitle: 'කාටූන්',
    homeVideosSubtitle: 'බලන්න',
    homeSongsTitle: 'සිඟිති ගී',
    homeSongsSubtitle: 'නටන්න',
    homeConversationTitle: 'කතා බහ',
    homeConversationSubtitle: 'කතා කරන්න',
    homeQuickActionsTitle: 'ක්ෂණික ක්‍රියාකාරකම්',
    songsTitle: 'ගීත',
    songsSearchPlaceholder: 'ගීත හෝ කලාකරුවන් සොයන්න...',
    songsLoading: 'ගීත පූරණය වෙමින්...',
    songsEmptyTitle: 'ගීත තවම නොමැත.',
    songsEmptySubtitle: 'පසුව පරීක්ෂා කරන්න!',
    songsNowPlaying: '🎵 දැන් වාදනය වෙමින් 🎵',
    songsUnknown: 'නොදන්නා ගීතය',
    storiesTitle: 'කතා',
    storiesLoading: 'කතා පූරණය වෙමින්...',
    storiesEmptyTitle: 'කතා තවම නොමැත.',
    storiesEmptySubtitle: 'පසුව පරීක්ෂා කරන්න!',
    storiesSubtitle: 'කතාවක් තෝරා කියවන්න',
    storiesReadLabel: 'කියවන්න',
    conversationTitle: 'කතා කරන්න!',
    conversationSubtitle: 'මාර්ගගත සාකච්ඡා සමඟ කතා කිරීමට පුහුණුවන්න',
    conversationLoading: 'සාකච්ඡා පූරණය වෙමින්...',
    conversationEmptyTitle: 'සාකච්ඡා තවම නොමැත. 🎤',
    conversationEmptySubtitle: 'සෙල්ලම් කතා පසුව පරීක්ෂා කරන්න!',
    conversationCardSubtitle: 'සාකච්ඡාව • මගපෙන්වූ',
    settings: 'සැකසීම්',
    changeLanguage: 'භාෂාව වෙනස් කරන්න',
    darkMode: 'අඳුරු ප්‍රකාරය',
    notifications: 'දැනුම්දීම්',
    changePassword: 'මුරපදය වෙනස් කරන්න',
    logout: 'පිටවීම',
    version: 'අනුවාදය 1.0.0 • Q-bit Kids',
    editProfile: 'පැතිකඩ සංස්කරණය කරන්න',
    name: 'නම',
    email: 'විද්‍යුත් තැපැල්',
    age: 'වයස',
    nativeLanguage: 'මව් භාෂාව',
    learningLanguage: 'ඉගෙන ගන්නා භාෂාව',
    enterYourName: 'ඔබේ නම ඇතුළත් කරන්න',
    enterYourEmail: 'ඔබේ විද්‍යුත් තැපැල් ඇතුළත් කරන්න',
    enterYourAge: 'ඔබේ වයස ඇතුළත් කරන්න',
    enterYourNativeLanguage: 'ඔබේ මව් භාෂාව ඇතුළත් කරන්න',
    enterLanguageLearning: 'ඔබ ඉගෙන ගන්නා භාෂාව ඇතුළත් කරන්න',
    saveChanges: 'වෙනස්කම් සුරකින්න',
    saving: 'සුරකිමින්...',
    profileUpdatedSuccessfully: 'පැතිකඩ සාර්ථකව යාවත්කාලීන කර ඇත',
    failedToUpdateProfile: 'පැතිකඩ යාවත්කාලීන කිරීමට නොහැකි විය',
    nameAndEmailRequired: 'නම සහ විද්‍යුත් තැපැල් අවශ්‍යයි',
    myProfile: 'මගේ ප්‍රොෆයිල්',
    myDetails: 'මගේ විස්තර',
    backgroundMusic: 'පසුබිම් සංගීතය',
    nightMode: 'රාත්‍රී ප්‍රකාරය',
    level1Explorer: '⭐ මට්ටම් 1 ගවේෂක',
    stars: 'තරු',
    completed: 'සම්පූර්ණයි',
    ready: 'ඉගෙන ගන්න සූදානම්!',
    pickSticker: 'ස්ටිකර් එකක් තෝරන්න!',
    profilePicture: 'පැතිකඩ ඡායාරූපය',
    changePicture: 'රූපය වෙනස් කරන්න',
    saveLocally: 'උපාංගයේ සුරකින ලදී',
    uploadFailed: 'සේවාදායකයේ උඩුගත කිරීම අසාර්ථක විය',
    savedLocally: 'රූපය මෙම උපාංගයේ සුරකින ලදී. සේවාදායකයේ උඩුගත කිරීම අසාර්ථක විය.',
    sessionExpired: 'සැසිය කල් අවසන් විය',
    pleaseLoginAgain: 'රූප උඩුගත කිරීමට නැවත පිවිසෙන්න.',
    uploadBlocked: 'උඩුගත කිරීම අවහිර කර ඇත',
    serverUnavailable: 'රූපය දේශීයව සුරකින ලදී. සේවාදායකයේ උඩුගත කිරීම තාවකාලිකව නොමැත.',
    awesome: 'නියමයි!',
    profileUpdated: 'පැතිකඩ ඡායාරූපය යාවත්කාලීන කර ඇත!',
    cool: 'නියමයි!',
    pictureSaved: 'රූපය මෙම උපාංගයේ සුරකින ලදී.',
    ohNo: 'ඕහෝ නැහැ!',
    needCameraPermission: 'අපිට කැමරා අවසරය අවශ්‍යයි.',
    needGalleryPermission: 'අපිට ගැලරි අවසරය අවශ්‍යයි.',
    newLook: 'නව පෙනුම!',
    howWantToLook: 'අද ඔබ කෙසේ පෙනී සිටින්න කැමතිද?',
    pickAvatar: 'අවතාරයක් තෝරන්න',
    takePhoto: 'ඡායාරූපයක් ගන්න',
    gallery: 'ගැලරිය',
    stay: 'ඉන්න',
    byeBye: 'බායි බායි',
    leaving: 'යනවාද?',
    seeYou: 'ඊළඟ වර ඔබව දැකින්නේ මමු, හීරෝ!',
    verified: 'සත්‍යාපනය කළ',
    whatIsYourName: 'ඔබේ නම කුමක්ද?',
    enterYourFullName: 'ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
    whatIsYourAge: 'ඔබේ වයස කුමක්ද?',
    enterYourAgeReg: 'ඔබේ වයස ඇතුළත් කරන්න',
    whatIsYourEmail: 'ඔබේ විද්‍යුත් තැපැල් ලිපිනය කුමක්ද?',
    enterYourEmailReg: 'ඔබේ විද්‍යුත් තැපැල් ඇතුළත් කරන්න',
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