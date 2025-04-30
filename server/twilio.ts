import twilio from 'twilio';
import { InsulinLog, Profile } from '@shared/schema';

// Create the Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
  const roundedInsulin = Math.round(log.totalInsulin);
  
  return `${name} took ${roundedInsulin} units of insulin on ${formattedDate} at ${formattedTime} for ${mealTypeText}. 
BG: ${log.bgValue} mmol/L (${log.bgMgdl} mg/dL).
${log.carbValue ? `Carbs: ${log.carbValue}g.` : ''}`;
}

// Send SMS notifications to parents
export async function notifyParents(log: InsulinLog, profile: Profile): Promise<void> {
  if (!profile.notifyParents) {
    return;
  }

  const message = formatInsulinMessage(log, profile.name);
  const phoneNumbers: string[] = [];
  
  // Add mother's phone if available
  if (profile.motherPhone && profile.motherPhone.trim() !== '') {
    phoneNumbers.push(profile.motherPhone);
  }
  
  // Add father's phone if available
  if (profile.fatherPhone && profile.fatherPhone.trim() !== '') {
    phoneNumbers.push(profile.fatherPhone);
  }
  
  // Send SMS to each phone number
  const sendPromises = phoneNumbers.map(phoneNumber => {
    return client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  });
  
  try {
    await Promise.all(sendPromises);
    console.log(`SMS notifications sent to ${phoneNumbers.length} parents`);
  } catch (error) {
    console.error('Error sending SMS notifications:', error);
    throw new Error('Failed to send SMS notifications');
  }
}