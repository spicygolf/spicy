import {AppRegistry} from 'react-native';
import App from 'app/App';
import {name as appName} from './app.json';
import 'utils/polyfills';

AppRegistry.registerComponent(appName, () => App);
