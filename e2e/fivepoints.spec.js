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
    } catch(e) {}

    console.log('hai');

    // login
    await expect(element(by.id('login_form_view'))).toBeVisible();

    await element(by.id('email_field'))
      .replaceText('brad@sankatygroup.com');

    await element(by.id('password_field'))
      .replaceText('2fingers');

    await expect(element(by.id('login_button')))
      .toBeVisible();

    await element(by.id('login_button'))
      .tap();

  });

  it('should be able to view app', async () => {

      await expect(element(by.id('games_tab')))
      .toBeVisible();

  });

  it('should be able to create new 5 points game', async () => {

    // **************************************
    // create new game
    await element(by.id('games_tab'))
      .tap();

    await expect(element(by.id('new_game')))
      .toBeVisible();

    await element(by.id('new_game'))
      .tap();

    await element(by.id('new_65384954'))
      .tap();

    await element(by.id('create_game'))
      .tap();

    // if for some reason we already have a round, create a new one for this
    // test game
    try {
      await waitFor(element(by.id('add_new_round')))
        .toBeVisible()
        .withTimeout(100);

      await element(by.id('add_new_round'))
        .tap();
    } catch(e) {}


    // **************************************
    // add player to game
    await element(by.id('add_player_button'))
      .tap();


    // **************************************
    // clean up after our test
    await element(by.id('game_setup_tab'))
      .tap();

    await element(by.id('game_setup_scrollview')).scrollTo('bottom');
    await element(by.id('admin_delete_game'))
      .tap();

      await element(by.id('game_setup_scrollview')).scrollTo('bottom');
      await element(by.id('admin_delete_game_yes'))
      .tap();


  });

})
