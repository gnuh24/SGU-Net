using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Models.Order;

namespace RetailMobile.Models.Payment;

public sealed record PaymentProcessingData(
    OrderCreateDto OrderData,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount
);
