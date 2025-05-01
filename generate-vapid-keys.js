import webpush from 'web-push';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys generated:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('\nTo use these keys:');
console.log('1. Add them to your environment variables:');
console.log('VAPID_PUBLIC_KEY=', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=', vapidKeys.privateKey);
console.log('\n2. Use the public key in your frontend to register push subscriptions');
