using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace CloudService.WebApi.Hubs
{
    public class DataSyncHub : Hub
    {
        // Hub xử lý kết nối realtime giữa Admin Portal và Client Frontend
        public async Task BroadcastDataChanged(string entity, string action)
        {
            await Clients.Others.SendAsync("DataChanged", entity, action);
        }
    }
}
