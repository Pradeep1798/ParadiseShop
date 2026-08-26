import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';

export async function initNotifications() {
  await notifee.requestPermission(); // needed on Android 13+

  await notifee.createChannel({
    id: 'shop-reminders',
    name: 'Shop Reminders',
    importance: AndroidImportance.HIGH,
  });
}

export async function scheduleDailyCloseReminder(hour = 21, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() < Date.now()) {
    date.setDate(date.getDate() + 1); // if that time already passed today, start tomorrow
  }

  await notifee.createTriggerNotification(
    {
      id: 'daily-close-reminder', // fixed id — re-creating just replaces it, no duplicates
      title: "Time to close today's bill",
      body: 'Check your sales, expenses, and cash in hand for today.',
      android: { channelId: 'shop-reminders' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
}

export async function notifyWeeklyReportReady(shopName: string) {
  await notifee.displayNotification({
    title: 'Weekly report ready',
    body: `${shopName}'s report has been generated and is ready to view.`,
    android: { channelId: 'shop-reminders' },
  });
}
