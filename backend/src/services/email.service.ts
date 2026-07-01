import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, code: string) => {
  const {error} = await resend.emails.send({
    from: "AI Code Review <onboarding@resend.dev>",
    to: email,
    subject: "Your password reset code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #6B7280; margin-bottom: 24px;">
          Use the code below to reset your password. 
          It expires in <strong>15 minutes</strong>.
        </p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 0;">
            ${code}
          </p>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
          The code will expire automatically.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] sendPasswordResetEmail failed:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const { error } = await resend.emails.send({
    from: "AI Code Review <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #6B7280; margin-bottom: 24px;">
          Welcome to AI Code Review! Use the code below to verify your email.
          It expires in <strong>15 minutes</strong>.
        </p>
        <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 0;">
            ${code}
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] sendVerificationEmail failed:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
};
