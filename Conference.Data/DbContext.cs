using System;
using System.Configuration;
using MongoDB.Driver;
using System.Security.Authentication;

namespace Conference.Data
{
    public class DbContext
    {
        // Reading credentials from Web.config file   
        //not using app settings anymore
        //public string MongoDatabaseName = ConfigurationManager.AppSettings["MongoDatabaseName"]; 
        //string MongoUsername = ConfigurationManager.AppSettings["MongoUsername"];
        //string MongoPassword = ConfigurationManager.AppSettings["MongoPassword"]; 
        //string MongoPort = ConfigurationManager.AppSettings["MongoPort"]; 
        //string MongoHost = ConfigurationManager.AppSettings["MongoHost"];  
        public MongoClientSettings Settings = null;


        public string MongoDatabaseName = "";
        string connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        //azure mongo db as service
        // @"mongodb://mymongo:y9fjvvmnUQ93QdKFpnUWYGQ0acnTR5M8g46i0F7YjUb8uxWs9kjUCBD8I1xOXQYGspM9iDSjSK61tR8I2vFIug==@mymongo.documents.azure.com:10255/?ssl=true&replicaSet=globaldb";



        public DbContext()
        {

            //local host mongo db, db details from app settings
            //// Creating credentials  
            //var credential = MongoCredential.CreateMongoCRCredential
            //                 (MongoDatabaseName,
            //                  MongoUsername,
            //                  MongoPassword);

            //// Creating MongoClientSettings
            // Settings = new MongoClientSettings
            // {
            //  //   Credentials = new[] { credential },

            //     Server = new MongoServerAddress(MongoHost, Convert.ToInt32(MongoPort))


            // };


            //connection string from web config for both local and azure
            var mongoUrl = new MongoUrl(connectionString);
            this.Settings = MongoClientSettings.FromUrl(mongoUrl);
            this.Settings.SslSettings = new SslSettings() { EnabledSslProtocols = SslProtocols.Tls12 };
            this.MongoDatabaseName = mongoUrl.DatabaseName;
        }

    }
}
