using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Payment;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPayOSService _payOSService;

        public PaymentController(IPayOSService payOSService)
        {
            _payOSService = payOSService;
        }

        /// <summary>
        /// Tạo link thanh toán PayOS (QR Code & Checkout URL) cho đơn hàng
        /// </summary>
        [HttpPost("create-link")]
        [Authorize]
        public async Task<IActionResult> CreatePaymentLink([FromBody] CreatePaymentLinkRequest request)
        {
            try
            {
                var result = await _payOSService.CreatePaymentLinkAsync(request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Không thể tạo link thanh toán PayOS: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy thông tin thanh toán của đơn hàng theo OrderCode
        /// </summary>
        [HttpGet("info/{orderCode}")]
        public async Task<IActionResult> GetPaymentInfo(long orderCode)
        {
            try
            {
                var info = await _payOSService.GetPaymentLinkInformationAsync(orderCode);
                return Ok(info);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi truy vấn đơn hàng: {ex.Message}" });
            }
        }

        /// <summary>
        /// Hủy link thanh toán
        /// </summary>
        [HttpPost("cancel/{orderCode}")]
        [Authorize]
        public async Task<IActionResult> CancelPayment(long orderCode, [FromQuery] string? reason)
        {
            try
            {
                var info = await _payOSService.CancelPaymentLinkAsync(orderCode, reason);
                return Ok(info);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi hủy link thanh toán: {ex.Message}" });
            }
        }

        /// <summary>
        /// Webhook IPN tiếp nhận thông báo thanh toán tự động từ PayOS Server
        /// </summary>
        [HttpPost("payos-webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOSWebhook([FromBody] object webhookBody)
        {
            try
            {
                // Tự động kích hoạt đơn hàng khi nhận thông báo thanh toán
                await _payOSService.HandleWebhookPaymentSuccessAsync(webhookBody);

                return Ok(new { success = true, message = "Webhook verified and processed successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Webhook verification failed: {ex.Message}" });
            }
        }
    }
}
