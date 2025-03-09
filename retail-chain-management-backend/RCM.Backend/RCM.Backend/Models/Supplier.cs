using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Supplier
    {
        public Supplier()
        {
            PurchaseOrders = new HashSet<PurchaseOrder>();
            SupplierProducts = new HashSet<SupplierProduct>();
        }

        public int SuppliersId { get; set; }
        public string Name { get; set; } = null!;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }

        public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; }
        public virtual ICollection<SupplierProduct> SupplierProducts { get; set; }
    }
}
