using be_retail.Api;
using be_retail.DTOs;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/payments")]
    class PaymentsController : ControllerBase
    {
        private readonly PaymentService _service;
        public PaymentsController(Services.PaymentService service)
        {
            _service = service;
        }

    }
}