using System.Threading.Tasks;

namespace CloudService.Application.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody);
        Task<bool> SendOtpResetPasswordAsync(string toEmail, string fullName, string otpCode);
        Task<bool> SendOrderSuccessNotificationAsync(string toEmail, string customerName, string orderCode, string planName, decimal price);
        Task<bool> SendAffiliateApprovalNotificationAsync(string toEmail, string fullName);
        Task<bool> SendAffiliateRejectionNotificationAsync(string toEmail, string fullName);
    }
}
