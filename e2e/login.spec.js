describe('SpicyGolf', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have login screen', async () => {

    await element(by.id('profile_tab')).tap();
    await element(by.id('logout_button')).tap();

    await expect(element(by.id('login_form_view'))).toBeVisible();

    await element(by.id('email_field'))
      .replaceText('brad@sankatygroup.com');

    await element(by.id('password_field'))
      .replaceText('2fingers');

/*
    await expect(element(by.id('login_button')))
      .toBeVisible();

    await element(by.id('login_button'))
      .tap();
*/
  });

})
