import { SpicyPlayerSearchContext } from "common/components/spicy/player/searchContext";
import SpicyPlayerSearchInput from "common/components/spicy/player/searchInput";
import SpicyPlayerSearchResults from "common/components/spicy/player/searchResults";

const SpicySearchPlayer = ({ state, setState, onPress }) => {
  return (
    <SpicyPlayerSearchContext.Provider
      value={{
        state,
        setState,
        onPress,
      }}
    >
      <SpicyPlayerSearchInput />
      <SpicyPlayerSearchResults />
    </SpicyPlayerSearchContext.Provider>
  );
};

export default SpicySearchPlayer;
