using Xunit;
using CloudService.Domain.Entities;

namespace CloudService.UnitTests.Domain.Entities
{
    public class EntityTests
    {
        [Fact]
        public void ServicePlan_Creation_ShouldHaveDefaultIsActiveTrue()
        {
            var plan = new ServicePlan();
            Assert.True(plan.IsActive);
        }
    }
}
