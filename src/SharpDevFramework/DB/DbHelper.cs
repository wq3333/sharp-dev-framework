using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace SharpDevFramework.DB;

public static class DbHelper
{
    public static Expression<Func<TEntity, bool>> BuildOrLikeExpression<TEntity>(string propertyName, string[] filters) where TEntity : class
    {
        var parameter = Expression.Parameter(typeof(TEntity), "u");
        var property = Expression.Property(parameter, propertyName);
        var wrapped = Expression.Call(
            typeof(string).GetMethod("Concat", [typeof(string), typeof(string)])!,
            Expression.Constant(","),
            Expression.Call(
                typeof(string).GetMethod("Concat", [typeof(string), typeof(string)])!,
                property,
                Expression.Constant(",")
            )
        );

        Expression? combined = null;
        foreach (var filter in filters)
        {
            var likePattern = $"%{filter}%";
            var likeMethod = typeof(DbFunctionsExtensions).GetMethod("Like", [typeof(DbFunctions), typeof(string), typeof(string)]);
            var likeCall = Expression.Call(
                null,
                likeMethod!,
                Expression.Constant(EF.Functions),
                wrapped,
                Expression.Constant(likePattern)
            );
            combined = combined == null ? likeCall : Expression.OrElse(combined, likeCall);
        }
        return Expression.Lambda<Func<TEntity, bool>>(combined!, parameter);
    }
}
