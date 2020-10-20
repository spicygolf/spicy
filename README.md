# Spicy Golf App

Spicy Golf mobile app written in React Native

## Development Setup

 * Install node npm yarn watchman cocoapods, probably via `brew`
 * Install XCode
 * Configure Command Line Tools like [here](https://stackoverflow.com/questions/29108172/xcrun-unable-to-find-simctl).

    TL;DR - set XCode | Preferences | Locations | Command Line Tools dropdown to something if it's blank.

 * Install React Native CLI and Detox CLI

        yarn global add react-native-cli detox-cli

 * Install Yarn dependencies

        yarn install

 * Install Pods dependencies (in `ios` folder)

        pod install

 * Start up the App

        yarn run ios
    or

        yarn run android


 * Nice to have for iTerm2 users, follow the instructions [here](https://stackoverflow.com/questions/37814803/how-to-get-react-native-run-ios-to-open-in-iterm-instead-of-terminal-on-a-macos).

## Deployment

If ready for deploy, perform a version bump commit:

    npm version [ major | minor | patch ]

### Android

After version bump, follow instructions here: [https://facebook.github.io/react-native/docs/signed-apk-android.html](https://facebook.github.io/react-native/docs/signed-apk-android.html).  Basically, when everything is set up, do:

    yarn android:apk

Then go to [App Releases](https://play.google.com/apps/publish/?dev_acc=00137341438711124394#ManageReleasesPlace:p=golf.spicy) in the Play Store.  Upload the APK file found at ```./android/app/build/outputs/apk/release/app-release.apk```

### iOS

After version bump, in the root of this project, type:

    yarn run build:ios

In XCode, select Product -> Archive

 * Validate
 * Upload to App Store

In [iTunes Connect](itunesconnect.apple.com/WebObjects/iTunesConnect.woa/ra/ng/app/1250184426), under My Apps, Spicy Golf, select "+ Version or Platform", type new version number in, and continue through to submit for review.