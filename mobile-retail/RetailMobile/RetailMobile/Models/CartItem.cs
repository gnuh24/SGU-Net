namespace RetailMobile.Models;

public class CartItem
{
    [System.ComponentModel.DataAnnotations.Key]
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; } = "Electric";
    public string ImageUrl { get; set; } = "https://th.bing.com/th/id/R.dce15c0324197597823c8f59e7896dc9?rik=3JJclYlwC4qgmA&riu=http%3a%2f%2fwww.bdmobilephone.com%2fimages%2fgallery%2fnokia-3310_1787.jpg&ehk=zeAyBlJN%2baxFbxlMjkZRj23%2bD6p8nM2hpmW4mHE8bCc%3d&risl=1&pid=ImgRaw&r=0";
    
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal TotalPrice => Quantity * Price;
}
