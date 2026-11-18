---
townId: go-gin
title: 初入Web编程：计网，http，JSON和Gin框架
description: 开始正式步入Go-Web编程.
category: Golang
series: "Go Web 开发"
seriesIndex: 0
tags:
  - Golang
  - 后端
date: 2025-11-01
draft: false
cover: /assets/posts/covers/cover16.webp
coverAlt: 初入Web编程：计网，http，JSON和Gin框架
---
# 计网（基础）

## 5层网络模型
在计算机网络中，一般由5层网络模型提供网络服务：

5层网络模型是计算机网络的经典分层架构，每层负责不同的功能：
- **物理层** - 最底层，定义物理介质上的比特流传输。
- **数据链路层** - 管理相邻节点之间的数据传输，确保物理链路上的可靠性。
- **网络层** - 处理网络间路由和寻址，将数据从源主机发送到目的主机。核心协议是IP协议。
- **传输层** - 负责端到端的通信，确保数据可靠传输。主要协议有TCP（可靠连接）和UDP（无连接服务）。
- **应用层** - 最上层，直接面向用户应用程序，提供网络服务接口。常见协议包括HTTP（用于网页浏览）、FTP（文件传输）、DNS（域名解析）等。
![](/images/albums/blogAlbum/Go-Web1.png)

## Socket协议
### 服务器监听及响应的过程
![](/images/albums/blogAlbum/Go-Web2.png)

socket : 创建网络通讯起点（监听嵌套字）

bind : 将socket绑定到特定的地址和端口

listen : 进入监听状态

### 三次握手建立连接
三次握手是TCP建立可靠连接的过程：

1. **第一次握手**：客户端发送SYN=1和序列号seq=x
    - *目的*：发起连接请求，表示"我想和你建立连接"
    - *意义*：检查客户端能否正常发送数据，防止无效请求

2. **第二次握手**：服务端响应SYN=1、ACK=1、seq=y、ack=x+1
    - *目的*：确认收到请求，并同步自己的状态
    - *意义*：确保服务端活跃且愿意通信

3. **第三次握手**：客户端发送ACK=1、seq=x+1、ack=y+1
    - *目的*：最终确认连接
    - *意义*：防止已失效的请求突然到达，建立可靠连接

### 四次挥手关闭连接
四次挥手是TCP安全关闭连接的过程：

1. **第一次挥手**：主动方发送FIN=1、seq=u
    - *目的*：请求关闭连接

2. **第二次挥手**：被动方响应ACK=1、ack=u+1
    - *目的*：确认关闭请求，但可能还有数据要发送

3. **第三次挥手**：被动方发送FIN=1、ACK=1、seq=w、ack=u+1
    - *目的*：被动方也准备关闭

4. **第四次挥手**：主动方响应ACK=1、ack=w+1
    - *目的*：最终确认完全关闭

## URL/URI
- **URI**（统一资源标识符）：资源的完整标识，如身份证号
- **URL**（统一资源定位符）：URI的子集，提供资源位置，如家庭地址
- 格式：`协议://主机:端口/路径?查询参数#片段`

# HTTP基础
包：`net/http`

## HTTP报文与请求-响应模型

**请求-响应模型**是HTTP通信的核心机制：客户端发送请求报文，服务器处理后返回响应报文

### http请求报文

一个HTTP请求报文由请求行（request line） 、请求头部（header）、空行和请求数据4个部分组成。
#### （1）请求行

请求行是请求报文的起始部分，包含以下内容：

- **HTTP方法**：描述请求的动作（如GET、POST、PUT等）。
- **目标路径（URI）**：资源的标识符，不包括域名。
- **HTTP版本**：使用的HTTP协议版本（如HTTP/1.1）。

| **方法**   | **功能**                                                     | **是否幂等** | **特点**                                                                                 |
|------------|--------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------|
| **GET**    | 获取服务器上的资源（数据或页面）。                             | 是           | - 数据通过 URL 传递<br>- 不应修改服务器状态<br>- 适合只读操作                              |
| **POST**   | 向服务器发送数据以创建资源或触发操作。                         | 否           | - 数据在请求体中<br>- 用于表单提交、创建资源或触发逻辑                                    |
| **PUT**    | 更新或创建服务器上的资源（完全替换目标资源）。                 | 是           | - 数据在请求体中<br>- 更新时完全覆盖资源<br>- 常用于资源的创建或更新操作                  |
| **DELETE** | 删除服务器上的指定资源。                                      | 是           | - 删除操作<br>- 调用多次对结果无影响                                                     |
| **PATCH**  | 更新服务器上的资源（部分更新）。                              | 否           | - 对资源的部分字段进行修改<br>- 非幂等（取决于实现方式）                                 |
| **HEAD**   | 类似 GET，但不返回响应体，仅返回响应头。                      | 是           | - 用于检查资源是否存在或获取元信息                                                      |
| **OPTIONS**| 返回服务器支持的 HTTP 方法和选项。                            | 是           | - 用于探测服务器支持的能力<br>- 不对资源状态产生影响                                     |
| **TRACE**  | 回显收到的请求，主要用于调试和诊断。                          | 是           | - 直接返回请求内容<br>- 不常用，可能存在安全隐患                                         |
| **CONNECT**| 用于建立隧道连接，通常用于 HTTPS。                            | 否           | - 用于代理服务器，主要处理加密的 SSL/TLS 隧道                                           |

> 幂等操作的效果在执行一次和多次时是相同的

#### （2）请求头

**请求头部由关键字/值对组成，每行一对**

典型的请求头有：

● Host：请求的主机名，允许多个域名同处一个IP 地址，即虚拟主机;

● connection：连接方式(close 或 keepalive);

● Cookie：存储于客户端扩展字段，向同一域名的服务端发送属于该域的cookie;

#### (3) 空行

空行用于分隔请求头和请求体。如果没有请求体，空行直接结束报文。

#### (4) 请求体（可选）

请求体包含请求发送的数据，在某些方法（如POST、PUT）中使用。可以是表单数据，JSON数据或上传文件。

### http响应报文

响应报文由状态行，响应头，空行，响应体组成

#### （1）状态行

状态行是响应报文的起始部分，包含以下内容：

- **HTTP版本**：服务器使用的HTTP版本（如HTTP/1.1）。
- **状态码**：用数字表示请求的处理结果（如200、404）。
- **状态文本**：对状态码的简短描述（如OK、Not Found）。

状态码：由3位数字组成，第一个数字定义了响应的类别

##### 状态码总结表

| 类别    | 含义       | 常见状态码及描述                                             |
| ------- | ---------- | ------------------------------------------------------------ |
| **1xx** | 信息性响应 | 100 Continue, 101 Switching Protocols                        |
| **2xx** | 成功       | 200 OK, 201 Created, 204 No Content                          |
| **3xx** | 重定向     | 301 Moved Permanently, 302 Found, 304 Not Modified           |
| **4xx** | 客户端错误 | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **5xx** | 服务器错误 | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable |

#### (2) 响应头

常见响应头

- Date：消息产生的时间
- Age:（从最初创建开始）响应持续时间
- Server: 向客户端标明服务器程序名称和版本

##### (3) 空行

空行用于分隔响应头和响应体。如果没有响应体，空行直接结束报文。

##### (4) 响应体（可选）

响应体包含返回的数据内容，例如HTML页面、JSON数据或文件内容。

### 代码实现（了解）

了解完基本概念之后，我们可以从go语言中的http/tcp包来讲讲怎么启动一个服务器


```go
package main

import (
	"fmt"
	"net/http"
)

// PingHandler 是一个独立封装的处理函数
func PingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}//判断请求方法是否是GET
	w.Write([]byte("pong"))
}

// HelloHandler 返回 "Hello, World!"
func HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello, World!"))
}

func main() {
	// 创建自定义的多路复用器
	mux := http.NewServeMux()

	// 注册路由，使用封装的处理函数
	mux.HandleFunc("/ping", PingHandler)
	mux.HandleFunc("/hello", HelloHandler)

	// 创建自定义的 HTTP 服务器
	server := &http.Server{
		Addr:    ":8080", // 监听地址和端口
		Handler: mux,     // 使用自定义的多路复用器
	}

	// 启动服务器
	fmt.Println("Server is running at http://localhost:8080")
	if err := server.ListenAndServe(); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
```

# JSON基础

## 简介
JSON 指的是 JavaScript 对象表示法（JavaScript Object Notation）

其为一种轻量级的数据交换格式

可以被使用在多种编程语言中，且常用于前后端之间的数据传输

我们主要学习JSON文本信息存储格式

## 语法

- 数据在`键/值`对中
- 数据由逗号 `,` 分隔
- 使用斜杆 `\` 来转义字符
- 大括号 `{}` 保存对象
- 中括号 `[]` 保存数组，数组可以包含多个对象
### JSON 的两种结构：

1. 对象：大括号 `{}` 保存的对象是一个无序的`名称/值`对集合。一个对象以左括号 `{` 开始， 右括号 `}` 结束。每个"键"后跟一个冒号 `:`，`名称/值`对使用逗号 `,` 分隔。
2. 数组：中括号 `[]` 保存的数组是值（value）的有序集合。一个数组以左中括号 `[` 开始， 右中括号 `]` 结束，值之间使用逗号 `,` 分隔。

### 代码示例
```json
//对象
{   
    "name": "Claran", 
    "age": 18, 
    "university": "cqupt",
}

//数组
[ "Blue_Archive", "Senren*Banka", "Valorant" ]
```

# Gin框架

尽管`http` 包虽然功能齐全，但编写完整的 Web 应用需要重复写大量的基础代码，Web框架对其进行了封装，提供了：

更强大的路由功能，更简洁的api，更方便的中间件支持，更快的开发效率

## 基础语法

- `gin.Default()`: 创建一个包含基础中间件 (Logger, Recovery) 的 Gin 引擎。
- `r.GET(path, handler)`: 定义一个处理 GET 请求的路由。path 是路径，handler 是一个 func(c *gin.Context) 类型的函数。
- `c *gin.Context`: 这是 Gin 的核心！它包含了请求和响应的所有信息和方法。
- `c.JSON(httpStatus, data)`: 以 JSON 格式返回响应。http.StatusOK 是 200。gin.H 是创建 map[string]interface{} 的便捷方式。
- `r.Run()`: 启动 Web 服务器。

```go
package main

import (
    "net/http" // 引入 net/http 标准库，用于 HTTP 状态码常量
    "github.com/gin-gonic/gin"
)

func main() {
    // 1. 创建一个默认的路由引擎
    // Default() 包含了 Logger 和 Recovery 中间件，方便调试和异常恢复
    r := gin.Default()

    // 2. 定义一个 GET 路由 和对应的处理函数
    // 当访问 /ping 时，会执行后面的匿名函数
    r.GET("/ping", func(c *gin.Context) {
        // 3. 使用 c.JSON 返回 JSON 格式的响应
        // 参数：HTTP 状态码，响应数据 (gin.H 是 map[string]interface{} 的快捷方式)
        c.JSON(http.StatusOK, gin.H{
            "message": "pong!",
            "status":  "ok",
        })
    })

    // 4. 启动 HTTP 服务，默认监听在 0.0.0.0:8080
    // 你也可以指定端口，例如 r.Run(":9090")
    err := r.Run()
    if err != nil {
       panic("Failed to start Gin server: " + err.Error())
    }
}
```
运行后，打开浏览器或使用 curl 访问 ( http://localhost:8080/ping ) 

你应该会看到：

```json
{
    "message": "pong!",
    "status": "ok"
}
```

## 路由

路由是 Web 框架的基础，Gin 提供了非常灵活强大的路由功能

### 基础 HTTP 方法

```go
r.GET("/someGet", getting)
r.POST("/somePost", posting)
r.PUT("/somePut", putting)
r.DELETE("/someDelete", deleting)
r.PATCH("/somePatch", patching)
r.HEAD("/someHead", head)
r.OPTIONS("/someOptions", options)

// ...对应的处理函数 getting, posting 等需要自行定义
func getting(c *gin.Context) { /* ... */ }
func posting(c *gin.Context) { /* ... */ }
// ...
```

### 路由参数
```go
// 匹配 /users/john, /users/123 等
r.GET("/users/:id", func(c *gin.Context) {
    // 使用 c.Param() 获取路径参数
    userID := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"user_id": userID})
})

// 也可以有多个参数
r.GET("/articles/:category/:article_id", func(c *gin.Context) {
    category := c.Param("category")
    articleID := c.Param("article_id")
    c.JSON(http.StatusOK, gin.H{
        "category":   category,
        "article_id": articleID,
    })
})
```
> 访问 `http://localhost:8080/users/Claran` 会得到 `{"user_id":"Claran"}`

### 查询参数 

查询参数是 URL `?` 后面的键值对，例如 `/search?query=gin&page=1`

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/search", func(c *gin.Context) {
		page := c.Query("page")
		information := c.DefaultQuery("information", "none")
		extra, ok := c.GetQuery("extra")
		if !ok {
			extra = "none"
		}
		c.JSON(http.StatusOK, gin.H{
			"page":        page,
			"information": information,
			"extra":       extra,
		})
	})
	err := r.Run(":8080")
	if err != nil {
		panic(err)
	}
}

// http://localhost:8080/search?page=3&information=%E9%87%8D%E5%BA%86%E9%82%AE%E7%94%B5%E5%A4%A7%E5%AD%A6

```

> `http://localhost:8080/search?page=3&information=%E9%87%8D%E5%BA%86%E9%82%AE%E7%94%B5%E5%A4%A7%E5%AD%A6`
> 
> 会得到 `{"extra":"none","page":"3","information":"重庆邮电大学"}`

### 路由分组
当有多个路由共享相同的前缀（例如 API 版本 `/api/v1`）或需要应用相同的中间件时，路由分组非常有用
```go
// 创建一个 /api/v1 的路由组
v1 := r.Group("/api/v1")
{ // 可以用花括号增加可读性
    v1.GET("/users", func(c *gin.Context) { /* 获取用户列表 */
        c.JSON(http.StatusOK, gin.H{"users": []string{"user1", "user2"}})
    })
    v1.POST("/users", func(c *gin.Context) { /* 创建用户 */
        c.JSON(http.StatusCreated, gin.H{"message": "User created"})
    })

    // 可以在分组上应用中间件 (后面会讲)
    // v1.Use(AuthMiddleware())
}

// 另一个分组
v2 := r.Group("/api/v2")
{
    v2.GET("/products", func(c *gin.Context) { /* ... */ })
}
```

> 现在可以通过 `/api/v1/users` 访问用户相关接口了

## 请求处理

### 获取表单数据（form-data）

表单，是一个用于手机用户输入信息并将其提交给服务器的数据格式

例如：`username=Claran&password=123456`

这个表单储存了username和password的信息

> **content-type** :`application/x-www-form-urlencoded 或 multipart/form-data`

在Gin框架中获取表单数据：
```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.POST("/login", func(c *gin.Context) {
		username := c.PostForm("username")
		password := c.DefaultPostForm("password", "none")//若没检索到则为none
		//c.GetPostForm返回两个值，value和ok
		c.JSON(http.StatusOK, gin.H{
			"status":   "logged in",
			"username": username,
			"password": password,
		})
	})
	err := r.Run()
	if err != nil {
		panic(err)
	}
}

//curl.exe -X POST http://localhost:8080/login -d "username=Claran&password=12345679"

```

### JSON数据转换
Gin 可以轻松地将请求体中的 JSON 绑定到 Go 结构体

在结构体中，使用 json tag 指定 JSON 字段名，使用 binding tag 添加校验规则（ 需要引入 `go-playground/validator`）

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type User struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

func main() {
	r := gin.Default()
	r.POST("/register", func(c *gin.Context) {
		var user User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"username": user.Username,
			"password": user.Password,
			"email":    user.Email,
		})
	})
	err := r.Run()
	if err != nil {
		panic(err)
	}
}
```

## 中间件Middleware

**为web项目的路由注册中间件，则在被注册路由提交请求/返回响应时，请求/响应数据会自动流过中间件，执行其中的方法**

常见中间件比如：

- 日志记录
- 错误处理
- 鉴权
- . . .

> 注：`gin.Default()`默认使用`gin.Logger()`和`gin.Recovery()`中间件

使用中间件：

### 全局使用

```go
r := gin.Default()
// 在这里添加你的全局中间件
r.Use(MyGlobalMiddleware())
// ... 定义路由 ...
```

### 路由组使用
```go
adminGroup := r.Group("/admin")
// 只对 /admin/* 路由应用 AuthMiddleware
adminGroup.Use(AuthMiddleware())
{
    adminGroup.GET("/dashboard", ...)
    adminGroup.POST("/settings", ...)
}
```

### 单个路由使用
```go
r.GET("/special", AnotherMiddleware(), func(c *gin.Context) { /* ... */ })
```

### 自定义中间件
中间件函数必须返回 gin.HandlerFunc 类型
```go
// 一个简单的自定义日志中间件示例
func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        fmt.Printf("Before request: %s %s\n", c.Request.Method, c.Request.URL.Path)

        // 调用链中的下一个处理函数 (可能是另一个中间件或最终的 Handler)
        c.Next() // <--- 重要！

        // 在请求处理完成后执行
        statusCode := c.Writer.Status()
        fmt.Printf("After request: Status %d\n", statusCode)
    }
}
```

### 中间件方法
- `c.Next` : 阻塞当前中间件，调用后续的处理函数
- `c.Abort` : 中止执行，后续中间件和
- `c.AbortWithStatusJSON` : 终止并直接返回一个 JSON 响应
- `c.Set(key, value)` 和 `c.Get(key)` : 在不同中间件中通过定义键值对传递数据

## 项目结构
在编写Web项目时，代码和逻辑会很复杂，需要做好结构管理使内容条目清晰

以 Register&Login 简单项目举例：
```
├── README.md
├── api
├── dao
├── go.mod
├── model
└── utils
```
- README.md：项目的说明文档
- api：接口层，在里面是详细的逻辑实现以及路由。
- dao：全名为 data access object，进行数据库操作。
- model：模型层，主要放数据库实例的结构体。
- utils：一些常用的工具函数，封装在这里减少代码的重复使用。
- go.mod：依赖管理

例如：
![](/images/albums/blogAlbum/Go-Web3.png)

# 使用Postman测试API接口
postman是一款便捷的用于测试api接口的工具，可向url发送post/get等多种type的数据

这部分很简单，用一次就会了

如：
![](/images/albums/blogAlbum/Go-Web4.png)
该操作向 `http://localhost:8080/regitser` 发送了表单数据：`username=Claran&password=chr070309&email=big_fell_sans@163.com`数据
并得到返回JSON数据：`{"status":200,"msg":"User registered successfully"}` 