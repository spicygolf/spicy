import React, { useState, } from 'react';

import { GhinPlayerSearchContext } from 'common/components/ghin/player/searchContext';
import GhinPlayerSearchInput from 'common/components/ghin/player/searchInput';
import GhinPlayerSearchResults from 'common/components/ghin/player/searchResults';



const GhinSearchPlayer = ({setFn}) => {

  const defaultGhinPlayerSearch = {
    country: 'USA',
    state: 'GA',
    lastName: 'Carter',
    firstName: 'Chris',
  };

  const [ ghinPlayerSearch, setGhinPlayerSearch ] = useState(defaultGhinPlayerSearch);

  return (
    <GhinPlayerSearchContext.Provider
      value={{
        ghinPlayerSearch,
        setGhinPlayerSearch,
      }}
    >
      <GhinPlayerSearchInput />
      <GhinPlayerSearchResults setFn={setFn} />
    </GhinPlayerSearchContext.Provider>
  )
};

export default GhinSearchPlayer;
