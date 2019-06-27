using System;
using System.Web.Mvc;
using Conference.Data.Repository;

namespace WebRTC.Controllers
{
    public class HomeController : BaseController
    {
        //
        // GET: /Home/

        RepositoryBase<Conference.Entities.Conference> conferenceRepo = new RepositoryBase<Conference.Entities.Conference>();

        public ActionResult Index()
        {
            //Conference.Entities.Conference obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 1";
            //obj.SessionId = "unique 1";
            //conferenceRepo.Insert(obj);

            //obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 2";
            //obj.SessionId = "unique 2";
            //conferenceRepo.Insert(obj);

            //obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 3";
            //obj.SessionId = "unique 3";
            //conferenceRepo.Insert(obj);


            //obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 4";
            //obj.SessionId = "unique 4";
            //conferenceRepo.Insert(obj);

            //obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 5";
            //obj.SessionId = "unique 5";
            //conferenceRepo.Insert(obj);

            //obj = new Conference.Entities.Conference();
            //obj.CreatedBy = "abc";
            //obj.CreatedOn = DateTime.Now.Date;
            //obj.IsPrivate = false;
            //obj.Title = "unique 6";
            //obj.SessionId = "unique 6";

            //conferenceRepo.Insert(obj);

            var model = conferenceRepo.GetAll();
            return View();            
        }

        [HttpGet]
        public ActionResult GetAllConferences()
        {
            var model = conferenceRepo.GetAll();
            return PartialView("AllConference",model);
        }


        [HttpPost]
        public JsonResult CreateConference(Conference.Entities.Conference model)
        {
            var insert = conferenceRepo.Insert(model);
            if (insert != null)
            {
               // var conferenceList = conferenceRepo.GetAll();
                return new JsonResult(){  Data = insert, JsonRequestBehavior= JsonRequestBehavior.AllowGet };
            }
            else
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
