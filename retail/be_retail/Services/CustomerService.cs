using be_retail.Models;
using be_retail.DTOs;

using be_retail.Repositories;

namespace be_retail.Services
{
    public class CustomerService
    {
        private readonly CustomerRepository _repository;

        public CustomerService(CustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<(List<Customer> Data, int Total)> GetPagedAsync(
            string? search,
            string? sortBy,
            bool desc,
            int page,
            int pageSize)
        {
            var customers = await _repository.GetPagedAsync(search, sortBy, desc, page, pageSize);
            var total = await _repository.CountAsync(search);
            return (customers, total);
        }

        public async Task<Customer?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<Customer?> CreateAsync(CustomerCreateForm form)
        {

            var c = await _repository.GetByPhoneAsync(form.Phone!);

            if (c != null) {
                c.Name = form.Name;
                c.Phone = form.Phone;
                c.Email = form.Email;
                c.Address = form.Address;

                return await _repository.UpdateAsync(c.CustomerId, c);
            }

            // Map DTO → Entity ở Service
            var customer = new Customer
            {
                Name = form.Name,
                Phone = form.Phone,
                Email = form.Email,
                Address = form.Address
            };

            // Gọi Repository chỉ lo save entity
            return await _repository.CreateAsync(customer);
        }


        public async Task<Customer?> UpdateAsync(int id, CustomerUpdateForm form)
        {
             // Map DTO → Entity ở Service
            var customer = new Customer
            {
                Name = form.Name,
                Phone = form.Phone,
                Email = form.Email,
                Address = form.Address
            };

            return await _repository.UpdateAsync(id, customer);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.SoftDeleteAsync(id);
        }
    }
}
