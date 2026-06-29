using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace SharpDevFramework;

/// <summary>
/// 数据库操作辅助类
/// </summary>
public static class DbHelper
{
    /// <summary>
    /// 构建多条件 OR LIKE 查询表达式
    /// </summary>
    /// <typeparam name="TEntity">实体类型</typeparam>
    /// <param name="propertyName">属性名称</param>
    /// <param name="filters">过滤条件数组</param>
    /// <returns>查询表达式</returns>
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
