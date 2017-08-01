using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MongoDB.Driver;
using Conference.Data.Repository;
using Conference.Entities;
using Conference.Data.Repository;
using System.Threading;
using System.Threading.Tasks;

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
            return View(model);
        }

        [HttpPost]
        public JsonResult CreateConference(Conference.Entities.Conference model)
        {
            var insert = conferenceRepo.Insert(model);
            if (insert != null)
            {
                var conferenceList = conferenceRepo.GetAll();
                return new JsonResult(){  Data = true, JsonRequestBehavior= JsonRequestBehavior.AllowGet };
            }
            else
                return new JsonResult() { Data = false, JsonRequestBehavior = JsonRequestBehavior.AllowGet };

        }
    }
}
