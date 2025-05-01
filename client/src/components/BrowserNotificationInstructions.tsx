import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from 'lucide-react';

type Browser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';

// Browser detection function
function detectBrowser(): Browser {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edg') === -1) {
    return 'chrome';
  } else if (userAgent.indexOf('firefox') > -1) {
    return 'firefox';
  } else if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1) {
    return 'safari';
  } else if (userAgent.indexOf('edg') > -1) {
    return 'edge';
  } else if (userAgent.indexOf('opr') > -1 || userAgent.indexOf('opera') > -1) {
    return 'opera';
  } else {
    return 'unknown';
  }
}

// Instructions for different browsers
const browserInstructions = {
  chrome: {
    title: 'Enable Notifications in Chrome',
    steps: [
      'Click the lock icon (🔒) in the address bar',
      'Select "Site settings"',
      'Find "Notifications" in the permissions list',
      'Change the setting from "Block" to "Allow"',
      'Refresh this page'
    ],
    link: 'https://support.google.com/chrome/answer/3220216'
  },
  firefox: {
    title: 'Enable Notifications in Firefox',
    steps: [
      'Click the lock icon (🔒) in the address bar',
      'Click on "Connection secure" > "More Information"',
      'Go to "Permissions" tab',
      'Find "Send Notifications" and remove the "Block" setting',
      'Refresh this page'
    ],
    link: 'https://support.mozilla.org/en-US/kb/push-notifications-firefox'
  },
  safari: {
    title: 'Enable Notifications in Safari',
    steps: [
      'From the Safari menu, select "Preferences"',
      'Click the "Websites" tab',
      'Select "Notifications" from the left sidebar',
      'Find this website in the list and change permission to "Allow"',
      'Refresh this page'
    ],
    link: 'https://support.apple.com/guide/safari/notifications-sfri40734/mac'
  },
  edge: {
    title: 'Enable Notifications in Edge',
    steps: [
      'Click the lock icon (🔒) in the address bar',
      'Select "Site permissions"',
      'Find "Notifications" in the list',
      'Change the setting from "Block" to "Allow"',
      'Refresh this page'
    ],
    link: 'https://support.microsoft.com/en-us/microsoft-edge/manage-website-permissions-in-microsoft-edge-9c5c2c03-172c-d89f-25bd-b78262e7f5fd'
  },
  opera: {
    title: 'Enable Notifications in Opera',
    steps: [
      'Click the site info button in the address bar',
      'Find "Notifications" in the permissions',
      'Change the setting from "Block" to "Allow"',
      'Refresh this page'
    ],
    link: 'https://help.opera.com/en/latest/web-preferences/'
  },
  unknown: {
    title: 'Enable Browser Notifications',
    steps: [
      'Look for site permissions in your browser settings',
      'Find notification permissions for this website',
      'Change the setting from "Block" to "Allow"',
      'Refresh this page'
    ],
    link: null
  }
};

export function BrowserNotificationInstructions() {
  const [browser, setBrowser] = useState<Browser>('unknown');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const instructions = browserInstructions[browser];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          className="text-amber-700 p-0 h-auto font-normal text-sm underline hover:text-amber-900 hover:no-underline" 
          onClick={() => setOpen(true)}
        >
          <Info className="h-4 w-4 mr-1" />
          How to enable notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{instructions.title}</DialogTitle>
          <DialogDescription>
            Follow these steps to enable notifications in your browser:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ol className="list-decimal pl-5 space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          {instructions.link && (
            <Button 
              variant="outline" 
              onClick={() => window.open(instructions.link!, '_blank')}
              className="flex items-center"
            >
              Browser Help
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
