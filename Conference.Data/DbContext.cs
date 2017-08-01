using System;
using System.Configuration;
using MongoDB.Driver;

namespace Conference.Data
{
    public class DbContext
    {
        // Reading credentials from Web.config file   
        public string MongoDatabaseName = ConfigurationManager.AppSettings["MongoDatabaseName"]; 
        string MongoUsername = ConfigurationManager.AppSettings["MongoUsername"];
        string MongoPassword = ConfigurationManager.AppSettings["MongoPassword"]; 
        string MongoPort = ConfigurationManager.AppSettings["MongoPort"]; 
        string MongoHost = ConfigurationManager.AppSettings["MongoHost"];  
        public MongoClientSettings Settings = null;
        public DbContext()
        {
            // Creating credentials  
            var credential = MongoCredential.CreateMongoCRCredential
                            (MongoDatabaseName,
                             MongoUsername,
                             MongoPassword);

            // Creating MongoClientSettings  
            Settings = new MongoClientSettings
            {
               // Credentials = new[] { credential },
                
                Server = new MongoServerAddress(MongoHost, Convert.ToInt32(MongoPort))
            };          
        }       
    }
}
