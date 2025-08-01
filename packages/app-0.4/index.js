/**
 * @format
 */

import '@fireproof/react-native/polyfills';

import {AppRegistry} from 'react-native';
import App from './src/components/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
