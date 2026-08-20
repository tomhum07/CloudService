using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Orders;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class OrderRequestService : IOrderRequestService
    {
        private readonly ApplicationDbContext _context;

        public OrderRequestService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<OrderRequestDto>> GetOrderRequestsAsync(int pageNumber = 1, int pageSize = 10, int? status = null, string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            IQueryable<OrderRequest> query = _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                        .ThenInclude(sp => sp!.Category)
                .AsNoTracking();

            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(o =>
                    o.CustomerName.ToLower().Contains(search) ||
                    o.CustomerEmail.ToLower().Contains(search) ||
                    o.CustomerPhone.ToLower().Contains(search) ||
                    (o.CompanyName != null && o.CompanyName.ToLower().Contains(search)) ||
                    (o.PlanPrice != null && o.PlanPrice.Plan != null && o.PlanPrice.Plan.Name.ToLower().Contains(search)));
            }

            var totalItems = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = orders.Select(MapToDto).ToList();

            return new PagedResult<OrderRequestDto>
            {
                Items = items,
                TotalItems = totalItems,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<IEnumerable<OrderRequestDto>> GetAllOrdersAsync()
        {
            var list = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                        .ThenInclude(sp => sp!.Category)
                .OrderByDescending(o => o.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(MapToDto);
        }

        public async Task<OrderRequestDto?> GetByIdAsync(int id)
        {
            var order = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                        .ThenInclude(sp => sp!.Category)
                .FirstOrDefaultAsync(o => o.Id == id);

            return order == null ? null : MapToDto(order);
        }

        public async Task<OrderRequestDto> CreateOrderRequestAsync(CreateOrderRequestDto dto)
        {
            int planPriceId = 0;

            if (dto.PlanPriceId.HasValue && dto.PlanPriceId.Value > 0)
            {
                planPriceId = dto.PlanPriceId.Value;
            }
            else if (dto.PlanId.HasValue && dto.PlanId.Value > 0)
            {
                var price = await _context.PlanPrices
                    .Where(p => p.PlanId == dto.PlanId.Value && p.IsActive)
                    .FirstOrDefaultAsync();

                if (price != null) planPriceId = price.Id;
            }
            else if (!string.IsNullOrWhiteSpace(dto.PlanName))
            {
                var plan = await _context.ServicePlans
                    .Where(p => p.Name.ToLower().Contains(dto.PlanName.ToLower()))
                    .FirstOrDefaultAsync();

                if (plan != null)
                {
                    var price = await _context.PlanPrices
                        .Where(p => p.PlanId == plan.Id && p.IsActive)
                        .FirstOrDefaultAsync();

                    if (price != null) planPriceId = price.Id;
                }
            }

            // Fallback: If no price found, pick first active price
            if (planPriceId == 0)
            {
                var firstPrice = await _context.PlanPrices.FirstOrDefaultAsync();
                if (firstPrice != null) planPriceId = firstPrice.Id;
            }

            var entity = new OrderRequest
            {
                PlanPriceId = planPriceId,
                CustomerName = dto.CustomerName,
                CustomerEmail = dto.CustomerEmail,
                CustomerPhone = dto.CustomerPhone,
                CompanyName = dto.CompanyName,
                Notes = dto.Notes,
                Status = 0, // New
                IsActive = true
            };

            await _context.OrderRequests.AddAsync(entity);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(entity.Id))!;
        }

        public async Task<OrderRequestDto?> UpdateStatusAsync(int id, UpdateOrderStatusDto dto)
        {
            var order = await _context.OrderRequests.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return null;

            var oldStatus = order.Status;
            order.Status = dto.Status;
            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                    ? dto.Notes
                    : (order.Notes.Contains(dto.Notes) ? order.Notes : $"{order.Notes} | {dto.Notes}");
            }

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<IEnumerable<OrderRequestDto>> GetCustomerOrdersAsync(string emailOrUsername)
        {
            var search = emailOrUsername.ToLower().Trim();
            var orders = await _context.OrderRequests
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                        .ThenInclude(sp => sp!.Category)
                .Where(o => o.CustomerEmail.ToLower() == search || o.CustomerName.ToLower().Contains(search))
                .OrderByDescending(o => o.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return orders.Select(MapToDto);
        }

        public async Task<byte[]> ExportOrdersToExcelAsync()
        {
            var orders = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                .OrderByDescending(o => o.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            using var workbook = new ClosedXML.Excel.XLWorkbook();
            var worksheet = workbook.Worksheets.Add("DanhSachDonHang");

            // Header titles
            var headers = new[]
            {
                "Mã Đơn Hàng", "Khách Hàng", "Email", "Số Điện Thoại", "Công Ty",
                "Gói Dịch Vụ", "Chu Kỳ", "Giá Tiền (VNĐ)", "Trạng Thái", "Ngày Đặt", "Ghi Chú"
            };

            for (int col = 0; col < headers.Length; col++)
            {
                var cell = worksheet.Cell(1, col + 1);
                cell.Value = headers[col];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
                cell.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromArgb(37, 99, 235); // Blue 600
                cell.Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;
            }

            int row = 2;
            foreach (var o in orders)
            {
                var dto = MapToDto(o);
                worksheet.Cell(row, 1).Value = dto.OrderCode;
                worksheet.Cell(row, 2).Value = dto.CustomerName;
                worksheet.Cell(row, 3).Value = dto.CustomerEmail;
                worksheet.Cell(row, 4).Value = dto.CustomerPhone;
                worksheet.Cell(row, 5).Value = dto.CompanyName ?? "";
                worksheet.Cell(row, 6).Value = dto.PlanName;
                worksheet.Cell(row, 7).Value = dto.BillingCycle;
                worksheet.Cell(row, 8).Value = (double)dto.Price;
                worksheet.Cell(row, 8).Style.NumberFormat.Format = "#,##0";
                worksheet.Cell(row, 9).Value = dto.StatusName;
                worksheet.Cell(row, 10).Value = dto.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
                worksheet.Cell(row, 11).Value = dto.Notes ?? "";
                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new System.IO.MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> ExportOrdersToCsvAsync()
        {
            var orders = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                .OrderByDescending(o => o.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Ma Don Hang,Khach Hang,Email,So Dien Thoai,Cong Ty,Goi Dich Vu,Chu Ky,Gia Tien,Trang Thai,Ngay Dat,Ghi Chu");

            foreach (var o in orders)
            {
                var dto = MapToDto(o);
                var line = $"\"{dto.OrderCode}\",\"{EscapeCsv(dto.CustomerName)}\",\"{EscapeCsv(dto.CustomerEmail)}\",\"{EscapeCsv(dto.CustomerPhone)}\",\"{EscapeCsv(dto.CompanyName ?? "")}\",\"{EscapeCsv(dto.PlanName)}\",\"{dto.BillingCycle}\",\"{dto.Price}\",\"{dto.StatusName}\",\"{dto.CreatedAt:yyyy-MM-dd HH:mm:ss}\",\"{EscapeCsv(dto.Notes ?? "")}\"";
                sb.AppendLine(line);
            }

            var preamble = Encoding.UTF8.GetPreamble();
            var contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
            var result = new byte[preamble.Length + contentBytes.Length];
            Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
            Buffer.BlockCopy(contentBytes, 0, result, preamble.Length, contentBytes.Length);

            return result;
        }

        private static string EscapeCsv(string text)
        {
            return text.Replace("\"", "\"\"");
        }

        private static OrderRequestDto MapToDto(OrderRequest o)
        {
            decimal price = o.PlanPrice?.Price ?? 0;

            // Nếu trong Notes có ghi nhận số tiền thanh toán thực tế sau khi giảm giá hoặc qua PayOS, ưu tiên hiển thị đúng số tiền đó
            if (!string.IsNullOrEmpty(o.Notes))
            {
                // Hỗ trợ [Tổng tiền: 2.000đ], [Tổng tiền: 2,000đ], [PayOS: Đã thanh toán 2.000đ], [Số tiền: 2000đ]
                var match = System.Text.RegularExpressions.Regex.Match(o.Notes, @"(?:Tổng tiền|Đã thanh toán|Số tiền|Gia tien):\s*([\d\.\,]+)\s*(?:đ|vnd|đồng)?", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var cleanNum = match.Groups[1].Value.Replace(".", "").Replace(",", "").Trim();
                    if (decimal.TryParse(cleanNum, out decimal parsedAmount) && parsedAmount > 0)
                    {
                        price = parsedAmount;
                    }
                }
            }

            return new OrderRequestDto
            {
                Id = o.Id,
                PlanPriceId = o.PlanPriceId,
                PlanName = o.PlanPrice?.Plan?.Name ?? "Dịch vụ Cloud",
                CategoryName = o.PlanPrice?.Plan?.Category?.Name ?? "Hạ tầng",
                BillingCycle = o.PlanPrice?.BillingCycle ?? "Monthly",
                Price = price,
                CustomerName = o.CustomerName,
                CustomerEmail = o.CustomerEmail,
                CustomerPhone = o.CustomerPhone,
                CompanyName = o.CompanyName,
                Status = o.Status,
                Notes = o.Notes,
                CreatedAt = o.CreatedAt
            };
        }
    }
}
