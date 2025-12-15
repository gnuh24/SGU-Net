using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models;

public class TokenRecord
{
    [System.ComponentModel.DataAnnotations.Key]
    public int Id { get; set; }
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
