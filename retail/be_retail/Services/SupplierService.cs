using be_retail.Models;
using be_retail.Repositories;
using be_retail.DTOs;

namespace be_retail.Services
{
    public class SupplierService
    {
        private readonly SupplierRepository _supplierRepository;

        public SupplierService(SupplierRepository supplierRepository)
        {
            _supplierRepository = supplierRepository;
        }

        public async Task<IEnumerable<Supplier>> GetAllAsync(string? search = null)
        {
            return await _supplierRepository.GetAllAsync(search);
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _supplierRepository.GetByIdAsync(id);
        }

        public async Task<Supplier> CreateAsync(SupplierCreateForm form)
        {
            var supplier = new Supplier
            {
                Name = form.Name,
                Phone = form.Phone,
                Email = form.Email,
                Address = form.Address
            };

            return await _supplierRepository.CreateAsync(supplier);
        }

        public async Task<Supplier?> UpdateAsync(int id, SupplierUpdateForm form)
        {
            var supplier = new Supplier
            {
                Name = form.Name,
                Phone = form.Phone,
                Email = form.Email,
                Address = form.Address
            };

            return await _supplierRepository.UpdateAsync(id, supplier);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _supplierRepository.SoftDeleteAsync(id);
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _supplierRepository.ExistsAsync(id);
        }
    }
}
