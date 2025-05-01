import twilio from 'twilio';
import { InsulinLog, Profile } from '@shared/schema';
import nodemailer from 'nodemailer';
import webpush from 'web-push';

// Create the Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Setup Nodemailer for email notifications with DuoCircle SMTP
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Configure web-push for push notifications only if keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:bepo@talaich.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Utility function to format the message
function formatInsulinMessage(log: InsulinLog, name: string): string {
  // Format date as "on Apr 30 at 15:25"
  const dateObj = new Date(log.timestamp);
  const formattedDate = dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const mealTypeText = log.mealType === 'first' 
    ? 'breakfast' 
    : log.mealType === 'other' 
      ? 'a meal' 
      : 'bedtime';
  
  // Round to the nearest whole unit of insulin
  const totalInsulin = typeof log.totalInsulin === 'string' ? parseFloat(log.totalInsulin) : log.totalInsulin;
  const roundedInsulin = Math.round(totalInsulin);
  
  return `${name} took ${roundedInsulin} units of insulin on ${formattedDate} at ${formattedTime} for ${mealTypeText}. 
BG: ${log.bgValue} mmol/L (${log.bgMgdl} mg/dL).
${log.carbValue ? `Carbs: ${log.carbValue}g.` : ''}`;
}

// Format an HTML email message
function formatEmailHtml(log: InsulinLog, name: string): string {
  const dateObj = new Date(log.timestamp);
  const formattedDate = dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const mealTypeText = log.mealType === 'first' 
    ? 'breakfast' 
    : log.mealType === 'other' 
      ? 'a meal' 
      : 'bedtime';
  
  // Round to the nearest whole unit of insulin
  const totalInsulin = typeof log.totalInsulin === 'string' ? parseFloat(log.totalInsulin) : log.totalInsulin;
  const roundedInsulin = Math.round(totalInsulin);
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6cf7;">BEPO Insulin Calculator Update</h2>
      <div style="background-color: #f9f9f9; border-radius: 10px; padding: 15px; margin: 20px 0;">
        <p style="font-size: 16px;">
          <strong>${name}</strong> took <strong>${roundedInsulin} units of insulin</strong> 
          on ${formattedDate} at ${formattedTime} for ${mealTypeText}.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; border-top: 1px solid #ddd;"><strong>Blood Glucose:</strong></td>
            <td style="padding: 8px; border-top: 1px solid #ddd;">${log.bgValue} mmol/L (${log.bgMgdl} mg/dL)</td>
          </tr>
          ${log.carbValue ? `
          <tr>
            <td style="padding: 8px; border-top: 1px solid #ddd;"><strong>Carbohydrates:</strong></td>
            <td style="padding: 8px; border-top: 1px solid #ddd;">${log.carbValue}g</td>
          </tr>` : ''}
        </table>
      </div>
      <p style="color: #666; font-size: 14px;">
        This is an automated notification from the BEPO Insulin Calculator.
      </p>
    </div>
  `;
}

// Send notifications to contacts based on profile settings
export async function notifyContacts(log: InsulinLog, profile: Profile): Promise<void> {
  if (!profile.notifyContacts) {
    return;
  }

  const textMessage = formatInsulinMessage(log, profile.name);
  const emailSubject = `${profile.name} Insulin Update`;
  const emailHtml = formatEmailHtml(log, profile.name);
  
  const notificationMethod = profile.notificationMethod || 'sms';
  
  // Arrays to store contacts for each notification type
  const phoneNumbers: string[] = [];
  const emailAddresses: string[] = [];
  
  // Add parent1 contacts if available
  if (profile.parent1Name) {
    if (profile.parent1Phone && profile.parent1Phone.trim() !== '') {
      phoneNumbers.push(profile.parent1Phone);
    }
    if (profile.parent1Email && profile.parent1Email.trim() !== '') {
      emailAddresses.push(profile.parent1Email);
    }
  }
  
  // Add parent2 contacts if available
  if (profile.parent2Name) {
    if (profile.parent2Phone && profile.parent2Phone.trim() !== '') {
      phoneNumbers.push(profile.parent2Phone);
    }
    if (profile.parent2Email && profile.parent2Email.trim() !== '') {
      emailAddresses.push(profile.parent2Email);
    }
  }
  
  // Add caregiver contacts if available
  if (profile.caregiverName) {
    if (profile.caregiverPhone && profile.caregiverPhone.trim() !== '') {
      phoneNumbers.push(profile.caregiverPhone);
    }
    if (profile.caregiverEmail && profile.caregiverEmail.trim() !== '') {
      emailAddresses.push(profile.caregiverEmail);
    }
  }
  
  try {
    // Send notifications based on the selected method
    if (notificationMethod === 'sms') {
      await sendSmsNotifications(phoneNumbers, textMessage);
    } else if (notificationMethod === 'email') {
      await sendEmailNotifications(emailAddresses, emailSubject, emailHtml, textMessage);
    } else if (notificationMethod === 'push') {
      // Push notifications will be handled separately through the subscription endpoint
      // But we'll fallback to email if available, or SMS if not
      if (emailAddresses.length > 0) {
        await sendEmailNotifications(emailAddresses, emailSubject, emailHtml, textMessage);
      } else if (phoneNumbers.length > 0) {
        await sendSmsNotifications(phoneNumbers, textMessage);
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw new Error('Failed to send notifications');
  }
}

// Send SMS notifications
async function sendSmsNotifications(phoneNumbers: string[], message: string): Promise<void> {
  if (phoneNumbers.length === 0) {
    console.log('No phone numbers provided for SMS notifications');
    return;
  }
  
  const sendPromises = phoneNumbers.map(phoneNumber => {
    return twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: phoneNumber,
    });
  });
  
  try {
    await Promise.all(sendPromises);
    console.log(`SMS notifications sent to ${phoneNumbers.length} contacts`);
  } catch (error) {
    console.error('Error sending SMS notifications:', error);
    throw new Error('Failed to send SMS notifications');
  }
}

// Send email notifications
export async function sendEmailNotifications(
  emailAddresses: string[], 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<void> {
  if (emailAddresses.length === 0) {
    console.log('No email addresses provided for email notifications');
    return;
  }
  
  const sendPromises = emailAddresses.map(email => {
    return emailTransporter.sendMail({
      from: 'BEPO Insulin Calculator <bepo@talaich.com>',
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    });
  });
  
  try {
    await Promise.all(sendPromises);
    console.log(`Email notifications sent to ${emailAddresses.length} contacts`);
  } catch (error) {
    console.error('Error sending email notifications:', error);
    throw new Error('Failed to send email notifications');
  }
}

// Legacy function for backward compatibility
export async function notifyParents(log: InsulinLog, profile: Profile): Promise<void> {
  return notifyContacts(log, profile);
}

// Send push notification
export async function sendPushNotification(subscription: webpush.PushSubscription, data: any): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured for push notifications');
    throw new Error('Push notifications are not properly configured');
  }
  
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(data)
    );
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw new Error('Failed to send push notification');
  }
}