using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{[ApiController]
    [Route("api/v1/payments")]
    class PaymentsController : ControllerBase
    {
        private readonly Services.PaymentService _service;
        public PaymentsController(Services.PaymentService service)
        {
            _service = service;
        }
    }
}