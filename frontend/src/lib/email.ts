import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "WinWin Casino <noreply@winwincasino.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${SITE_URL}/api/auth/verify?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your WinWin Casino account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#1A1A2E;color:#fff;border-radius:12px;padding:32px">
        <h1 style="color:#D4AF37;margin-bottom:8px">WinWin Casino</h1>
        <p style="color:#aaa;margin-bottom:24px">Welcome! Please verify your email address to activate your account.</p>
        <a href="${link}"
           style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#F0C842);color:#000;
                  font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px">
          Verify Email
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px">
          Link expires in 24 hours. If you did not register, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendDepositConfirmedEmail(email: string, amount: number, coin: string, network: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Deposit confirmed — ${amount} ${coin}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#1A1A2E;color:#fff;border-radius:12px;padding:32px">
        <h1 style="color:#D4AF37">WinWin Casino</h1>
        <p>Your deposit has been confirmed and credited to your account.</p>
        <div style="background:#0D0D0D;border-radius:8px;padding:16px;margin:16px 0">
          <p style="color:#aaa;font-size:12px;margin:0">Amount</p>
          <p style="color:#D4AF37;font-size:24px;font-weight:700;margin:4px 0">${amount} ${coin}</p>
          <p style="color:#aaa;font-size:12px;margin:0">Network: ${network}</p>
        </div>
        <a href="${SITE_URL}" style="color:#D4AF37">Go to casino →</a>
      </div>
    `,
  });
}
