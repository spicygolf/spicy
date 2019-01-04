describe('SpicyGolf', () => {
  beforeEach(async () => {
    await device.launchApp();

    await waitFor(element(by.id('profile_tab')))
      .toBeVisible()
      .withTimeout(100);
    try {
      await element(by.id('profile_tab')).tap();
      await element(by.id('logout_button')).tap();
    } catch(e) {}

  });

  it('should be able to login and see app', async () => {

    await expect(element(by.id('login_form_view'))).toBeVisible();

    await element(by.id('email_field'))
      .replaceText('brad@sankatygroup.com');

    await element(by.id('password_field'))
      .replaceText('2fingers');

    await expect(element(by.id('login_button')))
      .toBeVisible();

    await element(by.id('login_button'))
      .tap();

    await expect(element(by.id('feed_tab')))
      .toBeVisible();
    await expect(element(by.id('games_tab')))
      .toBeVisible();
    await expect(element(by.id('profile_tab')))
      .toBeVisible();

  });

})
