using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models;

public sealed record WebViewData 
(
    string? OrderId,
    string PaymentUrl
);

