using Conference.Entities;
using MongoDB.Driver;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Conference.Data.Repository
{
    public class RepositoryBase<TEntity> : IRepositoryBase<TEntity> where TEntity : EntityBase
    {
        private IMongoDatabase database;
        private IMongoCollection<TEntity> collection;
        private DbContext db;
        public RepositoryBase()
        {
            db = new DbContext();

            GetDatabase();
            GetCollection();
        }

        public async Task<List<TEntity>> GetAllAsync()
        {
            return await collection.Find(_ => true).ToListAsync();
        }

        public List<TEntity> GetAll()
        {
            return collection.Find(_ => true).ToList();
        }

        public Guid Insert(TEntity entity)
        {
            entity.Id = Guid.NewGuid();
            collection.InsertOne(entity);
            return entity.Id;
        }

        public async Task<Guid> InsertAsync(TEntity entity)
        {
            entity.Id = Guid.NewGuid();
            await collection.InsertOneAsync(entity);
            return entity.Id;
        }


        public bool Update(TEntity entity)
        {           
            return collection.ReplaceOne(x => x.Id == entity.Id, entity).ModifiedCount > 0;
        }

        public async Task<bool> UpdateAsync(TEntity entity)
        {
            return (await collection.ReplaceOneAsync(x => x.Id == entity.Id, entity)).ModifiedCount > 0;
        }

        public bool DeleteById(Guid Id)
        {
            return collection.DeleteOne<TEntity>(x=>x.Id == Id).IsAcknowledged;
        }

        public IList<TEntity> SearchFor(Expression<Func<TEntity, bool>> filter)
        {
            return collection.AsQueryable<TEntity>()
                             .Where(filter.Compile())
                             .ToList();
        }
                
        public List<TEntity> Find(Expression<Func<TEntity, bool>> filter)
        {
            return (collection.Find<TEntity>(filter)).ToList();
        }     

        #region Private Helper Methods
        private void GetDatabase()
        {
            var client = new MongoClient(db.Settings);
          
            database = client.GetDatabase(db.MongoDatabaseName);
        }


        private void GetCollection()
        {
            collection = database
                .GetCollection<TEntity>(typeof(TEntity).Name);
        }
        #endregion

    }
}
