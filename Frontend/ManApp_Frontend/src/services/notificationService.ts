import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { fetchJson, API_BASE } from "./apiClient";

// How notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return undefined;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      "00000000-0000-0000-0000-000000000000"; // Fallback so it doesn't crash on missing ID

    // In Expo SDK 53, getting push tokens on Android strictly requires a Dev Build.
    // In Expo Go, evaluating this will either fail or warn. We can catch it to prevent blocking login.
    try {
      if (Constants.appOwnership === "expo") {
        console.warn(
          "Expo Go SDK 53 doesn't support Android Push tokens. Use a Development Build to get real tokens.",
        );
        // We can mock it or just let it proceed to get expo push token and fail gracefully
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("EXPO PUSH TOKEN:", token);

      // Save to Laravel backend
      await fetchJson(`${API_BASE}/user/push-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch (tokenError) {
      // Just log it without crashing the login process
      console.log(
        "Push token registration skipped or failed in Expo Go:",
        tokenError,
      );
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}
