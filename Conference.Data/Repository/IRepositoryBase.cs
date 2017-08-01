using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Conference.Data.Repository
{
    public interface IRepositoryBase<TEntity> where TEntity : class
    {
        Guid Insert(TEntity entity);
        Task<Guid> InsertAsync(TEntity entity);
        bool Update(TEntity entity);
        Task<bool> UpdateAsync(TEntity entity);
        bool DeleteById(Guid Id);
        IList<TEntity> SearchFor(Expression<Func<TEntity, bool>> filter);
        Task<List<TEntity>> GetAllAsync();
        List<TEntity> GetAll();
        List<TEntity> Find(Expression<Func<TEntity, bool>> filter);
    }
}
