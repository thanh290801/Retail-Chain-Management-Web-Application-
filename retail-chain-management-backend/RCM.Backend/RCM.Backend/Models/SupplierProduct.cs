﻿using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class SupplierProduct
    {
        public int SupplierProductsId { get; set; }
        public int SupplierId { get; set; }
        public int ProductId { get; set; }

        public virtual Product Product { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
    }
}
