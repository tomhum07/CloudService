using System.Threading.Tasks;
using CloudService.Application.DTOs.Payment;

namespace CloudService.Application.Interfaces
{
    public interface IPayOSService
    {
        Task<PaymentLinkResponse> CreatePaymentLinkAsync(CreatePaymentLinkRequest request);
        Task<object> GetPaymentLinkInformationAsync(long orderCode);
        Task<object> CancelPaymentLinkAsync(long orderCode, string? cancellationReason = null);
        object VerifyPaymentWebhook(object webhookBody);
        Task<bool> HandleWebhookPaymentSuccessAsync(object webhookData);
    }
}
