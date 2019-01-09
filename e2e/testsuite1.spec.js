describe('SpicyGolf', () => {

  beforeAll(async () => {

    // for dev - TODO: remove
    await waitFor(element(by.id('games_tab')))
      .toBeVisible()
      .withTimeout(3000);

    return;



    await device.launchApp();

    await waitFor(element(by.id('profile_tab')))
      .toBeVisible()
      .withTimeout(100);
    try {
      await element(by.id('profile_tab')).tap();
      await element(by.id('logout_button')).tap();
    } catch(e) {}

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

    await expect(element(by.id('feed_tab')))
      .toBeVisible();
    await expect(element(by.id('games_tab')))
      .toBeVisible();
    await expect(element(by.id('profile_tab')))
      .toBeVisible();

  });

  it('should be able to create new 5 points game', async () => {

    await expect(element(by.id('new_game')))
      .toBeVisible();

    await element(by.id('new_game'))
      .tap();

    await element(by.id('new_five_points'))
      .tap();

    await element(by.id('add_player_button'))
      .tap();

  });

})
