using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;

namespace be_retail.Services
{
    class PaymentService
    {
        private readonly PaymentRepository _repository;
        public PaymentService(PaymentRepository repository)
        {
            _repository = repository;
        }
    }
}