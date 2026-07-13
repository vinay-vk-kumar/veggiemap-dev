const getBaseTemplate = (title, content, preheader = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            margin: 0;
            padding: 0;
            color: #18181b;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #22c55e 0%, #059669 100%);
            padding: 40px 40px;
            text-align: center;
        }
        .logo {
            display: inline-block;
            background: #ffffff;
            color: #16a34a;
            font-weight: 900;
            font-size: 24px;
            width: 48px;
            height: 48px;
            line-height: 48px;
            border-radius: 14px;
            margin-bottom: 16px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px;
            font-size: 16px;
            line-height: 1.6;
            color: #3f3f46;
        }
        .content h2 {
            color: #18181b;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 16px;
        }
        .otp-box {
            background-color: #f0fdf4;
            border: 2px dashed #86efac;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
        }
        .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 40px;
            font-weight: 900;
            color: #16a34a;
            letter-spacing: 8px;
            margin: 0;
        }
        .footer {
            background-color: #fafafa;
            padding: 32px 40px;
            text-align: center;
            font-size: 14px;
            color: #71717a;
            border-top: 1px solid #f4f4f5;
        }
        .btn {
            display: inline-block;
            background-color: #18181b;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            margin-top: 24px;
        }
        /* Hidden Preheader Text */
        .preheader {
            display: none;
            max-height: 0px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    ${preheader ? `<span class="preheader">${preheader}</span>` : ''}
    <div class="container">
        <div class="header">
            <div class="logo">V</div>
            <h1>VeggieMap</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} VeggieMap. All rights reserved.</p>
            <p>Fresh from the farm, straight to your block.</p>
        </div>
    </div>
</body>
</html>
`;

const getWelcomeEmailTemplate = (name, role) => {
    const isVendor = role === 'vendor';
    const preheader = isVendor ? 'Welcome to VeggieMap! Ready to sell your fresh produce?' : 'Welcome to VeggieMap! Find fresh local produce today.';

    const content = `
        <h2>Welcome aboard, ${name}! 👋</h2>
        <p>We are absolutely thrilled to have you join the VeggieMap community.</p>
        
        ${isVendor
            ? `<p>Your vendor account is now fully active. You can now list your fresh produce, update your live location, and start reaching local customers in your neighborhood immediately.</p>
               <a href="https://veggiemap.codewithvin.app/dashboard" class="btn">Go to Dashboard</a>`
            : `<p>Your customer account is ready! You can now start exploring the map to find mobile vegetable carts and local shops right in your neighborhood.</p>
               <a href="https://veggiemap.codewithvin.app/map" class="btn">Explore the Map</a>`
        }
        
        <p style="margin-top: 32px;">If you have any questions, simply reply to this email. We're here to help!</p>
    `;

    return getBaseTemplate('Welcome to VeggieMap', content, preheader);
};

const getOtpEmailTemplate = (otp, purpose) => {
    let title = 'Your Verification Code';
    let preheader = 'Your VeggieMap verification code is inside.';
    let message = 'Please use the following 6-digit code to verify your action:';

    if (purpose === 'reset-password') {
        title = 'Reset Your Password';
        message = 'We received a request to reset your VeggieMap password. Please use the verification code below:';
        preheader = 'Code to reset your VeggieMap password.';
    } else if (purpose === 'change-email') {
        title = 'Verify New Email';
        message = 'Please use the following code to verify your new email address:';
        preheader = 'Code to verify your new email address.';
    } else if (purpose === 'verify-email') {
        title = 'Verify Your Email';
        message = 'Thank you for signing up for VeggieMap! Please verify your email address using the code below:';
        preheader = 'Code to verify your VeggieMap account.';
    }

    const content = `
        <h2>${title}</h2>
        <p>${message}</p>
        
        <div class="otp-box">
            <p class="otp-code">${otp}</p>
        </div>
        
        <p><strong>Note:</strong> This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    `;

    return getBaseTemplate(title, content, preheader);
};

module.exports = {
    getWelcomeEmailTemplate,
    getOtpEmailTemplate
};
