const { Resend } = require('resend');
const { getWelcomeEmailTemplate, getOtpEmailTemplate } = require('./emailTemplates');

// Provide a fallback so the server doesn't crash if the key is missing initially
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

const sendWelcomeEmail = async (email, role, name) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[EmailService] RESEND_API_KEY is missing, skipping Welcome Email to:', email);
            return null;
        }

        const subject = role === 'vendor' ? 'Welcome to VeggieMap!' : 'Welcome to VeggieMap!';
        const html = getWelcomeEmailTemplate(name, role);

        const data = await resend.emails.send({
            from: 'VeggieMap <noreply@codewithvin.app>',
            to: email,
            subject: subject,
            html: html,
            reply_to: 'support@codewithvin.app',
        });
        console.log(`Welcome email sent to ${email}`, data);
        return data;
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        throw error;
    }
};

const sendOTPEmail = async (email, otp, purpose) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[EmailService] RESEND_API_KEY is missing, skipping OTP Email to:', email);
            return null;
        }

        let subject = 'Your VeggieMap Verification Code';
        
        if (purpose === 'reset-password') {
            subject = 'Reset Your VeggieMap Password';
        } else if (purpose === 'change-email') {
            subject = 'Verify Your New Email Address';
        } else if (purpose === 'verify-email') {
            subject = 'Verify Your Email Address';
        }

        const html = getOtpEmailTemplate(otp, purpose);

        const data = await resend.emails.send({
            from: 'VeggieMap Auth <noreply@codewithvin.app>',
            to: email,
            subject: subject,
            html: html,
            reply_to: 'support@codewithvin.app',
        });
        console.log(`OTP email sent to ${email}`, data);
        return data;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        throw error;
    }
};

module.exports = {
    sendWelcomeEmail,
    sendOTPEmail
};
