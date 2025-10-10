using be_retail.Models;
using be_retail.DTOs;

using be_retail.Repositories;

namespace be_retail.Services
{
    public class ProductService
    {
        private readonly ProductRepository _repository;

        public ProductService(ProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<(List<Product> Data, int Total)> GetPagedAsync(
            string? search,
            string? sortBy,
            bool desc,
            int page,
            int pageSize)
        {
            var products = await _repository.GetPagedAsync(search, sortBy, desc, page, pageSize);
            var total = await _repository.CountAsync(search);
            return (products, total);
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<Product> CreateAsync(ProductCreateForm form)
        {
            // Map DTO → Entity ở Service
            var product = new Product
            {
                ProductName = form.ProductName,
                Barcode = form.Barcode,
                Price = form.Price,
                Unit = form.Unit,
                CategoryId = form.CategoryId,
                SupplierId = form.SupplierId
            };

            // Gọi Repository chỉ lo save entity
            return await _repository.CreateAsync(product);
        }


        public async Task<Product?> UpdateAsync(int id, ProductUpdateForm form)
        {
             // Map DTO → Entity ở Service
            var product = new Product
            {
                ProductName = form.ProductName,
                Barcode = form.Barcode,
                Price = form.Price,
                Unit = form.Unit,
                IsDeleted = form.IsDeleted,
                CategoryId = form.CategoryId,
                SupplierId = form.SupplierId
            };

            return await _repository.UpdateAsync(id, product);
        }

        public async Task<Product?> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
