using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace QLK.Infrastructure.Email;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);
    Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetCode, CancellationToken ct = default);
    Task SendNotificationEmailAsync(string toEmail, string fullName, string title, string message, CancellationToken ct = default);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
        var smtpUsername = emailSettings["SmtpUsername"] ?? "";
        var smtpPassword = emailSettings["SmtpPassword"] ?? "";
        var enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");
        var senderName = emailSettings["SenderName"] ?? "QLK System";
        var senderEmail = emailSettings["SenderEmail"] ?? smtpUsername;

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUsername, smtpPassword),
            EnableSsl = enableSsl
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage, ct);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetCode, CancellationToken ct = default)
    {
        var subject = "[QLK] Yêu cầu đặt lại mật khẩu";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
    .header {{ background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }}
    .code {{ background: #f0f4ff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
    .code span {{ font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }}
    .note {{ color: #888; font-size: 13px; margin-top: 20px; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'><h2>🔐 Đặt lại mật khẩu</h2></div>
    <p>Xin chào <strong>{fullName}</strong>,</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã bên dưới để đặt lại mật khẩu:</p>
    <div class='code'>
      <span>{resetCode}</span>
    </div>
    <p><strong>⏰ Mã này có hiệu lực trong 15 phút.</strong></p>
    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
    <p class='note'>Email này được gửi tự động từ hệ thống QLK - Quản lý kho VNPT. Vui lòng không trả lời.</p>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody, ct);
    }

    public async Task SendNotificationEmailAsync(string toEmail, string fullName, string title, string message, CancellationToken ct = default)
    {
        var subject = $"[QLK] {title}";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
    .header {{ background: linear-gradient(135deg, #11998e, #38ef7d); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -30px -30px 20px; }}
    .message {{ background: #f9f9f9; border-left: 4px solid #11998e; padding: 15px; border-radius: 0 8px 8px 0; margin: 15px 0; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'><h2>🔔 Thông báo hệ thống</h2></div>
    <p>Xin chào <strong>{fullName}</strong>,</p>
    <div class='message'><p>{message}</p></div>
    <p style='color:#888;font-size:13px;'>Email này được gửi tự động từ hệ thống QLK - Quản lý kho VNPT.</p>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody, ct);
    }
}
