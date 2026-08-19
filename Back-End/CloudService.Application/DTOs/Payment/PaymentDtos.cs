namespace CloudService.Application.DTOs.Payment
{
    public class CreatePaymentLinkRequest
    {
        public int OrderId { get; set; }
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }
    }

    public class PaymentLinkResponse
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string QrCode { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string Bin { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
