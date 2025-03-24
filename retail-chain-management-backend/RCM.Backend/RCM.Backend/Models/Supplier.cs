using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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
        public string ContactPerson { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Address { get; set; }
        [Column("Tax_Code")] // 🔹 Đảm bảo đúng với tên cột trong SQL
        public string TaxCode { get; set; }
        public string Fax { get; set; }
        public string Website { get; set; }
        public string R_Phone { get; set; }

        public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; }
        public virtual ICollection<SupplierProduct> SupplierProducts { get; set; }
    }
}
