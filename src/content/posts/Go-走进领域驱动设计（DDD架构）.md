---
townId: go-DDD
title: 充血架构：走进领域驱动设计（DDD架构）
description: 领域驱动设计（DDD架构）从理论讲解到落地实践.
category: Golang
series: "Go 项目与架构"
seriesIndex: 2
tags:
  - Golang
  - 后端
  - 微服务
  - 分布式
  - 架构设计
date: 2026-03-27
draft: false
cover: /assets/posts/covers/cover34.webp
coverAlt: 充血架构：走进领域驱动设计（DDD架构）
---
# 浅谈架构设计
说道架构设计，我们首先想到的应该就是我们之前写单体式架构用到的三层架构（handler/controller-service-dao），或者最近学习的微服务架构。世界上没有所谓完美的架构，简单的架构可拓展性低，性能优异的架构实现难度又很高

## 传统三层架构
传统三层架构是一种经典的软件分层模式，将应用程序分为表现层、业务逻辑层和数据访问层。在我们之前实现的单体式架构项目、或者通常的Web开发中，就实现了相应的Handler-Service-Dao的三层架构

这种架构职责分离清晰，上手简单，适用于业务逻辑相对固定的中小型项目。然而，接连不断的问题随着项目复杂程度的增加初见端倪：

在三层架构中，handler层只负责提取请求信息并包装到service层，dao层只负责基础的数据和缓存交互，这样一来当我们的项目越做越大，需要添加的功能越来越多，就会有越来越多的业务逻辑堆积在service层，service层的代码就会无限制地扩大，成为类似于屎山的存在

这就叫做“贫血架构”，在这种架构中，业务逻辑容易“贫血”，大量业务规则和流程代码堆积在Service中，导致Service类日益臃肿，成为“上帝类”，领域知识（业务的核心概念和规则）分散在各处，可维护性和可测试性变差
## MVC架构
MVC架构有些许类似于三层架构，是另一种广为人知的架构模式，主要用于分离用户界面逻辑。Model代表数据和业务规则，View负责展示，Controller处理用户输入。

在Web开发中，MVC常与传统三层架构结合，其中的Controller和View可视为“表现层”，而Model则可能变得“贫血”——仅作为数据的载体，真正的业务逻辑被转移到了Controller或专门的Service中。MVC解决了UI与逻辑的耦合，但对于复杂业务领域内部的组织结构，它并没有提供更多指导

## 贫血模型和充血模型
在对上面两个架构的介绍中，我们可以抽离一个新概念，用于描述一个架构的封装思想——“贫血模型”和“充血模型”

“贫血模型”和“充血模型”是理解架构演进的关键。贫血模型 (Anemic Domain Model)是指对象（如User、Order）只包含数据（字段）和简单的getter/setter，而不包含业务行为。所有业务逻辑都存在于所谓的“服务层”（Service）中。这正是传统三层架构的常见结果

充血模型 (Rich Domain Model)则强调对象应该是“智能”的，它将与该对象紧密相关的数据和行为封装在一起。例如，User对象不仅有Balance字段，还有Transfer(amount)、ChangePassword(newPwd)等方法。业务规则内聚在对象内部，更符合面向对象设计的封装思想。领域驱动设计（DDD）的核心就是构建充血模型

## 贫血模型不能忽视的问题
随着微服务和业务复杂性的爆炸式增长，传统架构面临严峻挑战：

- 业务逻辑分散：核心的业务规则隐藏在庞大的Service方法和流程控制代码中，久而久之变得难以理解和维护
- 技术细节与业务逻辑耦合：数据库操作、缓存、消息队列等基础设施代码与核心业务代码混杂
- 可测试性差：由于高度耦合，单元测试往往需要启动整个应用上下文，变成了集成测试，运行慢且不稳定
- 演进困难：当需要调整业务规则或替换技术组件时，牵一发而动全身，风险高

为了解决这些问题，我们需要一种将业务复杂性置于设计核心的方法论，这就是领域驱动设计（DDD架构）

# 领域驱动设计（DDD架构）
## DDD的意义
在 DDD (领域驱动设计) 中，需要将重点放在领域层（Domain Layer）进行业务逻辑和规则的实现。服务层（Service Layer）主要负责协调和调度各个领域对象之间的交互

简单来说，如果传统模型是重service轻dao的话，对于面向对象充血模型的 DDD 而言，是重 Domain 轻 Service

> 严格来说，因为Go语言本身的简明性和其他机制，DDD架构在Java领域的应用远比Go更富有实际意义。但我们还是需要学会在Go里实现这种架构模式，这种模式不仅仅可以提升我们完成业务的能力，还能让我们对架构设计理念有一个更透彻的认知

DDD不仅是一套架构模式，更是一种思维方式。它强调开发人员、领域专家通过通用语言 (Ubiquitous Language)进行协作，专注于核心业务（核心域）的建模，通过限界上下文 (Bounded Context)划分大型系统的边界，并使用聚合 (Aggregate)、实体 (Entity)、值对象 (Value Object)等模式构建出反映真实业务的、丰富的领域模型。在架构层面，DDD引导我们将这个“充血”的领域模型置于系统的核心位置，并围绕它组织代码结构

当然，我和多数人一样，在看到上面这串由无数个专有名词统合而成的解释句子时，这些专有名词就在概念中拧成了一团乱麻，理解不了各个部分的含义。我们接下来就来细细对它们进行解释
## DDD基本概念
首先，我们需要知道，DDD架构主要有四层——接口层（对应三层架构的handler）、应用层（对应没有具体业务逻辑的service层）、领域层（对应service层的业务代码）和基础设施层（对应dao层）

为了更好理解DDD架构，我们可以先入为主地理解（但实际上有差别）——我们可以把DDD架构想象为把原三层架构的service层拆解为业务编排+业务实现两层后的架构，其中的领域层就是把service的各种臃肿的业务逻辑包装成各个具体方法（例如“检查库存是否足够”或者“判断操作是否合法”），应用层就是对领域层的各个方法进行事件编排实现的抽象业务逻辑

当然实际上DDD架构与三层架构还有很多区别，例如我们之前提到过的“充血模型”，要求“与对象紧密相关的数据和行为封装在一起”。因此实际上在领域层内“解耦合的业务实现”还需要被包装在特殊的模型下，这个模型就是聚合（Aggregate）。聚合内部会包装具体的数据模型（如User）和一些特殊值（totalUserCount），这些就叫做实体（Entity）和值对象（Object Value）

这下，我们就可以把领域层梳理清楚了：
![](/images/albums/blogAlbum/DDD1.png)

因此，聚合可以看作是领域层的核心，它封装了数据模型和值（实体和值对象），同时依赖于数据层的接口，完成了业务逻辑的包装和实现。需要注意的是，聚合依赖的是抽象的数据层接口，而非实际的接口，因此领域层并不直接依赖于数据层，而是让数据层的方法主动实现领域层的接口

而图中的界限上下文这是划分领域与领域间的重要区分标志，相当于不同的服务划分，如User和Post
### Option模式
在深入DDD架构前，我们先来补充一个重要概念——Option模式

Option模式（也称函数式选项模式）是一种在Go中优雅处理可选参数的设计模式。它解决了传统构造函数的痛点，特别适合配置项多、有默认值、可选的场景

我们传统的传统函数构造如下：
```go
// 传统构造函数
type Server struct {
    Addr     string
    Port     int
    Timeout  time.Duration
    MaxConns int
    TLS      *tls.Config
}

// 问题1：参数太多，调用时难以阅读
func NewServer(addr string, port int, timeout time.Duration, maxConns int, tls *tls.Config) *Server {
    return &Server{addr, port, timeout, maxConns, tls}
}

// 调用时：参数顺序必须正确，可读性差
s := NewServer("localhost", 8080, 30*time.Second, 100, nil)

// 问题2：使用配置结构体，但必须传递整个结构体
type Config struct {
    Addr     string
    Port     int
    Timeout  time.Duration
    MaxConns int
    TLS      *tls.Config
}

func NewServer(config Config) *Server {
    return &Server{
        Addr:     config.Addr,
        Port:     config.Port,
        Timeout:  config.Timeout,
        MaxConns: config.MaxConns,
        TLS:      config.TLS,
    }
}

// 调用时：即使只用一个字段，也要创建完整Config
s := NewServer(Config{
    Addr: "localhost",
    Port: 8080,
    // 其他字段用零值
})

// 问题3：零值歧义
// 如果Port=0，是有意设置为0还是忘记设置了？
// 如果Timeout=0，是立即超时还是用默认值？
```
因此，为了更优雅地构造函数及传递参数，我们使用Option模式：
```go
// 核心：定义一个Option函数类型
type Option func(*Server)

// 为每个可选参数创建配置函数
func WithAddr(addr string) Option {
    return func(s *Server) {
        s.Addr = addr
    }
}

func WithPort(port int) Option {
    return func(s *Server) {
        s.Port = port
    }
}

func WithTimeout(timeout time.Duration) Option {
    return func(s *Server) {
        s.Timeout = timeout
    }
}

func WithMaxConns(maxConns int) Option {
    return func(s *Server) {
        s.MaxConns = maxConns
    }
}

func WithTLS(tls *tls.Config) Option {
    return func(s *Server) {
        s.TLS = tls
    }
}

// 构造函数接收可变参数的Option
func NewServer(opts ...Option) *Server {
    // 设置默认值
    s := &Server{
        Addr:     "127.0.0.1",  // 默认地址
        Port:     8080,         // 默认端口
        Timeout:  30 * time.Second, // 默认超时
        MaxConns: 100,          // 默认最大连接数
    }
    
    // 应用所有Option函数
    for _, opt := range opts {
        opt(s)
    }
    
    return s
}

// 优雅的使用方式
func main() {
    // 只设置需要的参数
    s1 := NewServer(WithAddr("localhost"))
    
    // 任意顺序，任意数量
    s2 := NewServer(
        WithPort(9000),
        WithAddr("0.0.0.0"),
        WithMaxConns(200),
    )
    
    // 全部使用默认值
    s3 := NewServer()
    
    // 清晰、可读、可扩展
    s4 := NewServer(
        WithAddr("api.example.com"),
        WithPort(443),
        WithTLS(&tls.Config{...}),
        WithTimeout(60*time.Second),
    )
}
```

这种Option模式，在DDD中则广泛作为实体店构造方式，这保证了对象的不可变性和有效性，与DDD中聚合根需要维护自身一致性的思想相契合
```go
type User struct {
    ID       int
    Name     string
    Email    *Email
}

type Option func(*User)

func WithEmail(addr string) Option {
    return func(u *User) {
        email, err := NewEmail(addr) // 值对象构造，可包含验证
        if err == nil {
            u.Email = email
        }
    }
}

func NewUser(id int, name string, opts ...Option) (*User, error) {
    u := &User{ID: id, Name: name}
    for _, opt := range opts {
        opt(u)
    }
    // ... 其他一致性校验
    return u, nil
}
```
### 依赖注入
我们早在之前的单体式架构就已经用过了依赖注入思想，其是解耦领域层与基础设施层的关键。领域层只定义Repository接口（依赖抽象），具体的实现（如MySQL、Redis版本）在基础设施层实现，并在应用启动时通过构造器注入。这遵循了依赖倒置原则（DIP），使领域层保持“纯净”，不依赖于任何技术细节

例如，在领域层，我们之前说过的聚合依赖的数据层的接口，实际上是现在领域层定义的抽象接口，领域层内并没有具体的实现方法：
```go
// internal/domain/user/repository/user_repository.go
package repository

import "your-app/internal/domain/user/entity"

// UserRepository 领域层定义的仓储接口
type UserRepository interface {
    FindByID(id int) (*entity.User, error)
    Save(user *entity.User) error
    ExistsByEmail(email string) (bool, error)
}
```

### 依赖倒置
在传统的三层结构中，我们总是从上到下地注入依赖：handler->service->dao

但是在DDD架构在，领域层不需要任何依赖，反而需要基础设施层实现领域层的依赖，这便是依赖倒置

因此，在领域层中，我们定义抽象的仓储接口，不实现具体的仓储业务，反而让基础设施层的数据持久化部分来主动实现我们领域层的接口，这也是DDD的精髓
### DDD经典四层架构
接下来，我们来拆解一下DDD四层架构的核心实现：

```
──────────────────────────────────────────────────────
                Interface Layer (接口层)              
        负责与外部世界通信，协议转换，输入输出处理              
──────────────────────────────────────────────────────
               Application Layer (应用层)             
        协调用例流程，事务管理，不包含业务规则                  
──────────────────────────────────────────────────────
                Domain Layer (领域层)                
            核心业务逻辑，领域模型，业务规则                       
──────────────────────────────────────────────────────
           Infrastructure Layer (基础设施层)           
        技术实现细节：数据库、外部服务、消息队列等              
──────────────────────────────────────────────────────

              外层依赖内层，内层不依赖外层
```



#### Interface（接口层）
这一层类似于我们原三层架构的handler层，主要负责： 
1. 将外部协议（HTTP、RPC、消息、CLI等）转换为内部调用，例如kitex_handler
2. 向外部返回响应
3. 认证、授权、限流、日志、监控和其他中间件等
4. 消息队列的消费者

在这其中，我们要实现数据协议的转换，例如捕获请求中的JSON格式数据，或者将请求数据转换为JSON响应，这一步就叫作DTO（数据传输对象）

这一层较为简单，且只依赖应用层来完成业务处理
#### Application（应用层）
在该层，我们应该实现：
- **用例编排**：协调多个领域对象完成一个完整的用户用例
- **事务管理**：确保一个用例内的所有操作在一个事务中
- **安全控制**：权限检查、访问控制
- **工作单元**：管理聚合根的加载、修改、保存生命周期
- **事件发布**：发布领域事件到消息总线
- **CQRS分离**：将命令（写操作）和查询（读操作）分离

需要注意的是，该层的业务逻辑只负责简单的业务编排，不包含复杂的业务代码，例如在一个注册用户的业务中：

我们进行前置唯一性检查后，便开启事物，在事物内部：创建值对象 -> 创建并保存聚合根(调用的是领域层的抽象仓储接口) -> 发布领域事件

查询用户:直接调用领域层的抽象仓储接口

更新用户:加载聚合根(领域层抽象仓储接口) -> 更新用户（领域对象方法） -> 检查邮箱唯一性(领域层抽象仓储接口) -> 保存聚合根(领域层抽象仓储接口) -> 发布领域事件
#### Domain（领域层）
这一层的核心逻辑是：
- **封装业务逻辑**：实现所有业务规则和领域逻辑
- **定义领域模型**：实体、值对象、聚合、领域服务
- **定义仓储接口**：抽象数据访问，不关心实现细节
- **定义领域事件**：表示领域中发生的重要事情
- **保持纯净**：不依赖任何技术框架、数据库、外部服务

这一层涉及到多个次结构：
1. 实体和所属工厂方法和业务方法（User、NewUser、ChangePassword）
2. 值对象和所属工厂方法和业务方法（Email、NewEmail、GetEmailDomain）
3. 领域服务（涉及多个实体或值对象的方法）
4. 抽象仓储接口（FindByID、ExitsByUsername）
5. 领域事件（相当于单服务内的简化消息队列）

需要注意的是，这里的领域事件可以看作是单服务内的生产/消费者思想，用于对应用层和领域服务解耦

#### Infrastructure（基础设施层）
字面意思，如果领域层是项目的脚手架，那么基础设施层就是撑起我们整个项目的基石，拥有这些职责：
- 技术实现：提供具体的技术实现，如保存用户信息
- 数据持久化（PO）：实现仓储接口，访问数据库
- 外部服务集成：调用第三方API、消息队列、缓存等
- 技术框架：数据库连接、HTTP客户端、配置管理等
- 横切关注点实现：日志、监控、追踪的具体实现
- 组件集成：集成其他微服务组件（如配置中心等）

需要特别说明的是，基础设施层的仓储实现需要主动去实现在领域层抽象定义的仓储接口，并实现各模型的转换（如将领域模型转换成数据库模型PO）

## 从三层架构到DDD架构的思想转变
我们都知道，在三层架构中，数据层不仅包含了具体的数据库交互方法，还包含了各种数据model。而在DDD内部，这种数据model变化成了Aggregate、Entity和Object Value，并将业务代码与这些“model”耦合（封装），减轻service层的负担

另外，各个层次之间的数据交互也更加严格（DTO、PO），也提升了项目整体的可拓展性

**最重要，也是最核心的思想就是：从以数据库/CRUD为中心，转向以业务领域模型为中心**

三层架构思考“数据怎么存、怎么取”，DDD思考“业务是什么、怎么运作”

三层架构的Model是“贫血”的数据容器；DDD的Domain Model是包含行为和规则的“活”的对象

三层架构的Service是承载业务逻辑的主体；DDD的Application Service是薄薄的协调层，核心逻辑在Domain中

三层架构常表现为上层依赖下层的数据库；DDD通过依赖倒置，让核心的Domain层定义接口，底层Infrastructure去实现
# DDD 的 Go 代码实战
DDD架构示例代码仓库：**[go-ddd-layout](https://github.com/pokeyaro/go-ddd-layout)**

我们可以阅读该仓库的代码来加深我们对DDD架构的理解

以下是一个在分布式系统中user-service单服务的DDD架构示例结构图：

```
user-service/
├── cmd/                          # 启动入口
│   └── server/
│       └── main.go              # 主入口
├── kitex_gen/                   # Kitex框架
├── idl/                         # IDL定义文件
├── internal/                    # 内部代码（DDD四层）
│   ├── domain/                  # 领域层
│   │   └── user/                # 用户聚合
│   │       ├── entity/          # 实体
│   │       │   ├── user.go
│   │       │   └── role.go
│   │       ├── valueobj/        # 值对象
│   │       │   ├── email.go
│   │       │   ├── password.go
│   │       │   └── phone.go
│   │       ├── repository/      # 仓储接口
│   │       │   ├── user_repository.go
│   │       │   └── role_repository.go
│   │       ├── service/         # 领域服务
│   │       │   └── user_service.go
│   │       └── event/           # 领域事件
│   │           ├── user_created.go
│   │           └── user_updated.go
│   ├── application/             # 应用层
│   │   └── user/
│   │       └── service/         # 应用服务
│   │           └── user_app_service.go
│   ├── interfaces/              # 接口层
│   │   ├── kt_handler/          # Kitex处理器
│   │   │   └── user_handler.go
│   │   ├── adapter/             # 适配器
│   │   │   ├── assembler/       # 组装器
│   │   │   │   └── user_assembler.go
│   │   │   ├── converter/       # 转换器
│   │   │   │   └── user_converter.go
│   │   │   └── middleware/      # 中间件
│   │   │       ├── logging.go
│   │   │       ├── recovery.go
│   │   │       ├── tracing.go
│   │   │       └── validator.go
│   │   └── dto/                 # 数据传输对象
│   │       ├── request/         # 请求DTO
│   │       │   └── user/
│   │       └── response/        # 响应DTO
│   │           └── user/
│   └── infrastructure/          # 基础设施层
│       ├── config/              # 配置
│       │   ├── config.go
│       │   └── consul.go
│       ├── persistence/         # 持久化
│       │   ├── mysql/           # MySQL仓储实现
│       │   │   ├── user_repository.go
│       │   │   └── role_repository.go
│       │   ├── po/              # 持久化对象
│       │   │   ├── user.go
│       │   │   └── role.go
│       │   └── converter/       # PO-DO转换器
│       │       └── user_converter.go
│       ├── kt_client/           # Kitex客户端
│       ├── service_discovery/   # 服务发现
│       │   ├── consul/
│       │   │   ├── registry.go
│       │   │   ├── discovery.go
│       │   │   └── health.go
│       │   └── nacos/
│       ├── message/             # 消息队列
│       │   ├── kafka/
│       │   │   ├── producer.go
│       │   │   └── consumer.go
│       │   └── event_handler/   # 事件处理器
│       │       └── user_event_handler.go
│       ├── cache/               # 缓存
│       │   └── redis_cache.go
│       ├── log/                 # 日志
│       │   └── logger.go
│       └── tracer/              # 分布式追踪
│           └── jaeger_tracer.go
└── pkg/                         # 工具包
```
看着一大堆可能眼睛都看花了，不过我们只需要知道，相比于之前的三层架构，新架构的变化主要还是DDD的四层架构：
```
user-service/
└─ internal/                     # 内部代码（DDD四层）
    ├── domain/                  # 领域层
    │   └── user/                # 用户聚合
    │       ├── entity/          # 实体
    │       ├── valueobj/        # 值对象
    │       ├── repository/      # 仓储接口
    │       ├── service/         # 领域服务
    │       └── event/           # 领域事件
    ├── application/             # 应用层
    │   └── user/
    │       └── service/         # 应用服务
    ├── interfaces/              # 接口层
    │   ├── kt_handler/          # Kitex处理器
    │   ├── adapter/             # 适配器
    │   │   ├── assembler/       # 组装器
    │   │   ├── converter/       # 转换器
    │   │   └── middleware/      # 中间件
    │   └── dto/                 # 数据传输对象
    │       ├── request/         # 请求DTO
    │       └── response/        # 响应DTO
    └── infrastructure/          # 基础设施层
        ├── config/              # 配置
        ├── persistence/         # 持久化
        │   ├── mysql/           # MySQL仓储实现
        │   ├── po/              # 持久化对象
        │   └── converter/       # PO-DO转换器
        └── ......               # 其他微服务组件
```

对项目结构有了一个大致的认知后，我们来看看当一个请求流入user-service各层次时的都发生了什么：

## Interface层

### kitex_handler
这是服务的入口，通常是Kitex框架生成的处理器。它接收RPC请求，解析出参数，并进行最基本的参数校验（如非空、格式）。它的职责是“协议适配”，将网络请求转化为内部可理解的数据结构

### 数据转换（DTO）
接口层定义DTO（数据传输对象），如CreateUserReq、UserResp。handler会调用Assembler或Converter，将外部请求的DTO转换为应用层所需的命令或查询对象（通常是一个简单的结构体），或者将应用层返回的领域对象转换为对外的Resp DTO。DTO是接口层与外部世界的契约
```go
//go-ddd-layout/interfaces/dto/user/user.go
package user

type Userinfo struct {
	Name         string   `json:"name"`
	EmpID        int      `json:"emp_id"`
	Username     string   `json:"username"`
	Avatar       string   `json:"avatar"`
	Email        string   `json:"email"`
	Organization string   `json:"organization"`
	Company      string   `json:"company"`
	Region       string   `json:"region"`
	City         string   `json:"city"`
	Roles        []string `json:"roles"`
}

type User struct {
	ID           int    `json:"uid"`
	UUID         string `json:"uuid,omitempty"`
	Name         string `json:"name"`
	NickName     string `json:"nickname"`
	EmployeeID   int    `json:"employee_id,omitempty"`
	EmployeeType string `json:"employee_type,omitempty"`
	Company      string `json:"company,omitempty"`
	WorkCountry  string `json:"work_country,omitempty"`
	WorkCity     string `json:"work_city,omitempty"`
	Department   string `json:"department,omitempty"`
	Email        string `json:"email"`
	Avatar       string `json:"avatar"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	IsActive     bool   `json:"is_active"`
	CreatedAt    string `json:"ctime"`
	UpdatedAt    string `json:"utime"`
}

type LoginPasswd struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
```

### assembler
负责各类数据模型格式转换
```go
//go-ddd-layout/interfaces/assembler/user/user.go
package user

import (
	"time"

	"server/domain/user/entity"
	dto "server/interfaces/dto/user"
)

func DTOToEntity(user *dto.User) *entity.User {
	return &entity.User{
		Name:         user.Name,
		NickName:     user.NickName,
		EmployeeID:   user.EmployeeID,
		EmployeeType: user.EmployeeType,
		Company:      user.Company,
		WorkCountry:  user.WorkCountry,
		WorkCity:     user.WorkCity,
		Department:   user.Department,
		Email:        user.Email,
		Avatar:       user.Avatar,
		Username:     user.Username,
		Password:     user.Password,
		IsActive:     user.IsActive,
	}
}

func EntityToDTO(user *entity.User) *dto.User {
	return &dto.User{
		ID:           user.ID,
		UUID:         user.UUID.String(),
		Name:         user.Name,
		NickName:     user.NickName,
		EmployeeID:   user.EmployeeID,
		EmployeeType: user.EmployeeType,
		Company:      user.Company,
		WorkCountry:  user.WorkCountry,
		WorkCity:     user.WorkCity,
		Department:   user.Department,
		Email:        user.Email,
		Avatar:       user.Avatar,
		Username:     user.Username,
		Password:     user.Password,
		IsActive:     user.IsActive,
		CreatedAt:    user.CreatedAt.Format(time.DateTime),
		UpdatedAt:    user.UpdatedAt.Format(time.DateTime),
	}
}

func ListEntityToDTO(users []entity.User) []dto.User {
	var dtoUsers []dto.User
	for _, user := range users {
		dtoUser := dto.User{
			ID:           user.ID,
			Name:         user.Name,
			NickName:     user.NickName,
			EmployeeID:   user.EmployeeID,
			EmployeeType: user.EmployeeType,
			Company:      user.Company,
			WorkCountry:  user.WorkCountry,
			WorkCity:     user.WorkCity,
			Department:   user.Department,
			Email:        user.Email,
			Avatar:       user.Avatar,
			Username:     user.Username,
			Password:     user.Password,
			IsActive:     user.IsActive,
			CreatedAt:    user.CreatedAt.Format(time.DateTime),
			UpdatedAt:    user.UpdatedAt.Format(time.DateTime),
		}
		dtoUsers = append(dtoUsers, dtoUser)
	}
	return dtoUsers
}
```

## Application层

### 包装领域对象&编排领域服务
应用服务接收来自接口层的命令（如CreateUserCommand）。它首先会根据ID或条件，通过仓储接口获取已有的领域对象（聚合根）

然后，它调用领域对象的行为方法（如user.ChangePassword(...)）或领域服务（如transferService.Transfer(...)）来执行业务操作。应用层负责事务边界，通常一个应用服务方法对应一个数据库事务。业务操作完成后，它通过仓储接口保存聚合根，并可能发布领域事件。最后，将结果（可能是保存后的聚合根，或一个自定义的响应）返回给接口层
```go
// application/service/user_app_service.go
package service

import (
    "context"
    "myapp/domain"
    "myapp/domain/event"
    "myapp/domain/repository"
    "errors"
    "time"
)

// 定义命令和查询
type RegisterUserCommand struct {
    Username string
    Email    string
    Password string
}

type GetUserQuery struct {
    UserID string
}

type UpdateUserCommand struct {
    UserID   string
    Username *string
    Email    *string
}

// 应用服务
type UserAppService struct {
    userRepo        repository.UserRepository
    unitOfWork      repository.UnitOfWork
    eventPublisher  event.Publisher
    passwordHasher  domain.PasswordHasher
    emailService    domain.EmailService
}

func NewUserAppService(
    userRepo repository.UserRepository,
    unitOfWork repository.UnitOfWork,
    eventPublisher event.Publisher,
    passwordHasher domain.PasswordHasher,
    emailService domain.EmailService,
) *UserAppService {
    return &UserAppService{
        userRepo:        userRepo,
        unitOfWork:      unitOfWork,
        eventPublisher:  eventPublisher,
        passwordHasher:  passwordHasher,
        emailService:    emailService,
    }
}

func (s *UserAppService) Register(ctx context.Context, cmd RegisterUserCommand) (*domain.User, error) {
    // 验证唯一性
    if existing, _ := s.userRepo.FindByUsername(ctx, cmd.Username); existing != nil {
        return nil, errors.New("username already exists")
    }
    
    if existing, _ := s.userRepo.FindByEmail(ctx, cmd.Email); existing != nil {
        return nil, errors.New("email already exists")
    }
    
    // 开启事务
    return s.unitOfWork.Execute(ctx, func(ctx context.Context) (*domain.User, error) {
        // 创建值对象
        email, err := domain.NewEmail(cmd.Email)
        if err != nil {
            return nil, err
        }
        
        // 创建聚合根
        hashedPassword, err := s.passwordHasher.Hash(cmd.Password)
        if err != nil {
            return nil, err
        }
        
        user, err := domain.NewUser(cmd.Username, email, hashedPassword)
        if err != nil {
            return nil, err
        }
        
        // 保存聚合根
        if err := s.userRepo.Save(ctx, user); err != nil {
            return nil, err
        }
        
        // 发布领域事件
        userCreatedEvent := event.NewUserCreatedEvent(user.ID, user.Username, user.Email)
        if err := s.eventPublisher.Publish(ctx, userCreatedEvent); err != nil {
            // 记录日志，但不回滚事务
            log.Printf("failed to publish event: %v", err)
        }
        
        // 发送欢迎邮件
        go func() {
            if err := s.emailService.SendWelcomeEmail(user.Email, user.Username); err != nil {
                log.Printf("failed to send welcome email: %v", err)
            }
        }()
        
        return user, nil
    })
}

func (s *UserAppService) GetUser(ctx context.Context, query GetUserQuery) (*domain.User, error) {
    user, err := s.userRepo.FindByID(ctx, query.UserID)
    if err != nil {
        return nil, err
    }
    
    if user == nil {
        return nil, errors.New("user not found")
    }
    
    return user, nil
}

func (s *UserAppService) UpdateUser(ctx context.Context, cmd UpdateUserCommand) error {
    return s.unitOfWork.Execute(ctx, func(ctx context.Context) error {
        // 加载聚合根
        user, err := s.userRepo.FindByID(ctx, cmd.UserID)
        if err != nil {
            return err
        }
        
        if user == nil {
            return errors.New("user not found")
        }
        
        // 更新用户
        if cmd.Username != nil {
            if err := user.ChangeUsername(*cmd.Username); err != nil {
                return err
            }
        }
        
        if cmd.Email != nil {
            email, err := domain.NewEmail(*cmd.Email)
            if err != nil {
                return err
            }
            
            // 检查邮箱是否已被使用
            if existing, _ := s.userRepo.FindByEmail(ctx, email); existing != nil && existing.ID != user.ID {
                return errors.New("email already in use")
            }
            
            if err := user.ChangeEmail(email); err != nil {
                return err
            }
        }
        
        // 保存聚合根
        if err := s.userRepo.Save(ctx, user); err != nil {
            return err
        }
        
        // 发布事件
        userUpdatedEvent := event.NewUserUpdatedEvent(user.ID, time.Now())
        s.eventPublisher.Publish(ctx, userUpdatedEvent)
        
        return nil
    })
}
```

## Domain层
### 实体处理
这里是业务逻辑的核心。实体（聚合根）的方法封装了状态变更的规则。例如，User.ChangePassword(oldPwd, newPwd)方法内部会验证原密码、校验新密码强度，然后才修改Password值对象。所有不变量和业务规则在此得到强制执行
```go
//domain/user/entity/user.go
package entity

import (
	"errors"
	"time"
	
	"user-service/internal/domain/user/valueobj"
	"user-service/internal/domain/user/event"
)

// User 用户实体（聚合根）
type User struct {
	ID        int
	Username  string
	Email     *valueobj.Email
	Password  *valueobj.Password
	Status    UserStatus
	CreatedAt time.Time
	UpdatedAt time.Time
	
	// 存储未发布的事件
	events []event.DomainEvent
}

type UserStatus int

const (
	UserStatusInactive UserStatus = iota
	UserStatusActive
	UserStatusBanned
)

// NewUser 创建新用户（工厂方法）
func NewUser(username string, email *valueobj.Email, password *valueobj.Password) (*User, error) {
	if username == "" {
		return nil, errors.New("username cannot be empty")
	}
	
	if email == nil {
		return nil, errors.New("email is required")
	}
	
	if password == nil {
		return nil, errors.New("password is required")
	}
	
	now := time.Now()
	user := &User{
		Username:  username,
		Email:     email,
		Password:  password,
		Status:    UserStatusInactive,
		CreatedAt: now,
		UpdatedAt: now,
		events:    make([]event.DomainEvent, 0),
	}
	
	// 发布用户已创建事件
	user.events = append(user.events, &event.UserCreated{
		UserID:    user.ID,
		Username:  username,
		Email:     email.String(),
		CreatedAt: now,
	})
	
	return user, nil
}

// Activate 激活用户
func (u *User) Activate() error {
	if u.Status == UserStatusActive {
		return errors.New("user is already active")
	}
	
	u.Status = UserStatusActive
	u.UpdatedAt = time.Now()
	
	// 发布用户已激活事件
	u.events = append(u.events, &event.UserActivated{
		UserID:    u.ID,
		Timestamp: time.Now(),
	})
	
	return nil
}

// ChangeEmail 修改邮箱
func (u *User) ChangeEmail(newEmail *valueobj.Email) error {
	if newEmail == nil {
		return errors.New("new email is required")
	}
	
	oldEmail := u.Email.String()
	u.Email = newEmail
	u.UpdatedAt = time.Now()
	
	// 发布邮箱修改事件
	u.events = append(u.events, &event.EmailChanged{
		UserID:    u.ID,
		OldEmail:  oldEmail,
		NewEmail:  newEmail.String(),
		Timestamp: time.Now(),
	})
	
	return nil
}

// ChangePassword 修改密码
func (u *User) ChangePassword(oldPassword, newPassword *valueobj.Password) error {
	if !u.Password.Verify(oldPassword) {
		return errors.New("old password is incorrect")
	}
	
	u.Password = newPassword
	u.UpdatedAt = time.Now()
	
	return nil
}

// GetEvents 获取并清空未发布的事件
func (u *User) GetEvents() []event.DomainEvent {
	events := u.events
	u.events = make([]event.DomainEvent, 0)
	return events
}
```
### 值对象

值对象通常是不可变的，且包含自验证逻辑。例如，Email值对象在创建时（通过工厂函数NewEmail）就确保地址格式有效。它们使代码更清晰、更安全
```go
//domain/user/valueobj/eamil.go
package valueobj

import (
	"errors"
	"net/mail"
	"strings"
)

// Email 邮箱值对象
type Email struct {
	address string
}

// NewEmail 创建邮箱值对象（包含验证）
func NewEmail(address string) (*Email, error) {
	if address == "" {
		return nil, errors.New("email address cannot be empty")
	}
	
	// 验证邮箱格式
	if _, err := mail.ParseAddress(address); err != nil {
		return nil, errors.New("invalid email address")
	}
	
	// 转换为小写
	address = strings.ToLower(strings.TrimSpace(address))
	
	return &Email{address: address}, nil
}

// String 返回字符串表示
func (e *Email) String() string {
	return e.address
}

// Equals 比较两个邮箱是否相等
func (e *Email) Equals(other *Email) bool {
	if other == nil {
		return false
	}
	return e.address == other.address
}
```
### 领域事件
实现聚合间通信、保持限界上下文松散耦合的核心机制。在实现上，核心在于事件内聚——实体自身在引发状态变更时创建并暂存事件，外部只需订阅关心的事件类型
```go
//domain/user/event/user_created.go
package event

import (
	"time"

	"github.com/google/uuid"
)

// DomainEvent 领域事件接口
type DomainEvent interface {
	EventID() string
	EventName() string
	AggregateID() int
	OccurredAt() time.Time
	ToMap() map[string]interface{}
}

// UserCreated 用户已创建事件
type UserCreated struct {
	eventID   string
	userID    int
	username  string
	email     string
	createdAt time.Time
}

func NewUserCreated(userID int, username, email string) *UserCreated {
	return &UserCreated{
		eventID:   uuid.New().String(),
		userID:    userID,
		username:  username,
		email:     email,
		createdAt: time.Now(),
	}
}

func (e *UserCreated) EventID() string {
	return e.eventID
}

func (e *UserCreated) EventName() string {
	return "user.created"
}

func (e *UserCreated) AggregateID() int {
	return e.userID
}

func (e *UserCreated) OccurredAt() time.Time {
	return e.createdAt
}

func (e *UserCreated) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"event_id":   e.eventID,
		"event_name": e.EventName(),
		"user_id":    e.userID,
		"username":   e.username,
		"email":      e.email,
		"timestamp":  e.createdAt,
	}
}
```

### 仓储接口
在领域层，只有接口定义，如type UserRepository interface { FindByID(id int) (*User, error); Save(user *User) error }。它明确了领域层“需要什么”，而不关心“如何实现”
```go
//go-ddd-layout/domain/user/repository/user.go
package repository

import (
	"server/domain/user/entity"
)

type UserRepository interface {
	UserRepositoryBase
	UserRepositoryQuery
}

type UserRepositoryBase interface {
	SaveUser(user *entity.User) (*entity.User, error)
	DeleteUser(id int64) error
	UpdateUser(user *entity.User) (*entity.User, error)
	UpdatesUser(user *entity.User) (*entity.User, error)
	GetUser(id int64) (*entity.User, error)
	GetUsers() ([]entity.User, error)
}

type UserRepositoryQuery interface {
	FindByName(name string) (*entity.User, error)
	FindByEmpID(empId int) (*entity.User, error)
	FindByEmail(email string) (*entity.User, error)
	FindByUsername(username string) (*entity.User, error)
	FindByUsernameAndPassword(username, password string) (*entity.User, error)
	UpdatePassword(id int64, password ...string) (string, error)
}
```

## Infrastructure层

### 数据转换（PO）
当仓储实现（如MySQLUserRepository）从数据库获取数据后，需要将数据库的持久化对象转换为领域层的实体/聚合根。PO是纯粹的数据结构，与数据库表结构对应，不含业务逻辑
```go
//go-ddd-layout/infrastructure/persistence/user/po/user.go
package po

import (
	"server/domain/user/entity/valueobj"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	UUID         uuid.UUID `gorm:"column:uuid;           type:varchar(36);   not null; index:idx_uuid; unique;     comment:'Unique identifier'"`
	Name         string    `gorm:"column:name;           type:varchar(50);   not null; index:idx_name;             comment:'English name'"`
	NickName     string    `gorm:"column:nickname;       type:varchar(50);   not null;                             comment:'Chinese name'"`
	EmployeeID   int       `gorm:"column:employee_id;    type:int;                                                 comment:'Employee ID'"`
	EmployeeType string    `gorm:"column:employee_type;  type:varchar(50);                                         comment:'Employee type'"`
	Company      string    `gorm:"column:company;        type:varchar(50);                                         comment:'Company name'"`
	WorkCountry  string    `gorm:"column:work_country;   type:varchar(50);                                         comment:'Work country'"`
	WorkCity     string    `gorm:"column:work_city;      type:varchar(50);                                         comment:'Work city'"`
	Department   string    `gorm:"column:department;     type:varchar(50);                                         comment:'Department'"`
	Email        string    `gorm:"column:email;          type:varchar(50);   not null; index:idx_email; unique;    comment:'Email address'"`
	Avatar       string    `gorm:"column:avatar;         type:text;                                                comment:'User avatar URL'"`
	Username     string    `gorm:"column:username;       type:varchar(50);   index:idx_username; unique;           comment:'System login username'"`
	Password     string    `gorm:"column:password;       type:varchar(255);  index:idx_password;                   comment:'Local system login password'"`
	IsActive     bool      `gorm:"column:is_active;      type:boolean;       index:idx_is_active; default:1;       comment:'Whether the user is active (0 for inactive, 1 for active)'"`
	Roles        []Role    `gorm:"many2many:rbac_user_roles;"`
}

func (u *User) TableName() string {
	return "t_rbac_user"
}

// BeforeCreate - Pre Insert Hook.
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	u.IsActive = true

	u.UUID = uuid.New()

	var role Role
	tx.Where("role_name = ?", valueobj.DefaultRoleName).First(&role)
	u.Roles = []Role{role}

	return
}
```

### 数据持久化处理
仓储的具体实现位于此。它实现Domain层定义的接口，处理与数据库、缓存等的实际交互。它负责将领域对象的状态持久化到数据库（将实体转为PO再执行SQL），或从数据库重建领域对象。这里是所有技术细节（SQL、Redis命令、ORM等）的藏身之处
```go
//go-ddd-layout/infrastructure/persistence/user/user_repo.go
package user

import (
	"errors"
	"reflect"

	"server/domain/user/entity"
	"server/domain/user/entity/valueobj"
	"server/domain/user/repository"
	"server/infrastructure/common/random"
	"server/infrastructure/persistence/user/converter"
	"server/infrastructure/persistence/user/po"

	"gorm.io/gorm"
)

type UserRepositoryImpl struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &UserRepositoryImpl{db: db}
}

func (ur *UserRepositoryImpl) SaveUser(user *entity.User) (*entity.User, error) {
	poUser := converter.UserEntityToPO(user)
	result := ur.db.Create(poUser)
	if result.Error != nil {
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		return nil, errors.New("unable to save user")
	}

	entityUser := converter.UserPOToEntity(poUser)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) DeleteUser(id int64) error {
	tx := ur.db.Begin()

	// 软删除用户
	if err := tx.Delete(&po.User{}, id).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 真删除关联关系表
	if err := tx.Exec("DELETE FROM t_rbac_user_roles WHERE user_id = ?", id).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()
	return nil
}

func (ur *UserRepositoryImpl) UpdateUser(user *entity.User) (*entity.User, error) {
	poUser := converter.UserEntityToPO(user)

	userValue := reflect.ValueOf(user).Elem()
	for i := 0; i < userValue.NumField(); i++ {
		fieldName := userValue.Type().Field(i).Name
		fieldValue := userValue.Field(i)

		if !fieldValue.IsZero() {
			result := ur.db.Model(&poUser).Where("id = ?", poUser.ID).Update(fieldName, fieldValue.Interface())
			if result.Error != nil {
				return nil, result.Error
			}
		}
	}

	entityUser := converter.UserPOToEntity(poUser)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) UpdatesUser(user *entity.User) (*entity.User, error) {
	poUser := converter.UserEntityToPO(user)
	result := ur.db.Model(poUser).Where("id = ?", poUser.ID).Updates(*poUser)
	if result.Error != nil {
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		return nil, errors.New("unable to update user")
	}

	entityUser := converter.UserPOToEntity(poUser)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) GetUser(id int64) (*entity.User, error) {
	user := &po.User{}

	result := ur.db.First(user, id)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) GetUsers() ([]entity.User, error) {
	users := make([]po.User, 0)

	result := ur.db.Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUsers := make([]entity.User, 0, len(users))
	for _, u := range users {
		entityUsers = append(entityUsers, *converter.UserPOToEntity(&u))
	}

	return entityUsers, nil
}

func (ur *UserRepositoryImpl) FindByName(name string) (*entity.User, error) {
	user := &po.User{}

	result := ur.db.Where("name = ?", name).First(user)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) FindByEmpID(empId int) (*entity.User, error) {
	user := &po.User{}

	result := ur.db.Where("employee_id = ?", empId).First(user)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) FindByEmail(email string) (*entity.User, error) {
	user := &po.User{}

	result := ur.db.Where("email = ?", email).First(user)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) FindByUsername(username string) (*entity.User, error) {
	user := &po.User{}

	// manytomany 需要 preload 预加载才可以拿到关联表信息
	result := ur.db.Preload("Roles").Where("username = ?", username).First(user)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) FindByUsernameAndPassword(username, password string) (*entity.User, error) {
	user := &po.User{}

	result := ur.db.Preload("Roles").Where("username = ? AND password = ?", username, password).First(user)
	if result.Error != nil {
		return nil, result.Error
	}

	entityUser := converter.UserPOToEntity(user)

	return entityUser, nil
}

func (ur *UserRepositoryImpl) UpdatePassword(id int64, password ...string) (string, error) {
	var newPassword string
	if len(password) == 0 {
		newPassword = random.GeneratePassword(valueobj.PasswordDigits)
	} else {
		newPassword = password[0]
	}

	user := &po.User{}
	err := ur.db.First(user, id).Error
	if err != nil {
		return "", err
	}

	user.Password = newPassword

	err = ur.db.Save(user).Error
	if err != nil {
		return "", err
	}

	return newPassword, nil
}
```
# 后记
DDD不是银弹，它引入了显著的复杂度。对于业务简单、生命周期短的项目，传统的三层或清洁架构可能是更经济的选择。然而，当面对核心业务逻辑复杂、需要长期演进且团队规模较大的系统时，DDD提供的统一语言、清晰的边界和以领域为核心的设计思想，能极大地提升软件的可理解性、可测试性和可维护性

在Go中实践DDD，需要克服语言本身在面向对象特性上的“简洁”风格，更多地通过接口、组合和包组织来体现架构约束。这既是一种挑战，也是深入理解软件设计本质的绝佳途径

> 所以如果让我用DDD架构写项目，大概会因心力交瘁而亡吧
# 参考资料
**[Go 的 DDD 工程化项目实践](https://juejin.cn/post/7298160530292703244)**

**[深入浅出DDD：从理论到落地的关键](https://segmentfault.com/a/1190000046562541)**

**[go-ddd-layout](https://github.com/pokeyaro/go-ddd-layout)**

**[架构演进之 DDD：从 CRUD 到领域驱动设计](https://zhuanlan.zhihu.com/p/2016926013846732883)**

**[领域驱动设计 DDD（Domain-Driven Design）软件架构学习笔记](https://developer.cloud.tencent.com/article/2638826)**