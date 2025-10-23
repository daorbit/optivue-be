import emailService from './utils/emailService.js';

async function testEmail() {
  try {
    const otp = emailService.generateOTP();
    console.log('Generated OTP:', otp);
    console.log('Sending to: mawyqyba@denipl.net');

    const result = await emailService.sendOTPEmail('mawyqyba@denipl.net', otp);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
}

testEmail();