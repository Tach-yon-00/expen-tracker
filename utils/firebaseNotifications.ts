import { AuthorizationStatus, getMessaging, getToken, onMessage, requestPermission, setBackgroundMessageHandler, subscribeToTopic } from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// Request permission from the user for notifications (specifically iOS, Android 13+)
export async function requestUserPermission() {
    const authStatus = await requestPermission(getMessaging());
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    } else {
        console.log('Push notification permission denied');
    }
}

// Get the FCM token for this specific device and subscribe to global topic
export async function getFCMToken() {
    try {
        const token = await getToken(getMessaging());
        console.log('FCM Token:', token);

        // Subscribe to a global topic so developer can send to EVERYONE without knowing tokens
        await subscribeToTopic(getMessaging(), 'all_users');
        console.log('Successfully subscribed to topic: all_users');

        return token;
    } catch (error) {
        console.error('Error getting FCM token or subscribing to topic:', error);
        return null;
    }
}

// Background handler function. This NEEDS to be called early in the app lifecycle (index or _layout)
export function setupBackgroundMessageHandler() {
    setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
        // You can also add local analytics, badge counts, or context updates here
    });
}

// Foreground handler hook/setup
export function setupForegroundMessageHandler() {
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
        console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));

        // Show an alert when the app is open
        Alert.alert(
            remoteMessage.notification?.title || 'New Notification',
            remoteMessage.notification?.body || 'You have a new message'
        );
    });

    return unsubscribe; // Return the unsubscribe function to clean up when unmounting
}
