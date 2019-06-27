using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Conference.Entities
{
    public class Conference : EntityBase
    {
        public string Title { get; set; }
        public string SessionId { get; set; }
        public DateTime CreatedOn { get; set; }
        public bool IsPrivate { get; set; }
        public string CreatedBy { get; set; }
        public string UrlCode { get; set; }
    }
}
