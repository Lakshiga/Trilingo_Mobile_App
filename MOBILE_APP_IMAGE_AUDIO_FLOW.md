# Mobile App Image & Audio Flow - Implementation Guide

## Overview
This document explains how images and audio files from activities and exercises are now handled in the mobile app, ensuring they load correctly from AWS S3 via CloudFront.

## Implementation Details

### 1. AWS URL Helper Utility (`src/utils/awsUrlHelper.ts`)
Created a utility module that converts relative S3 paths to full CloudFront URLs:

- **`getCloudFrontUrl(path)`**: Converts relative paths like `/images/dog.png` to full CloudFront URLs
- **`getImageUrl(imageData, preferredLanguage)`**: Extracts image URLs from multilingual objects or strings
- **`getAudioUrl(audioData, preferredLanguage)`**: Extracts audio URLs from multilingual objects or strings
- **`getVideoUrl(videoData, preferredLanguage)`**: Extracts video URLs from multilingual objects or strings

### 2. Exercise Screen Updates (`src/screens/ExerciseScreen.tsx`)

#### Features Added:
- **Image Display**: Exercises now display images from their `jsonData` field
- **Audio Playback**: Exercises with audio files can play/pause audio directly from the card
- **Multilingual Support**: Handles images and audio in multiple languages (en, ta, si)

#### Supported Exercise Types:
1. **Flashcard Exercises**: 
   - Extracts `imageUrl` and `audioUrl` from multilingual objects
   - Extracts title from `word` field
   - Extracts description from `label` or `referenceTitle`

2. **MCQ Exercises**:
   - Extracts images/audio from first question's content
   - Handles question types: `text`, `image`, `audio`
   - Extracts instruction text

3. **Generic Exercises**:
   - Handles standard `title`, `description`, `imageUrl`, `audioUrl` fields
   - Supports both object and string formats

### 3. Package Dependencies
Added `expo-av` package for audio playback:
```json
"expo-av": "~15.0.1"
```

## How It Works

### Data Flow:
1. **Backend** stores exercise data in `jsonData` field with relative S3 paths (e.g., `/level-01/img/dog.png`)
2. **Mobile App** fetches exercises via API
3. **ExerciseScreen** parses `jsonData` and extracts image/audio URLs
4. **awsUrlHelper** converts relative paths to full CloudFront URLs
5. **React Native Image/Audio** components load media from CloudFront

### Example JSON Structure:

#### Flashcard Exercise:
```json
{
  "id": "flashcard_1",
  "word": {
    "en": "Dog",
    "ta": "நாய்",
    "si": "බල්ලා"
  },
  "imageUrl": {
    "en": "/level-01/img/dog.png",
    "ta": "/level-01/img/dog.png",
    "si": "/level-01/img/dog.png"
  },
  "audioUrl": {
    "en": "/level-01/en/dog.mp3",
    "ta": "/level-01/ta/dog.mp3",
    "si": "/level-01/si/dog.mp3"
  }
}
```

#### MCQ Exercise:
```json
{
  "instruction": {
    "en": "Select the correct answer",
    "ta": "சரியான பதிலைத் தேர்ந்தெடுக்கவும்",
    "si": "නිවැරදි පිළිතුර තෝරන්න"
  },
  "questions": [
    {
      "questionId": "MQ1",
      "question": {
        "type": "image",
        "content": {
          "en": "/level-01/img/apple.png",
          "ta": "/level-01/img/apple.png",
          "si": "/level-01/img/apple.png"
        }
      }
    }
  ]
}
```

## CloudFront URL Structure

All media files are served via CloudFront:
- **Base URL**: `https://d3v81eez8ecmto.cloudfront.net`
- **Image Example**: `https://d3v81eez8ecmto.cloudfront.net/level-01/img/dog.png`
- **Audio Example**: `https://d3v81eez8ecmto.cloudfront.net/level-01/en/dog.mp3`

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd trilingo--mobile-
   npm install
   ```

2. **Verify CloudFront URL**:
   - Check `src/config/apiConfig.ts` to ensure `CLOUDFRONT_URL` is set correctly
   - Current value: `https://d3v81eez8ecmto.cloudfront.net`

3. **Test the Flow**:
   - Open the mobile app
   - Navigate to Activities
   - Select an activity with exercises
   - Verify images display correctly
   - Test audio playback by tapping the play button

## Error Handling

- **Image Load Errors**: Images that fail to load are hidden (error state handled)
- **Audio Playback Errors**: Shows alert if audio cannot be played
- **Invalid URLs**: Returns `null` for invalid/emoji-like strings to prevent 403 errors
- **Network Errors**: Proper error messages displayed to user

## Future Enhancements

- Add language preference selection for multilingual content
- Add image zoom functionality
- Add audio progress indicator
- Support for video playback in exercises
- Cache images and audio for offline access


