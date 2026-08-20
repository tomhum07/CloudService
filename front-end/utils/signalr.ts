import * as signalR from "@microsoft/signalr";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tomhum07.me";

type DataSyncCallback = (entity: string, action: string) => void;

class SignalRDataSyncService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Set<DataSyncCallback> = new Set();
  private isConnecting = false;

  public init() {
    if (typeof window === "undefined") return;
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/datasync`, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    this.connection.on("DataChanged", (entity: string, action: string) => {
      this.listeners.forEach((callback) => {
        try {
          callback(entity, action);
        } catch (err) {
          console.warn("Lỗi listener SignalR:", err);
        }
      });
    });

    this.start();

    // Fallback: Khi người dùng quay lại tab/cửa sổ sau khi chuyển tab
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.listeners.forEach((callback) => {
            try {
              callback("all", "refresh");
            } catch {}
          });
        }
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("focus", () => {
        this.listeners.forEach((callback) => {
          try {
            callback("all", "refresh");
          } catch {}
        });
      });
    }
  }

  private async start() {
    if (!this.connection || this.isConnecting) return;
    if (this.connection.state === signalR.HubConnectionState.Connected) return;

    this.isConnecting = true;
    try {
      await this.connection.start();
    } catch (err) {
      // Sẽ tự động kết nối lại
    } finally {
      this.isConnecting = false;
    }
  }

  public subscribe(callback: DataSyncCallback): () => void {
    this.init();
    this.listeners.add(callback);

    // Trả về hàm cleanup hủy đăng ký
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const dataSyncService = new SignalRDataSyncService();
