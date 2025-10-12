using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    
    [ApiController]
    [Route("api/v1/orderitems")]
    class OrderItemsController : ControllerBase
    {
        private readonly Services.OrderItemService _service;
        public OrderItemsController(Services.OrderItemService service)
        {
            _service = service;
        }
    }
}