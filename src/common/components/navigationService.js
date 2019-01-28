import { NavigationActions } from 'react-navigation';

let _navigator;

export const setTopLevelNavigator = (navigatorRef) => {
  _navigator = navigatorRef;
};

export const navigate = (routeName, params) => {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
    })
  );
};

export const goBack = () => {
  _navigator.dispatch(
    NavigationActions.back()
  );
}

// found at https://reactnavigation.org/docs/en/navigating-without-navigation-prop.html
