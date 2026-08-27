export interface PlanSpecItem {
  label: string;
  value: string;
  isMono?: boolean;
}

export interface CategorySpecConfig {
  field1Label: string;
  field1Placeholder: string;
  field2Label: string;
  field2Placeholder: string;
  field3Label: string;
  field3Placeholder: string;
  field4Label: string;
  field4Placeholder: string;
}

export function getCategorySpecConfig(categoryNameOrSlug: string = ""): CategorySpecConfig {
  const cat = (categoryNameOrSlug || "").toLowerCase();

  if (cat.includes("domain") || cat.includes("tên miền") || cat.includes("ten-mien")) {
    return {
      field1Label: "Đuôi Tên Miền / Cấp Độ",
      field1Placeholder: "VD: .COM Quốc Tế, .VN Quốc Gia",
      field2Label: "Hệ Thống Quản Trị DNS",
      field2Placeholder: "VD: DNS Anycast Tốc Độ Cao",
      field3Label: "Bảo Mật Whois Privacy",
      field3Placeholder: "VD: Ẩn Danh Whois Miễn Phí",
      field4Label: "Thời Hạn Đăng Ký",
      field4Placeholder: "VD: Từ 1 - 10 Năm"
    };
  }

  if (cat.includes("ssl") || cat.includes("chứng chỉ")) {
    return {
      field1Label: "Loại Chứng Chỉ SSL",
      field1Placeholder: "VD: Xác thực Domain (DV) hoặc Doanh nghiệp (OV)",
      field2Label: "Số Lượng / Phạm Vi Tên Miền",
      field2Placeholder: "VD: 1 Tên miền đơn hoặc Wildcard (*.domain.com)",
      field3Label: "Độ Dài Khóa Mã Hóa",
      field3Placeholder: "VD: Mã hóa 256-bit SHA-2",
      field4Label: "Hạn Mức Bảo Hiểm Bồi Thường",
      field4Placeholder: "VD: Bảo hiểm $10,000 USD"
    };
  }

  if (cat.includes("email") || cat.includes("thư") || cat.includes("mail")) {
    return {
      field1Label: "Số Lượng Hộp Thư",
      field1Placeholder: "VD: 10 Hộp thư riêng theo tên miền",
      field2Label: "Tiện Ích & Giao Thức",
      field2Placeholder: "VD: Webmail Pro & Outlook, IMAP/SMTP",
      field3Label: "Dung Lượng Lưu Trữ",
      field3Placeholder: "VD: 20 GB / Hộp thư",
      field4Label: "Bộ Lọc & Giới Hạn Gửi",
      field4Placeholder: "VD: Antispam AI & 99.9% Inbox"
    };
  }

  if (cat.includes("firewall") || cat.includes("ddos") || cat.includes("bảo mật") || cat.includes("bao-mat")) {
    return {
      field1Label: "Tầng Bảo Vệ & Công Nghệ",
      field1Placeholder: "VD: Layer 3, 4 & 7 WAF",
      field2Label: "Độ Trễ Phản Hồi",
      field2Placeholder: "VD: < 2ms Tức thì",
      field3Label: "Quy Mô Hạ Tầng",
      field3Placeholder: "VD: Cụm Cloud Multi-Region",
      field4Label: "Công Suất Lọc Băng Thông",
      field4Placeholder: "VD: 100 Gbps+ Anti-DDoS"
    };
  }

  // Mặc định: Cloud VPS, Hosting, Dedicated Server
  return {
    field1Label: "Số Nhân CPU / Vi Xử Lý",
    field1Placeholder: "VD: 2 vCPU AMD EPYC",
    field2Label: "Bộ Nhớ RAM",
    field2Placeholder: "VD: 4 GB ECC DDR4",
    field3Label: "Dung Lượng Ổ Cứng (Storage)",
    field3Placeholder: "VD: 50 GB NVMe Gen4",
    field4Label: "Băng Thông Mạng",
    field4Placeholder: "VD: 1 Gbps Không giới hạn"
  };
}

export function getCategoryPlanSpecs(
  categoryNameOrSlug: string = "",
  plan: {
    cpu?: string | null;
    ram?: string | null;
    storage?: string | null;
    bandwidth?: string | null;
  }
): PlanSpecItem[] {
  const cat = (categoryNameOrSlug || "").toLowerCase();

  const isDomain = cat.includes("domain") || cat.includes("tên miền") || cat.includes("ten-mien");
  const isSsl = cat.includes("ssl") || cat.includes("chứng chỉ");
  const isEmail = cat.includes("email") || cat.includes("thư") || cat.includes("mail");
  const isFirewall = cat.includes("firewall") || cat.includes("ddos") || cat.includes("bảo mật") || cat.includes("bao-mat");

  const cleanVal = (val?: string | null) => {
    if (!val) return "";
    const trimmed = val.trim();
    if (trimmed.toLowerCase() === "n/a" || trimmed === "-" || trimmed.toLowerCase() === "null") return "";
    return trimmed;
  };

  const cpu = cleanVal(plan.cpu);
  const ram = cleanVal(plan.ram);
  const storage = cleanVal(plan.storage);
  const bandwidth = cleanVal(plan.bandwidth);

  const items: PlanSpecItem[] = [];

  if (isDomain) {
    if (cpu) items.push({ label: "Đuôi tên miền", value: cpu, isMono: true });
    if (ram) items.push({ label: "Hệ thống DNS", value: ram });
    if (storage) items.push({ label: "Bảo vệ Whois", value: storage });
    if (bandwidth) items.push({ label: "Thời hạn đăng ký", value: bandwidth });

    if (items.length === 0) {
      items.push({ label: "Hệ thống DNS", value: "DNS Anycast Toàn Cầu" });
      items.push({ label: "Bảo mật", value: "Whois Privacy Miễn Phí" });
      items.push({ label: "Thời hạn", value: "Đăng ký từ 1 năm" });
    }
  } else if (isSsl) {
    if (cpu) items.push({ label: "Loại chứng chỉ", value: cpu });
    if (ram) items.push({ label: "Số lượng tên miền", value: ram });
    if (storage) items.push({ label: "Mã hóa", value: storage, isMono: true });
    if (bandwidth) items.push({ label: "Bảo hiểm bồi thường", value: bandwidth });

    if (items.length === 0) {
      items.push({ label: "Mã hóa", value: "256-bit SHA-2", isMono: true });
      items.push({ label: "Bảo hiểm", value: "Bảo hiểm $10,000 USD" });
      items.push({ label: "Cấp phát", value: "Kích hoạt tức thì" });
    }
  } else if (isEmail) {
    if (cpu) items.push({ label: "Số lượng hộp thư", value: cpu });
    if (ram) items.push({ label: "Tiện ích & Webmail", value: ram });
    if (storage) items.push({ label: "Dung lượng lưu trữ", value: storage });
    if (bandwidth) items.push({ label: "Bộ lọc & Giới hạn", value: bandwidth });

    if (items.length === 0) {
      items.push({ label: "Địa chỉ Mail", value: "Theo tên miền riêng" });
      items.push({ label: "Bộ lọc", value: "Antispam AI & Antivirus" });
      items.push({ label: "Tỷ lệ Inbox", value: "99.9% Cam kết" });
    }
  } else if (isFirewall) {
    if (cpu) items.push({ label: "Tầng bảo vệ", value: cpu });
    if (ram) items.push({ label: "Độ trễ", value: ram });
    if (storage) items.push({ label: "Công nghệ", value: storage });
    if (bandwidth) items.push({ label: "Công suất lọc", value: bandwidth });
  } else {
    // Cloud VPS, Hosting, Dedicated Server
    if (cpu) items.push({ label: "Vi xử lý (CPU)", value: cpu, isMono: true });
    if (ram) items.push({ label: "Bộ nhớ (RAM)", value: ram, isMono: true });
    if (storage) items.push({ label: "Ổ cứng (Disk)", value: storage, isMono: true });
    if (bandwidth) items.push({ label: "Băng thông", value: bandwidth });
  }

  return items;
}
