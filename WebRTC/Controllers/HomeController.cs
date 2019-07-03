using System;
using System.Web.Mvc;
using Conference.Data.Repository;
using System.Collections.Generic;

namespace WebRTC.Controllers
{
    public class HomeController : BaseController
    {
        //
        // GET: /Home/

        RepositoryBase<Conference.Entities.Conference> conferenceRepo = new RepositoryBase<Conference.Entities.Conference>();

        public ActionResult Index()
        {           
            return View();            
        }

        [HttpGet]
        public ActionResult GetAllConferences()
        {
           // var model = conferenceRepo.GetAll();
            return PartialView("AllConference",new List<Conference.Entities.Conference>());
        }


        [HttpPost]
        public JsonResult CreateConference(Conference.Entities.Conference model)
        {
            //var insert = conferenceRepo.Insert(model);
            //if (insert != null)
            //{               
            //    return new JsonResult(){  Data = insert, JsonRequestBehavior= JsonRequestBehavior.AllowGet };
            //}
            //else
                return new JsonResult() { Data = false, JsonRequestBehavior = JsonRequestBehavior.AllowGet };

        }

        [HttpPost]
        public JsonResult DeleteConference(string sessionId)
        {
            Guid id = new Guid(sessionId);
            var isDelete = conferenceRepo.DeleteById(id);
            if (isDelete)
            {
                var conferenceList = conferenceRepo.GetAll();
                return new JsonResult() { Data = true, JsonRequestBehavior = JsonRequestBehavior.AllowGet };
            }
            else
                return new JsonResult() { Data = false, JsonRequestBehavior = JsonRequestBehavior.AllowGet };

        }
    }
}
