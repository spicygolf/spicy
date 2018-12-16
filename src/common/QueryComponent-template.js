

const token = await AsyncStorage.getItem('token');

const { pkey } = jwtDecode(token);
await this.setState(_prev => {
  cpKey: pkey
});


<Query
  query={GET_PLAYER_QUERY}
  variables={{
    player: this.state.cpKey
  }}
  fetchPolicy='cache-and-network'
>
  {({ loading, error, _data }) => {
    if( loading ) return (<ActivityIndicator />);

    // TODO: error component instead of below...
    if( error ) {
      console.log(error);
      return (<Text>Error</Text>);
    }

    return (
      <YourAwesomeComponent />
    );
  }}
</Query>
