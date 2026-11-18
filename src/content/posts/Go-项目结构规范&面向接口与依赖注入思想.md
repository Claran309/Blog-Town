---
townId: go-Newfunc
title: Go-项目结构规范&面向接口与依赖注入思想
description: Web后端设计中注入依赖架构的学习.
category: Golang
series: "Go 工程实践"
seriesIndex: 2
tags:
  - Golang
  - 后端
  - 项目
  - 架构设计
date: 2025-11-24
draft: false
cover: /assets/posts/covers/cover19.webp
coverAlt: Go-项目结构规范&面向接口与依赖注入思想
---
# 项目结构规范

## 规范

一个项目/Demo的不同包应该按照其**不同功能或实现方法/依赖位置**来进行不同结构的划分

例如internal存储项目/Demo内部的所有业务逻辑

二internal内部按照功能可以划分为service（业务逻辑层）、handler（响应处理层）、util（工具层）、middleware（中间件层）、repository（数据仓库层）等

而util内部可按照不同对象的工具分为jwt_util、user_util等

repository内部可以按照不同存储方式分为memory（内存存储）、db（数据库存储）等

handler也可以分为外部处理和保护处理等层

以下为可能出现的结构（部分）：

| 层级/类别 | 目录/包名 | 核心职责与内容 | 关键原则与说明 |
| :--- | :--- | :--- | :--- |
| **应用入口层** | `/cmd/<appname>` | 应用程序的入口点 (`main` 包)。每个子目录对应一个可执行文件，如 `cmd/api`, `cmd/cli` | **保持精简**。`main.go` 应只包含初始化、依赖注入和启动逻辑。业务代码应置于 `internal` 或 `pkg`  |
| **接口层 (API/HTTP)** | `/internal/handler` (或 `controller`) | HTTP 请求处理层，负责参数绑定、校验、基本序列化/反序列化 | 不应包含业务逻辑，通常调用 `service` 层 |
| **业务逻辑层** | `/internal/service` (或 `usecase`) | 核心业务逻辑和用例流程的实现层。协调多个 `repository` 或领域对象完成业务操作 | **基于接口编程**。通过依赖注入接收 `repository` 等依赖，便于测试 |
| **数据访问层** | `/internal/repository` (或 `dao`) | 负责与数据源（数据库、缓存、外部 API）交互。对上层提供统一的数据操作接口 | **基于接口编程**。`service` 层依赖 `Repository` 接口，而非具体实现，实现解耦 |
| **领域模型层** | `/internal/domain` (或 `model`, `entity`) | 定义核心业务数据结构、枚举、领域对象的行为（方法）和业务规则 | 应保持 **高内聚、低耦合**，不包含具体技术（如 DB 注解）的依赖 |
| **内部共享工具** | `/internal/pkg` | 项目内部多个模块共享的、但不想暴露给外部的辅助代码，如项目特定的数据库连接池、内部中间件 | 受 `internal` 目录的 **Go 编译器强制保护**，外部项目无法导入|
| **公共库代码** | `/pkg` | 设计良好、希望被**外部项目**导入和使用的公共库代码，如 `pkg/logger`, `pkg/errors` | 需慎重设计公开 API。对于是否使用此目录存在争议，中小型单体项目可酌情简化 |
| **接口定义** | `/api` | 存放 API 契约文件，如 OpenAPI (Swagger) Spec、Protocol Buffers (`.proto`) 文件、GraphQL Schema | 将 **接口契约与实现分离**，便于前后端协作和生成客户端代码|
| **配置模板** | `/configs` | 配置文件模板或默认配置（如 `config.yaml.tmpl`） | **切勿在此存放含密码、密钥等敏感信息的真实配置文件** |
| **部署配置** | `/deployments` (或 `/deploy`) | IaaS、PaaS、容器编排（如 Docker-Compose, Kubernetes/Helm, Terraform）的配置和模板  | 将部署逻辑与应用程序代码分离 |
| **构建与CI** | `/build` | 打包和持续集成相关的配置和脚本。通常包含 `/build/ci` (CI 配置) 和 `/build/package` (系统包配置) | 与 `Makefile` 和 `scripts` 目录协同工作 |
| **脚本库** | `/scripts` | 用于执行构建、安装、分析等操作的脚本。这些脚本可被根目录的 `Makefile` 调用 | 复杂项目可在其下建立子目录，如 `scripts/make-rules`, `scripts/lib` (Shell 库)|
| **项目工具** | `/tools` | 存放本项目专用的支持工具，这些工具可以导入 `pkg` 和 `internal` 中的代码 | 将工具代码与应用程序代码分开管理 |
| **外部工具与代码** | `/third_party` | 外部辅助工具、Fork 的第三方代码或其他第三方应用（如 Swagger UI） | 方便清晰地管理自定义修改的第三方依赖 |
| **前端资源** | `/web` (或 `/assets`) | Web 前端静态资源，如 CSS、JavaScript 文件、服务端模板和单页应用 (SPA) | 主要用于全栈 Web 项目 |
| **项目文档** | `/docs` | 设计文档、用户手册、开发指南等（非 Godoc 生成的 API 文档）可按语言细分，如 `docs/guide/zh-CN`| 保持文档与代码版本同步 |
| **代码示例** | `/examples` | 为应用程序或公共库提供的使用示例代码，降低使用者上手门槛 | 示例应简洁、典型、可运行  |
| **网站数据** | `/website` | 如果不使用 GitHub Pages，可在此存放项目的网站数据 | 适用于有独立站点的开源项目 |
| **Git钩子** | `/githooks` | 项目相关的 Git 钩子脚本，如 `commit-msg` 钩子 | 可通过 Git 配置指向此目录来共享钩子 |
| **测试相关** | `/test` | **额外的**外部测试应用和测试数据。用于集成测试、端到端测试。可包含 `/test/testdata`。 | **单元测试** (`_test.go` 文件) 应与被测试代码放在同一包内 |
| **依赖包** | `/vendor` | 项目依赖的第三方库代码（通过 `go mod vendor` 生成）。用于固定依赖版本或离线构建 | 现代 Go Modules 下通常无需提交至仓库，但特定场景（如保障确定性构建）仍有用  |

## RESTful API

RESTful API 是一种基于 REST架构风格设计的网络应用程序接口，它通过一系列设计原则和约束条件，让网络服务变得更加清晰、简洁且易于维护


### 🔑六大核心原则
RESTful API 的设计建立在以下六项架构约束之上：

- **统一接口**

  - 这是REST最核心的约束，它确保与API的交互是标准化的。主要体现在：使用URI唯一地标识每个资源；使用标准的HTTP方法（GET, POST, PUT, DELETE等）来操作资源；返回自描述的消息，通常使用JSON或XML格式


- **无状态**

    - 每个从客户端发往服务器的请求都必须包含理解该请求所需的全部信息。服务器不会存储任何与会话相关的上下文状态。这使得服务器更容易扩展，也简化了系统设计


- **客户端-服务器分离**

    - 关注点分离。客户端负责用户界面和用户体验，服务器负责数据处理和存储。两者可以独立开发和演化，只要它们之间的接口不变


- **可缓存**

    - 服务器返回的响应必须明确表明其是否可以被客户端或中间代理缓存。这可以显著提高性能，减少不必要的网络请求


- **分层系统**

    - 架构可以由多个层次组成（如：负载均衡、应用服务器、数据库）。客户端不需要知道它是在与哪一层交互，这有助于提高系统的可扩展性和安全性


- **按需代码**

    - 这是一个可选的约束。服务器可以临时将可执行代码（如JavaScript脚本）发送给客户端，以扩展客户端的功能


### 📐设计规范

在实际设计中，上述原则转化为一些非常具体的实践规范


#### URI 设计

- 使用名词而非动词：URI应该标识资源本身，而不是对资源的操作。例如，应使用 /users，而不是 /getUsers

- 使用复数名词：通常建议对资源集合使用复数形式，如 /products比 /product更常见

- 使用连字符-而非下划线_：这主要是为了提升URI的可读性

- 体现层级关系：对于有关联的资源，可以使用嵌套路径，例如 /users/123/orders表示用户ID为123的所有订单

#### HTTP 方法的正确使用

- GET：检索/获取资源。不应改变资源状态

- POST：创建新资源

- PUT：完整更新已存在的资源（客户端提供更新后的完整资源）

- PATCH：部分更新资源（客户端只提供需要改变的字段）

- DELETE：删除资源

#### 使用标准的HTTP状态码

API通过状态码告知客户端请求的结果，这构成了通信契约的重要部分


- 200 OK：请求成功。

- 201 Created：资源创建成功。

- 204 No Content：请求成功，但无返回内容（如删除操作后）。

- 400 Bad Request：客户端请求错误（如参数有误）。

- 401 Unauthorized：未认证（身份验证失败）。

- 403 Forbidden：无权限（认证成功，但无权访问）。

- 404 Not Found：请求的资源不存在。

- 500 Internal Server Error：服务器内部错误。

#### 返回统一的响应格式

通常使用JSON作为数据交换格式，并保持响应结构的一致性。一个常见的成功响应格式如下


```json
{
    "code": 200,
    "status": "success",
    "data": {
        "id": 1,
        "name": "Example"
    }
}
```
而错误响应则可能包含错误信息：

```json
{
    "code": 404,
    "status": "error",
    "message": "Requested resource not found"
}
```
## 流程规范

以handler为例

handler:

创建数据 -> 捕获数据 -> 调用服务层（service）-> 构建响应(model.response) -> 返回响应（response）

. . . . . . 

# 面向接口与依赖注入

1. 接口定义的位置

在Go中，接口由使用方定义是一种最佳实践。这意味着，操作数据的接口（如 UserRepository）应该在调用它的层中定义，而不是在实现它的层中
。

业务逻辑层（service）定义它需要什么样的数据存取功能（repository接口）。

数据访问层（repository）负责实现这个接口。

这样做彻底解耦了业务逻辑和具体的技术实现，使得更换数据库（如从MySQL到PostgreSQL）或为测试提供Mock实现变得非常容易
。

2. 依赖注入（Dependency Injection）

依赖注入是实现控制反转、连接各层的关键技术。它通常在 main.go或专门的 wire包中完成：

在入口函数中，初始化所有具体的实现（如数据库连接、第三方SDK）。

将具体实现实例，注入到需要它们接口的业务组件中（如将 userRepository实例传递给 userService）。

## 实例
![](/images/albums/blogAlbum/Go-rule1.png)

[Demo](https://github.com/Claran309/Go-Demo-Login_And_Register)