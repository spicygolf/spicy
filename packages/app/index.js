import { AppRegistry } from 'react-native';
import { App } from '@/app/App';
import { name as appName } from './app.json';
import '@/utils/polyfills';
import '@/utils/unistyles';

AppRegistry.registerComponent(appName, () => App);
