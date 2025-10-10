using be_retail.Models;
using be_retail.Repositories;
using be_retail.DTOs;

namespace be_retail.Services
{
    public class CategoryService
    {
        private readonly CategoryRepository _categoryRepository;

        public CategoryService(CategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<Category>> GetAllAsync(string? search = null)
        {
            return await _categoryRepository.GetAllAsync(search);
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            return await _categoryRepository.GetByIdAsync(id);
        }

        public async Task<Category> CreateAsync(CategoryCreateForm form)
        {
            var category = new Category
            {
                Name = form.Name
            };

            return await _categoryRepository.CreateAsync(category);
        }

        public async Task<Category?> UpdateAsync(int id, CategoryUpdateForm form)
        {
            var category = new Category
            {
                Name = form.Name
            };

            return await _categoryRepository.UpdateAsync(id, category);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _categoryRepository.SoftDeleteAsync(id);
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _categoryRepository.ExistsAsync(id);
        }
    }
}
