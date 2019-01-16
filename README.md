# Druid Golf App

Druid Golf mobile app written in React Native

## Development Setup

 * Install NodeJS, NPM, Yarn, Watchman, probably via `brew`
 * Install XCode
 * Install command-line developer tools

         xcode-select --install

    You might have to set XCode | Preferences | Locations | Command Line Tools dropdown to something if it's blank.

 * Install React Native CLI and Detox
 
        sudo npm install -g react-native-cli detox
 
 * Install dependencies

        yarn install
         
 * Start up the App
 
        yarn run ios
or
 
        yarn run android


 * Nice to have for iTerm2 users, follow the instructions [here](https://stackoverflow.com/questions/37814803/how-to-get-react-native-run-ios-to-open-in-iterm-instead-of-terminal-on-a-macos).