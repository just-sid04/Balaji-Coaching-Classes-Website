const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Skipping actual email send.');
      console.log(`[Email Stub] To: ${to} | Subject: ${subject}`);
      console.log(`[Email Stub] Body: \n${html}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Shree Balaji Portal" <noreply@balajicoachingnandurbar.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Password Reset - Shree Balaji Test Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #f97316; text-align: center;">Shree Balaji Coaching Classes</h2>
      <p>Hello,</p>
      <p>You recently requested to reset your password for your account. Click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next hour.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666; text-align: center;">
        If you're having trouble clicking the button, copy and paste the URL below into your web browser:<br/>
        <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
      </p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

const sendAccountApprovedEmail = async (to, name, loginUrl) => {
  const subject = 'Account Approved - Shree Balaji Test Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #22c55e; text-align: center;">Account Approved!</h2>
      <p>Hello ${name},</p>
      <p>Great news! Your account for the <strong>Shree Balaji Test Portal</strong> has been approved by the administrator.</p>
      <p>You can now log in and start taking tests.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
      </div>
      <p>Best of luck with your preparation!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666; text-align: center;">Shree Balaji Coaching Classes</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

const sendAccountRejectedEmail = async (to, name) => {
  const subject = 'Account Registration Update - Shree Balaji Test Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #ef4444; text-align: center;">Registration Update</h2>
      <p>Hello ${name},</p>
      <p>We regret to inform you that your registration for the <strong>Shree Balaji Test Portal</strong> has not been approved at this time.</p>
      <p>If you believe this is a mistake, please contact the administration office directly.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666; text-align: center;">Shree Balaji Coaching Classes</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
};
