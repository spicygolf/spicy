import Error from 'common/components/error';
import React from 'react';
import { Overlay } from 'react-native-elements';

const ErrorModal = (props) => {
  const { visible, toggle, error } = props;

  // TODO: give options for buttons, etc.
  return (
    <Overlay isVisible={visible} onBackdropPress={toggle}>
      <Error error={error} />
    </Overlay>
  );
};

export default ErrorModal;
