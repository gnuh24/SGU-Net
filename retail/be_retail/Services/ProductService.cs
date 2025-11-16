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
            int pageSize,
            int? categoryId,
            int? supplierId,
            string? categoryName,
            string? supplierName,
            bool? isDeleted)
        {
            var products = await _repository.GetPagedAsync(
                search, sortBy, desc, page, pageSize, categoryId, supplierId, categoryName, supplierName, isDeleted);
            var total = await _repository.CountAsync(search, categoryId, supplierId, categoryName, supplierName, isDeleted);
            return (products, total);
        }

        public async Task<List<Product>> GetByBarcodeAsync(string barcode)
        {
            return await _repository.FindByBarcodeAsync(barcode);
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
                Name = form.Name,
                Barcode = form.Barcode,
                Image = form.Image,
                Price = form.Price,
                Unit = form.Unit ?? "pcs",
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
                Name = form.Name,
                Barcode = form.Barcode,
                Image = form.Image,
                Price = form.Price,
                Unit = form.Unit ?? "pcs",
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

        // Các API by-category/by-supplier đã được tích hợp vào GetPagedAsync
    }
}
