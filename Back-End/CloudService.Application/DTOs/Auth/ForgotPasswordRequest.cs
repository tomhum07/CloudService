namespace CloudService.Application.DTOs.Auth
{
    public class ForgotPasswordRequest
    {
        public string EmailOrUsername { get; set; } = string.Empty;
    }

    public class VerifyResetOtpRequest
    {
        public string EmailOrUsername { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
