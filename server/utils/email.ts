import { Resend } from 'resend';

export const sendVerificationEmail = async (email: string, token: string) => {
  const resendSecret = process.env.RESEND_API_KEY;

  if(!resendSecret) {
    throw new Error("Resend API key is missing in environment variables");
  }
  
  const resend = new Resend(resendSecret);
  const verifyLink = `http://localhost:3000/api/auth/verify-email?token=${token}`;

  try {
      if(!resendSecret) {
          console.log(`[EMAIL MOCK] Verification link for ${email}: ${verifyLink}`);
          return;
      }
      
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your SecretHub account',
      html: `
        <h2>Welcome to SecretHub!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verifyLink}">Verify Account</a>
      `,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};
