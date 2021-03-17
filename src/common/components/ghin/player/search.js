import React, { useState, } from 'react';

import { GhinPlayerSearchContext } from 'common/components/ghin/player/searchContext';
import GhinPlayerSearchInput from 'common/components/ghin/player/searchInput';
import GhinPlayerSearchResults from 'common/components/ghin/player/searchResults';



const GhinSearchPlayer = ({state, setState}) => {

  return (
    <GhinPlayerSearchContext.Provider
      value={{
        state,
        setState,
      }}
    >
      <GhinPlayerSearchInput />
      <GhinPlayerSearchResults />
    </GhinPlayerSearchContext.Provider>
  )
};

export default GhinSearchPlayer;
