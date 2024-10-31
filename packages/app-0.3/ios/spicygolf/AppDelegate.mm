#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
@import Firebase;
#import "RNBootSplash.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"spicygolf";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif




// TODO: 0.63.4 -> 0.74.6 upgrade leftovers
//  need RNBootSplash, FIRApp?

//   NSURL *jsCodeLocation;

//   jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];

//   RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
//                                                       moduleName:@"spicygolf"
//                                                initialProperties:nil
//                                                    launchOptions:launchOptions];
//   rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

//   self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
//   UIViewController *rootViewController = [UIViewController new];
//   rootViewController.view = rootView;
//   [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];

//   self.window.rootViewController = rootViewController;
//   [self.window makeKeyAndVisible];
//   [FIRApp configure];

//   return YES;
// }

// @end
