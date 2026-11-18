---
townId: go-kitex
title: 分布式基础：微服务理论（gRPC）和kitex框架
description: 对微服务理论基础的讲解和kitex框架的介绍与快速搭建.
category: Golang
series: "Go 微服务"
seriesIndex: 0
tags:
  - Golang
  - 后端
  - 微服务
  - 分布式
date: 2026-03-02
draft: false
cover: /assets/posts/covers/cover26.webp
coverAlt: 分布式基础：微服务理论（gRPC）和kitex框架
---
# 微服务
边学边写的Demo：**[LearningDemo](https://github.com/Claran309/microservice-learning-demo)**

## 概念解析
区别于单体架构，微服务是一种**分布式架构**模式

### 单体架构
![](/images/albums/blogAlbum/microservice1.png)
**单体架构就是数据库，缓存等一系列组件都在一台机器上面开发，运行和部署的架构**

单体应用的优点
- **开发效率高**：功能都在单个程序内部，便于软件设计和开发规划
- **容易部署成本低**：程序单一不存在分布式集群的复杂部署环境，降低了部署难度
- **容易测试**：没有各种复杂的服务调用关系，都是内部调用方便测试
  单体架构的缺点就是，在数据，缓存，文件等不断增多的情况下，一台服务器资源有限经受不了这种压力，于是就提出了一种分布式的解决方案

### 分布式设计
![](/images/albums/blogAlbum/microservice2.png)
这种设计**将各个服务都部署到不同的机器上面进行运行**，这样各个服务之间不会进行资源的竞争，压力就小了很多

但是在这种情况下面就会出现一个问题：由于机器部署了多台，每个服务都可能出现宕机的情况，于是提出了集群在保障了基本的高可用

### 集群
![](/images/albums/blogAlbum/microservice3.png)
我们可以**部署多台不同的机器跑相同的服务**，再通过合理的负载均衡策略，将请求分散到不同的服务器上面，这样的话就保障了一定的高可用，比如我们有两台机器，如果即使其中的一台机器挂掉，另一台机器也可以承担整个请求的任务

但是当前的集群也会有一个新的问题：比如这里的服务ABC，每个服务的请求量和业务复杂度都是不同的，那么就会出现有一些服务的请求和复杂度特别高，那么我们就会对一些服务进行拆分更微小的服务，降低耦合度，这样就形成了我们的微服务

### 微服务架构
![](/images/albums/blogAlbum/microservice4.png)
从单体整个应用程序开始进行拆分，**拆分为多个服务**，并根据每个服务各自的特点**拆分成更微小的服务**，最终就成就了我们的微服务。在微服务前有一个网关，通过负载均衡和nginx反向代理进入我们的网关，通过网关会找到我们相关的服务

但是微服务这种设计结构在**提升系统高可用性，强可拓展性和易维护性的同时，也会大大增加整个项目的复杂度和设计难度**

### 在项目中理解微服务
经过上面的了解，我们可以知道在一个微服务项目中，是应该有网关和多个微服务模块存在的，除此之外，还有
两个重要的工具，也是实现微服务的核心技术：**rpc客户端**（**Client**）和**rpc服务端**（**Server**）

rpc客户端Client负责接受api网关的rpc请求并将其序列化，发送给rpc服务端Server，而rpc服务端Server就根据具体业务逻辑执行相应代码再将相应返回给Client

所以说，微服务与微服务之间是Client-Server的关系，理解这一点很重要，这意味着微服务之间可以相互调用，并且应当避免耦合

### 微服务的拆分
![](/images/albums/blogAlbum/microservice5.png)
在服务拆分的时候，难带是拆分得越细越好吗？

当一个项目拆分的时候，**拆分的服务越多，从理论上来说它的可维护性也就越好**，与此同时拆分得越细，需要得团队人数就越多，**项目得复杂度也就越高，设计难度也会大的多**

常见的拆分逻辑
- **系统维度拆分**：根据系统一类功能聚集在一起的模块进行拆分，系统维度是最基本的拆分单位。
- **功能维度拆分**：针对一些复杂度较高或重要的功能进行拆分。
- **读写维度拆分**：针对数据操作存在较大读写差的功能或模块进行拆分
## 微服务的实现
一个请求访问微服务的流程如下

**http客户端**发送请求，服务器**api网关**（hertz/gin）解析http请求，**构造rpc请求**发送给**内部rpc客户端**（手脚架生成），**rpc客户端通**过网络传输（序列化）调用**rpc服务端**（手脚架生成）（反序列化），**rpc服务端**进入**内部业务代码**处理业务逻辑，再**原路返回**响应

```
HTTP客户端 (curl/浏览器)
↓ POST /register
API网关 (Hertz)
↓ 解析HTTP请求，调用RPC
RPC客户端 (Kitex生成)
↓ 序列化请求，发送到8888端口
网络传输
↓
RPC服务端 (Kitex生成，在8888端口监听)
↓ 接收请求，反序列化
你的业务代码 (handler.go)
↓ 处理注册逻辑
返回响应
↓
RPC服务端 → 序列化响应 → 网络 → RPC客户端 → API网关 → HTTP响应
```

接下来，我们将对各个概念和更加详细的技术进行解释

### rpc
rpc是什么？

定义：是一种用于不同计算机之间通信的**协议**。它**允许一个计算机程序调用另一个计算机上的函数或者方法**

在单体架构中，我们只需要得到这个服务对象就可以调用其方法，但是在服务拆分之后变成了两台机器，就不能这样调用了，那应该怎么办呢？

我们知道，微服务设计就是将不同的服务设计在不同的服务器上单独运行，此时服务间的信息传递和调用就变得更加困难，此时就需要用到rpc通信机制，通过在当前服务上调用其他服务器注册的网关，实现像单体架构一样直接调用其方法

所以rpc的存在就是把远程的服务调用变得跟本地类似

但是问题又来了，我们在通过rpc调用其他服务器的服务时，怎么定位需要调用的服务的呢？

除了显式注册ip:port外，我们通常使用**注册中心**来解决这个问题，也涉及到了服务注册和服务发现

### 注册中心

![](/images/albums/blogAlbum/microservice6.png)

注册中心（register）就是服务信息的存储器，**存储记录了每个注册微服务网络地址等信息**（微服务的ServiceName、IP、Port、MetaData等），常用的注册中心如etcd，concul

#### 服务注册

每个微服务在启动时，将自己的网络地址等信息注册到注册中心，由注册中心存储这些数据

#### 定时续期

定时续期（keep alive），定期告诉 Service Registry 自己还在，能够继续服务

> 健康检查
> 
> - 主动探测：注册中心定期调用服务的健康检查接口。
> 
> - 心跳机制：服务定期发送心跳包，超时未收到则标记实例为不健康

如etcd，使用租约健康机制，主程序要定时keep alive确保注册中心存活，若注册中心失活就再次进行服务注册

服务消费者从注册中心查询服务提供者的地址，并通过该地址调用服务提供者的接口

#### 服务发现

服务发现的方式一般有两种：
1. 拉取的方式：服务消费方（Consumer）主动向注册中心发起服务查询的请求。
2. 推送的方式：服务订阅/通知变更（下发）：服务消费方（Consumer）主动向注册中心订阅某个服务，当注册中心中该服务信息发生变更时，注册中心主动通知消费者
### 服务治理

服务治理，在基础的微服务项目上确保**微服务系统的稳定性、可靠性和可观测性**

常见的服务治理包括
- 负载均衡
- 熔断与降级
- 限流：计数器，滑动窗口，漏桐，令牌桶
- 重试与超时
- redis集群
### 消息队列

上面所说的rpc通信方式属于同步通信，而此处的消息队列便是**异步通信**，可用于解耦服务依赖

**应用场景**：
- 异步处理
- 应用解耦
- 流量削峰
- 最终一致性
  **主流消息队列**：
  **Kafka**：高吞吐，适合日志、流处理
  **RabbitMQ**：功能丰富，适合复杂路由
  **RocketMQ**：阿里出品，事务消息强
  **nsq**：go原生实现
### 分布式事务

在微服务中，可能存在多个服务争夺跨服务数据的情况，因此在微服务架构中，保证跨服务的数据一致性是巨大挑战，此时就要用到分布式事务来确保事务一致性

dtm: [GitHub - dtm-labs/dtm: A distributed transaction framework, supports workflow, saga, tcc, xa, 2-phas](https://github.com/dtm-labs/dtm)
### 可观测性
在单体式架构中，我们常用日志进行项目观察，但是对于微服务而言，给每个微服务分配日志再查询是不现实也不方便的，此时我们就需要用到可观测性三巨头：指标（Metrics）、链路追踪（Tracing）、分布式日志（Logging）

#### 指标（Metrics）
四个黄金指标
1. **延迟**（Latency）：请求处理时间
2. **流量**（Traffic）：请求量/QPS
3. **错误**（Errors）：错误率
4. **饱和度**（Saturation）：资源使用率

#### 链路追踪（Tracing）
分布式请求跟踪，分析请求在系统中的完整路径。

OpenTelemetry标准：
- **Trace**：一次请求的完整路径
- **Span**：单个服务内的操作单元
- **Context**：传递跟踪信息
#### 分布式日志（Logging）
集中收集、存储和查询分布式系统的日志。

ELK Stack：
- **Elasticsearch**：存储和检索
- **Logstash**：收集和解析
- **Kibana**：可视化
# 微服务框架
接下来，我们进行微服务的基础代码实现

常用两个微服务框架：**go-zero和kitex**，此处详细介绍**kitex**
## go-zero
**go-zero**是万俊峰开发的Go微服务框架，集成了各种工程实践

核心特性：
- 内置代码生成工具
- 内置服务治理
- 声明式API开发
- 高性能RPC框架
  
架构组件：
- REST/RPC服务框架
- API网关
- 配置中心
- 任务调度
- 缓存管理
## kitex
**Kitex**是字节跳动开源的Go微服务RPC框架，已在字节内部大规模使用

核心优势：
- 极致性能：基于Netpoll网络库，性能领先
- 扩展性强：支持多协议、可扩展传输层
- 服务治理：内置服务发现、负载均衡、熔断等
- 代码生成：强大IDL代码生成能力
- 云原生：原生支持K8s、服务网格

# 用kitex快速搭建基础微服务demo
kitex支持从IDL文件**自动生成rpc客户端/服务端**

一下以最基础的demo为例，实现支持用户注册功能的微服务demo
## 安装依赖和必要工具
```bash
# 安装Kitex代码生成工具
go install github.com/cloudwego/kitex/tool/cmd/kitex@latest
# 安装Thriftgo（用于Thrift IDL）
go install github.com/cloudwego/thriftgo@latest
# 验证安装
kitex --version
thriftgo --version
```
## 项目目录和结构
```
kitexDemo/
├── api-gateway/
│   ├── main.go      # 主入口
│   ├── router.go    # 路由定义
│   └── http.go      # HTTP处理器
├── user-service/
│   ├── main.go      # RPC服务入口
│   └── handler.go   # 业务逻辑
└── idl/
├── kitex_gen/
│   └── user/        # 生成代码，以下略
└── user.thrift  # 接口定义
```
## 编写IDL文件
**IDL**（**接口定义语言**）定义了服务接口和数据结构，是**RPC通信的契约**
```thrift
//idl/user.thrift
namespace go user
//用户注册请求
struct RegisterReq {
    1: string username
    2: string password
}
//用户注册响应
struct RegisterResp {
    1: bool success
    2: string message
}
//用户服务接口
service UserService {
RegisterResp Register(1: RegisterReq req)
}
```
## 代码生成
```bash
# 初始化Go模块
go mod init
# 生成Kitex代码
kitex -module project_name idl/user.thrift
```

**kitex框架会自动根据thrift文件生成rpc代码**

**再分别进入各自的目录中，执行如下命令生成代码：**

**（可选）**
```go
// item 目录下执行
kitex -module project_name -service service_name -use ../kitex_gen ../idl/user.thrift
```

这样kitex就会在我们的服务模块中生成main和hanlder代码框架以及启动脚本和kitex配置

## 编写rpc业务逻辑代码
```go
//user-service/handler.go
package main

import (
	"context"
	"microservicesDemo/L2-kitex/kitex_gen/user"
)

// UserServiceImpl 实现Kitex生成的接口
type UserServiceImpl struct{}

func (s *UserServiceImpl) Register(ctx context.Context, req *user.RegisterReq) (*user.RegisterResp, error) {
	if req.Username == "" || req.Password == "" {
		return &user.RegisterResp{
			Success: false,
			Message: "用户名、密码、邮箱不能为空",
		}, nil
	}

	if len(req.Username) < 3 {
		return &user.RegisterResp{
			Success: false,
			Message: "用户名至少3个字符",
		}, nil
	}

	return &user.RegisterResp{
		Success: true,
		Message: "注册成功",
	}, nil

}

```
## 编写rpc服务启动代码
```go
//user-service/main.go
package main

import (
	"microservicesDemo/L2-kitex/kitex_gen/user/userservice"
	"net"

	"github.com/cloudwego/kitex/server"
)

func main() {
	// 创建地址
	addr, err := net.ResolveTCPAddr("tcp", "127.0.0.1:8080")
	if err != nil {
		panic(err)
	}

	svr := userservice.NewServer(
		new(UserServiceImpl),         // 业务处理器
		server.WithServiceAddr(addr), // 监听端口
	)

	//启动rpc服务
	err = svr.Run()
	if err != nil {
		panic(err)
	}
}
```
## 编写api网关代码
编写api代码
```go
//api-gateway/main.go
package main

import (
	"log"
	"microservicesDemo/L2-kitex/kitex_gen/user/userservice"

	"github.com/cloudwego/hertz/pkg/app/server" // Hertz服务器
	"github.com/cloudwego/kitex/client"         // Kitex客户端
)

// 全局RPC客户端
var userClient userservice.Client

// init函数，在main之前执行
func init() {
	log.Println("初始化rpc客户端...")

	// 创建kitex客户端
	var err error
	userClient, err = userservice.NewClient("user-service", client.WithHostPorts("127.0.0.1:8080"))

	if err != nil {
		log.Fatal("创建客户端失败", err)
	}

	log.Println("RPC客户端初始化成功")
	log.Println("连接到: 127.0.0.1:8888")
}

func main() {
	h := server.Default(server.WithHostPorts(":8888"))

	handler := APIHandler{}

	RegisterRoutes(h, handler)

	log.Printf("网关服务器正在端口 8888 上启动")
	h.Spin()
}
```
```go
//api-gateway/router
package main

import (
	"github.com/cloudwego/hertz/pkg/app/server"
)

func RegisterRoutes(srv *server.Hertz, handler APIHandler) {
	user := srv.Group("/user")
	user.POST("/register", handler.Register)
}

```
```go
//api-gateway/http.go
package main

import (
	"context"
	"log"
	"microservicesDemo/L2-kitex/kitex_gen/user"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

type APIHandler struct {
}

func NewAPIHandler() *APIHandler {
	return &APIHandler{}
}

func (h *APIHandler) Register(c context.Context, ctx *app.RequestContext) {
	// 常规handler
	startTime := time.Now()

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := ctx.BindAndValidate(&req); err != nil {
		log.Println("绑定参数时发生错误", err)
		ctx.JSON(400, utils.H{
			"code": 400,
			"msg":  "绑定参数时发生错误",
		})
		return
	}

	// 构造rpc请求，包名为构建时填写的包名
	rpcReq := &user.RegisterReq{
		Username: req.Username,
		Password: req.Password,
	}

	// 调用rpc请求
	log.Println("调用rpc服务...")
	rpcResp, err := userClient.Register(c, rpcReq)
	if err != nil {
		log.Printf("RPC调用失败: %v", err)
		ctx.JSON(500, utils.H{
			"code":    500,
			"message": "服务内部错误: " + err.Error(),
		})
		return
	}

	// 判断rpc服务成功与否
	statusCode := 200
	if !rpcResp.Success {
		statusCode = 400
	}

	duration := time.Since(startTime)

	// 返回HTTP响应
	log.Printf("注册处理完成，状态码: %d，耗时: %v", statusCode, duration)

	ctx.JSON(statusCode, utils.H{
		"code":    statusCode,      // HTTP状态码
		"success": rpcResp.Success, // 业务是否成功
		"message": rpcResp.Message, // 业务消息
	})
}

```
# 学习文章
**[蓝山Go组-2024 | 微服务理论基础](https://github.com/LanshanTeam/Courseware-Backend-Go-2024/blob/main/lesson14/%E5%BE%AE%E6%9C%8D%E5%8A%A1%E5%9F%BA%E7%A1%80%E7%90%86%E8%AE%BA.md)**

**[CloudWeGo | Kitex](https://www.cloudwego.io/zh/docs/kitex/)**