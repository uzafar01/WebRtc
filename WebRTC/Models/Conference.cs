using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebRTC.Models
{
    public class Conference
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string SessionId { get; set; }
        public DateTime CreatedOn { get; set; }
        public bool IsPrivate { get; set; }
        public string CreatedBy { get; set; }
    }
}