describe('SpicyGolf', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have login screen', async () => {
    await expect(element(by.id('login_form_view'))).toExist();

    await element(by.id('email_field'))
      .replaceText('brad@sankatygroup.com');

    await element(by.id('password_field'))
      .replaceText('2fingers');

    await element(by.id('login_button'))
      .tap();

  });

})
