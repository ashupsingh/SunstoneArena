const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: `"SyntaxError" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔐 Your SyntaxError Verification Code',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 40px; color: #e2e8f0;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px;">
                        <span style="color: #e2e8f0;">Syntax</span><span style="color: #818cf8;">Error</span>
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Smart Campus Food Court Monitor</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="font-size: 15px; color: #cbd5e1; margin: 0 0 20px;">Your verification code is:</p>
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #818cf8; background: rgba(129, 140, 248, 0.1); padding: 16px 24px; border-radius: 12px; display: inline-block; border: 1px solid rgba(129, 140, 248, 0.3);">
                        ${otp}
                    </div>
                    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">This code expires in <strong style="color: #f59e0b;">5 minutes</strong>.</p>
                </div>
                <p style="font-size: 12px; color: #475569; text-align: center; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
