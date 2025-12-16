using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Windows.Services.Store;

namespace RetailMobile.Presentation.Views;

public partial class CartItemViewModel:ObservableObject
{
    public CartItem Model { get; }

    public int ProductId => Model.ProductId;
    public string Name => Model.Name;
    public decimal Price => Model.Price;

    public string Category => Model.Category;
    public string ImageUrl => Model.ImageUrl;

    [ObservableProperty]
    public string _formattedPrice;

    [ObservableProperty]
    private int _quantity;

    [ObservableProperty]
    private bool _isSelected;

    public CartItemViewModel(CartItem model)
    {
        Model = model;
        Quantity = model.Quantity;
        IsSelected = model.IsSelected;
        FormattedPrice = $"{model.Price:N0}₫";
    }

    public void SyncToModel()
    {
        Model.Quantity = Quantity;
        Model.IsSelected = IsSelected;
    }
    partial void OnIsSelectedChanged(bool value)
    {
        Model.IsSelected = value;
    }
}
