import {
  createStackNavigator
} from 'react-navigation';

import Login from 'features/login/login';



const AuthStack = createStackNavigator({
  Login: Login
});


export default AuthStack;
