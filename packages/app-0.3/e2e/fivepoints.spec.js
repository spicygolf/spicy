describe('SpicyGolf', () => {
  beforeAll(async () => {
    // for dev - TODO: remove
    await waitFor(element(by.id('games_tab')))
      .toBeVisible()
      .withTimeout(3000);

    return;

    await device.launchApp();

    // if we are logged into the app, logout to start fresh at login
    await waitFor(element(by.id('profile_tab')))
      .toBeVisible()
      .withTimeout(100);
    try {
      await element(by.id('profile_tab')).tap();
      await element(by.id('logout_button')).tap();
    } catch (e) {}

    console.log('hai');

    // login
    await expect(element(by.id('login_form_view'))).toBeVisible();

    await element(by.id('email_field')).replaceText('brad@sankatygroup.com');

    await element(by.id('password_field')).replaceText('2fingers');

    await expect(element(by.id('login_button'))).toBeVisible();

    await element(by.id('login_button')).tap();
  });

  it('should be able to view app', async () => {
    await expect(element(by.id('games_tab'))).toBeVisible();
  });

  it('should be able to create new 5 points game', async () => {
    // **************************************
    // create new game
    await element(by.id('games_tab')).tap();

    await expect(element(by.id('new_game'))).toBeVisible();

    await element(by.id('new_game')).tap();

    await element(by.id('new_65384954')).tap();

    await element(by.id('create_game')).tap();

    // if for some reason we already have a round, create a new one for this
    // test game
    try {
      await waitFor(element(by.id('add_new_round')))
        .toBeVisible()
        .withTimeout(100);

      await element(by.id('add_new_round')).tap();
    } catch (e) {}

    // **************************************
    // add players to game
    // TODO: means we have 3 favorites already, kinda brittle, fix later
    await element(by.id('add_player_button')).tap();

    await element(by.id('add_player_favorites_0')).tap();

    await element(by.id('add_player_button')).tap();

    await element(by.id('add_player_favorites_1')).tap();

    await element(by.id('add_player_button')).tap();

    await element(by.id('add_player_favorites_2')).tap();

    // **************************************
    // select course, tee

    await element(by.id('tee_selector_0')).tap();

    // TODO: means DHGC Presidents tee is a favorite - kinda brittle, fix later
    await element(by.id('favorite_tee_77958051')).tap();

    // **************************************
    // choose teams

    await waitFor(element(by.id('game_setup_teams_card')))
      .toBeVisible()
      .whileElement(by.id('game_setup_scrollview'))
      .scroll(350, 'down');

    await element(by.id('game_setup_add_player_to_team_1_0')).tap();

    await element(by.id('game_setup_add_player_to_team_2_1')).tap();

    await element(by.id('game_setup_add_player_to_team_2_2')).tap();

    await element(by.id('game_setup_add_player_to_team_1_3')).tap();

    // **************************************
    // score game

    await element(by.id('game_score_tab')).tap();

    return;

    // **************************************
    // clean up after our test
    await element(by.id('game_setup_tab')).tap();

    // until LogBox errors are cleared, need to tap the scrollview
    await element(by.id('game_setup_scrollview')).tap({ x: 10, y: 10 });

    await element(by.id('game_setup_scrollview')).scrollTo('bottom');
    await element(by.id('admin_delete_game')).tap();

    await element(by.id('admin_delete_game_yes')).tap();
  });
});
