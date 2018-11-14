describe('SpicyGolf', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have login screen', async () => {
    await expect(element(by.id('title'))).toBeVisible();

    await element(by.label('Email').and(by.type('RCTUITextField')))
      .replaceText('brad@sankatygroup.com');

    await element(by.label('Password').and(by.type('RCTUITextField')))
      .replaceText('2fingers');

    await element(by.label('Login').and(by.traits(['button'])))
      .tap();

  });

})
