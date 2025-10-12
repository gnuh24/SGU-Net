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
        public async Task<PaymentResponseDTO?> GetByIdAsync(int id)
        {
            var payment = await _repository.GetByIdAsync(id);
            if (payment == null) return null;

            return new PaymentResponseDTO
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentDate = payment.PaymentDate
            };
        }
        public async Task<List<PaymentResponseDTO>> GetAllAsync()
        {
            var payments = await _repository.GetAllAsync();
            return payments.Select(p => new PaymentResponseDTO
            {
                PaymentId = p.PaymentId,
                OrderId = p.OrderId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                PaymentDate = p.PaymentDate
            }).ToList();
        }
        public async Task<PaymentResponseDTO?> GetByOrderIdAsync(int orderId)
        {
            var payment = await _repository.GetByOrderIdAsync(orderId);
            if (payment == null) return null;

            return new PaymentResponseDTO
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentDate = payment.PaymentDate
            };
        }
        public async Task<PaymentResponseDTO> CreateAsync(PaymentCreateForm form)
        {
            var payment = new Payment
            {
                OrderId = form.OrderId,
                Amount = form.Amount,
                PaymentMethod = form.PaymentMethod,
                PaymentDate = DateTime.Now
            };

            await _repository.CreateAsync(payment);

            return new PaymentResponseDTO
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentDate = payment.PaymentDate
            };
        }
        public async Task<PaymentResponseDTO?> UpdateAsync(int id, PaymentUpdateForm form)
        {
            var payment = await _repository.GetByIdAsync(id);
            if (payment == null) return null;

            payment.Amount = form.Amount;
            payment.PaymentMethod = form.PaymentMethod;

            await _repository.UpdateAsync(payment);

            return new PaymentResponseDTO
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentDate = payment.PaymentDate
            };
        }
        public async Task<bool> DeleteAsync(int id)
        {
            var payment = await _repository.GetByIdAsync(id);
            if (payment == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}