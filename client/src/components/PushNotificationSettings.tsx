import React from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { BrowserNotificationInstructions } from './BrowserNotificationInstructions';

export function PushNotificationSettings() {
  const {
    isSupported,
    isDenied,
    isSubscribed,
    subscriptionStatus,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-blue-600">Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-blue-600 flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive insulin log notifications directly on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {isSubscribed ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Enabled
              </Badge>
            ) : isDenied ? (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Blocked
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Disabled
              </Badge>
            )}
          </div>
          
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          ) : !isDenied ? (
            <Button
              variant="outline"
              size="sm"
              onClick={subscribe}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enable
            </Button>
          ) : null}
        </div>

        {isDenied && (
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
            <p className="mb-2">
              Notifications are blocked. Please update your browser settings to allow notifications from this site.
            </p>
            <BrowserNotificationInstructions />
          </div>
        )}

        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="mt-2"
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
