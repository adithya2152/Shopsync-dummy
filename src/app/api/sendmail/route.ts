import { sendMail } from "@/helper/mailer";

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    const credentials = await request.json();
    const { email, otp } = credentials;

    console.log("Received", email, otp);

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, statusText: "Bad Request" }
      );
    }

    // Send the email
    await sendMail({
    email,
    subject: "Your ShopSync Email Verification Code",
    // A cleaner plain-text version for non-HTML clients
    text: `Your one-time verification code for ShopSync is: ${otp}\n\nThis code will expire in 10 minutes.\n\nThanks,\nThe ShopSync Team`,
    
    // The new, styled HTML content
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>ShopSync OTP Verification</title>
      <style>
        /* Basic Reset */
        body, h1, p {
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          background-color: #f4f4f7;
          color: #333333;
        }
        /* Main Container */
        .email-container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 1px solid #e2e2e7;
          border-radius: 8px;
          overflow: hidden;
        }
        /* Header */
        .header {
          background-color: #4F46E5; /* A modern indigo color */
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 600;
        }
        /* Content */
        .content {
          padding: 32px;
          line-height: 1.6;
        }
        .content p {
          font-size: 16px;
          margin-bottom: 24px;
        }
        /* OTP Code Box */
        .otp-code {
          background-color: #f4f4f7;
          color: #4F46E5;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 4px;
          padding: 16px;
          text-align: center;
          border-radius: 6px;
          margin-bottom: 24px;
        }
        /* Footer */
        .footer {
          font-size: 14px;
          color: #888888;
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e2e2e7;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>ShopSync</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Your one-time verification code is below. Please use this code to complete your verification process.</p>
          <div class="otp-code">${otp}</div>
          <p>This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
          <p>Thanks,<br>The ShopSync Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ShopSync. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `,
  });

    console.log("Email sent successfully");
    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { status: 200, statusText: "OK" }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, statusText: "Internal Server Error" }
    );
  }
}
