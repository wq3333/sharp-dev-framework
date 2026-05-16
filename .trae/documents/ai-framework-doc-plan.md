# 计划：为 SharpDevFramework 编写 AI 友好文档

## 目标
编写一份专门面向 AI 的文档，让 AI 能快速、准确地理解 SharpDevFramework 类库和 SharpDevFramework.Demo 模板的设计理念、架构、API、扩展机制和代码约定，从而在后续开发中正确使用框架。

## 与现有文档的区别
现有 `docs/index.md` 是面向人类开发者的使用指南。AI 文档需要额外关注：
- **精确的代码签名和类型信息**（AI 生成代码需要准确知道方法参数、返回值、泛型约束）
- **模块间的依赖关系和数据流**（AI 需要理解调用链才能正确编排代码）
- **约定和约束的显式声明**（人类可以推断的隐式规则，AI 需要明确写出）
- **常见操作的标准模板代码**（AI 可直接套用的代码模式）
- **易错点和注意事项**（AI 容易犯错的地方需要特别强调）

## 实施步骤

### 步骤 1：创建 AI 框架文档
**文件**: `docs/ai-framework-guide.md`

文档结构如下：

#### 1. 概述与架构总览
- 框架定位：基于 .NET 10.0 的全栈 Web 开发框架
- 技术栈清单（含版本号）
- 项目结构：类库 vs 模板 vs Demo 的关系
- 架构图：请求处理管线 + 数据流

#### 2. 启动与配置（精确签名）
- `AddSharpDevFramework<TDbContext>()` 完整签名、泛型约束、参数说明
- `UseSharpDevFramework()` 完整签名
- `assemblies` 参数的作用机制
- 配置文件加载链与优先级
- `framework.json` 完整配置 Schema（所有字段、类型、默认值、可选值）

#### 3. 数据库层（精确类型与约束）
- `FrameworkDbContext` 抽象类定义、内置 DbSet
- `BaseEntity` 完整字段定义
- 自定义 DbContext 的精确写法（含泛型参数约束）
- 自定义实体的精确写法
- `DbHelper.BuildOrLikeExpression` 完整签名与使用场景
- 迁移命令
- 数据库文件路径与目录结构

#### 4. 认证与授权（完整流程与 API）
- JWT 认证完整流程（登录 → Token 签发 → 请求验证 → 角色检查）
- `TokenService` 所有方法签名（GenerateToken、GenerateSpecialToken、VerifyToken）
- `JwtPayload` 完整字段
- `AuthFilter` 行为规则（跳过条件、Token 获取来源、角色匹配逻辑）
- `[Role]` 和 `[SpecialToken]` 特性使用方式
- `[AllowAnonymous]` 使用方式
- `HttpContext.GetJwtPayload()` 扩展方法
- 账户锁定机制参数
- `UsersController` 所有端点（路由、HTTP 方法、权限、请求/响应类型）
- `UserOperationLogsController` 所有端点

#### 5. 后台任务系统（完整模式）
- `BaseTask` 抽象类完整成员（protected/public 字段和方法）
- `[TaskRegister]` 和 `[TaskSequential]` 特性
- `TaskCenter` 核心方法签名
- 任务创建与发布的标准代码模式
- `TaskEntity` 字段定义
- `TaskStates` 枚举值
- 任务状态流转图
- 重试机制细节
- SignalR 实时通知机制
- `DataCleanupTask` 与配置

#### 6. 枚举系统
- 标准 C# enum 写法
- `[MockEnum]` 特性使用方式与合并规则
- 框架内置枚举（UserRoleTypes、FrameworkTaskTypes）与扩展模式
- `/api/enums` 响应格式

#### 7. 服务注册（DI）
- `IScopedService`/`ISingletonService`/`ITransientService` 标记接口
- 自动扫描机制
- 框架内置服务清单

#### 8. 过滤器系统
- `ExceptionFilter` 行为与响应格式
- `OperationLogFilter` 行为（记录内容、跳过规则、批量写入机制）
- 配置开关

#### 9. 统一响应类型
- `EmptyReply`、`DataReply<T>`、`PageReply<T>` 的使用方式
- `PageRequest` 基类字段
- Controller 标准模式代码

#### 10. 静态路径与文件系统
- `SharpFrameworkStatics` 所有路径常量
- 目录自动创建机制
- JWT 密钥文件与初始凭据文件

#### 11. 前端架构（模板专属）
- 技术栈与文件结构
- 主题系统
- API 客户端层
- 认证流程
- 枚举缓存
- SignalR 客户端
- UI 组件清单
- 添加新页面的步骤

#### 12. 扩展指南（标准操作模板）
- 添加新业务实体 + CRUD 的完整步骤与代码模板
- 添加新后台任务的完整步骤与代码模板
- 添加新枚举的完整步骤
- 添加新角色的方式
- 添加新页面的方式
- 配置数据清理的方式

#### 13. 易错点与注意事项
- DbContext 必须继承 FrameworkDbContext 而非 DbContext
- BaseEntity 的 CreatedAt 是 UTC 时间戳而非 DateTime
- 软删除需要手动 Where 过滤
- TaskEntity 保存后才能获取 Id 再发布
- MockEnum 的 MockEnumName 必须与框架内置名称一致才能合并
- TaskRegister 的 Type 必须与 TaskTypes 常量值一致
- assemblies 参数必须包含项目自身程序集

### 步骤 2：验证文档
- 对照源代码检查文档中的所有方法签名、类型信息、配置项的准确性
- 确保代码示例可以直接复制使用

## 文件位置
- 主文档：`docs/ai-framework-guide.md`
- 保留现有 `docs/index.md` 不变
