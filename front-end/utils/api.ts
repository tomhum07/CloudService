const BASE_URL = "http://localhost:5074"; // Địa chỉ HTTP của Backend

let inMemoryToken = "";

export function setAccessToken(token: string) {
  inMemoryToken = token;
}

export function getAccessToken() {
  return inMemoryToken;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Đính kèm Access Token trong Header Authorization nếu có
  if (inMemoryToken) {
    options.headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }

  // Luôn gửi kèm Credentials để trình duyệt tự đính kèm Cookie (chứa Refresh Token)
  options.credentials = "include";

  let response = await fetch(url, options);

  // Cơ chế tự động làm mới Token (Silent Refresh) nếu Access Token hết hạn (Lỗi 401)
  if (response.status === 401 && endpoint !== "/api/auth/login" && endpoint !== "/api/auth/refresh-token") {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Gọi lại request ban đầu với token mới
      options.headers["Authorization"] = `Bearer ${inMemoryToken}`;
      response = await fetch(url, options);
    } else {
      // Nếu Refresh Token cũng hết hạn, chuyển hướng về trang login
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  }

  return response;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include" // Gửi kèm cookie refresh token
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
    }
  } catch (error) {
    console.error("Lỗi tự động gia hạn token:", error);
  }
  return false;
}
