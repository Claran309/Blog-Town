---
townId: go-jwt
title: Web编程中如何实现鉴权与JWT的详解
description: Go-Web中的JWT中间件和鉴权操作学习.
category: Golang
tags:
  - Golang
  - 后端
date: 2025-11-06
draft: false
cover: /assets/posts/covers/cover17.webp
coverAlt: Web编程中如何实现鉴权与JWT的详解
---
# 基础知识

## 鉴权
> 计网和Gin基础知识：**[Link](https://www.claran-blog.work/go-gin/)**

我们都知道 HTTP 协议是**无状态**的，所谓的无状态就是客户端每次想要与服务端通信，都必须重新与服务端链接，意味着请求一次客户端和服务端就连接一次，下一次请求与上一次请求是**没有关系**的

这种无状态的方式就会存在一个问题：如何判断两次请求的是同一个人？就好比用户在页面 A 发起请求获取个人信息，然后在另一个页面同样发起请求获取个人信息，我们如何确定这俩个请求是同一个人发的呢？

为了解决这种问题，我们就迫切需要一种方式知道发起请求的客户端是谁？此时，cookie、token、session 就出现了，它们就可以解决客户端标识的问题，甚至是解决权限问题


## cookie & session
通常情况下，cookie 和 session 都是结合着来用

因此，这里我们就将 cookie 和 session 结合着来用

### cookie

#### 概述
Cookie 是一种在客户端存储数据的技术，它是由服务器发送给客户端的小型文本文件，存储在客户端的浏览器中,大小限制大致在 4KB 左右

在客户端发送请求时，浏览器会自动将相应的 Cookie 信息发送给服务器，服务器通过读取 Cookie 信息，就可以判断该请求来自哪个客户端

因此，Cookie 可以用于存储用户的登录状态、购物车信息等

在以前很多开发人员通常用 cookie 来存储各种数据，后来随着更多浏览器存储方案的出现，cookie 存储数据这种方式逐渐被取代，主要原因有如下:

1. cookie 有存储大小限制，4KB 左右

2. 字符编码为 Unicode，不支持直接存储中文

3. 数据可以被轻易查看

#### 流程图
![](/images/albums/blogAlbum/Go-JWT1.jpg)

### session

#### 概述
session 由服务端创建

当一个请求发送到服务端时，服务器会检索该请求里面有没有包含 sessionId 标识，如果包含了 sessionId，则代表服务端已经和客户端创建过 session，然后就通过这个 sessionId 去查找真正的 session，如果没找到，则为客户端创建一个新的 session，并生成一个新的 sessionId 与 session 对应，然后在响应的时候将 sessionId 给客户端，通常是存储在 cookie 中。如果在请求中找到了真正的 session，验证通过，正常处理该请求

每一个客户端与服务端连接，服务端都会为该客户端创建一个 session，并将 session 的唯一标识 sessionId 通过设置 Set-Cookie 头的方式响应给客户端，客户端将 sessionId 存到 cookie 中。

#### 流程图
![](/images/albums/blogAlbum/Go-JWT2.jpg)

## token

#### 概述

Token 是一种在客户端和服务端之间传递身份信息的方式

当用户登录成功后，服务端会生成一个 Token，将其发送给客户端

客户端在后续的请求中，需要将 Token 携带在请求头或请求参数中

服务端通过验证 Token 的合法性，就可以确定该请求来自哪个用户，并且可以根据用户的权限进行相应的操作

### 组成

Token是一个由一串字符组成的令牌，用于在计算机系统中进行身份验证和授权

token通常由三个部分组成：标头、有效载荷、签名

1. 标头（Header）：包含了加密算法和类型，用于指定如何对有效载荷进行编码和签名。常用的算法有HMAC、RSA、SHA等
2. 有效载荷（Payload）：包含了一些信息，如用户ID、角色、权限等，用于验证身份和授权。有效载荷可以是加密的，也可以是明文的
3. 签名（Signature）：是对标头和有效载荷进行密钥签名后得到的值，用于验证token的完整性和真实性

一个完整的token包含了标头、有效载荷和签名三个部分，它们一起构成了一个安全的令牌，用于进行身份验证和授权。

### 认证流程（Access token）

1. 客户端使用用户名跟密码请求登录
2. 服务端收到请求，去验证用户名与密码
3. 验证成功后，服务端会签发一个 token 并把这个 token 发送给客户端
4. 客户端收到 token 以后，会把它存储起来，比如放在 localStorage 里
5. 客户端每次发起请求的时候需要把 token 放到请求的 Header 里传给服务端
6. 服务端收到请求，然后去验证客户端请求里面带着的 token ，如果验证成功，就向客户端返回请求的数据

![](/images/albums/blogAlbum/Go-JWT3.jpg)

### Refresh Token

另外一种 token——refresh token

refresh token 是专用于刷新 access token 的 token。如果没有 refresh token，也可以刷新 access token，但每次刷新都要用户输入登录用户名与密码，会很麻烦。有了 refresh token，可以减少这个麻烦，客户端直接用 refresh token 去更新 access token，无需用户进行额外的操作

Access Token 的有效期比较短，当 Acesss Token 由于过期而失效时，使用 Refresh Token 就可以获取到新的 Token，如果 Refresh Token 也失效了，用户就只能重新登录了

Refresh Token 及过期时间是存储在服务器的数据库中，只有在申请新的 Acesss Token 时才会验证，不会对业务接口响应时间造成影响，也不需要向 Session 一样一直保持在内存中以应对大量的请求

## JWT

### 概述
JSON Web Token（简称 JWT）是目前最流行的跨域认证解决方案，是一种认证授权机制，是token的一种实现形式

JWT 是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准。、

JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源

比如用在用户登录上。 可以使用 HMAC 算法或者是 RSA 的公/私秘钥对 JWT 进行签名

因为数字签名的存在，这些传递的信息是可信的。

### 流程图
![](/images/albums/blogAlbum/Go-JWT4.jpg)

![](/images/albums/blogAlbum/Go-JWT6.jpg)

### 组成
- **JWT 生成示例：**

  ```json
  Header:
  {
    "alg": "HS256",
    "typ": "JWT"
  }
  
  Payload:
  {
    "user_id": 114514,
    "role": "admin",
    "exp": 1716579600
  }
  ```

![](/images/albums/blogAlbum/Go-JWT5.jpg)

- **生成的 JWT：**

  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  .
  eyJ1c2VyX2lkIjoxMjMsInJvbGUiOiJhZG1pbiIsImV4cCI6MTcxNjU3OTYwMH0
  .
  abc123signature
  ```

- **客户端：**
    - 接收到服务器返回的 JWT，将其存储在客户端（通常是 `localStorage` 或 `sessionStorage`也可以是cookie）
    - 后续请求中，客户端会将 JWT 作为凭证发送给服务器
    - 在请求受保护资源时，客户端通过 HTTP 请求头将 JWT 发送到服务器
    - 请求头中通常使用 `Authorization: Bearer <token>` 格式

- **服务端**：

  1.检查请求头中的 `Authorization` 是否包含 JWT。

    > Authorization: Bearer <具体的token字符串>

  2.提取 JWT 并验证：

    - **签名验证：**使用密钥验证签名是否正确，确保 Token 未被篡改。
    - **过期时间验证：**检查 `exp` 字段是否未过期。
    - **其他验证：**检查 `iss`（发行者）和 `aud`（受众）是否匹配。

  验证成功后，解析 `Payload`，提取用户信息和权限。

  如果 Token 无效或过期，返回 401 Unauthorized 错误

因为 JWT 是自包含的（内部包含了一些会话信息），因此减少了需要查询数据库的需要

因为用户的状态不再存储在服务端的内存中，所以这是一种无状态的认证机制生成


# JWT代码实现


## 依赖：

- gin框架: `go get -u github.com/gin-gonic/gin`
- JWT: `go get -u github.com/golang-jwt/jwt/v4`
- time包（存储Expiration过期时间）
- strings包（分解请求头信息）
- errors包（返回错误信息）

## 基础知识

### 声明（Claims）
JWT声明默认信息如下：

| 声明简称 | 英文全称         | 含义与作用                                                                 |
| :------- | :--------------- | :------------------------------------------------------------------------- |
| `iss`    | Issuer           | JWT的签发者，标识创建并签发该令牌的实体（例如某个认证服务器或服务）。 |
| `sub`    | Subject          | JWT的主题，标识该令牌所指向的主体（通常是用户ID），即令牌是关于谁的。 |
| `aud`    | Audience         | JWT的受众，指定该令牌意图提供给哪个或哪些接收方使用，接收方需验证自身是否在受众列表中。 |
| `exp`    | Expiration Time  | JWT的过期时间，一个Unix时间戳，超过此时间后令牌应被视为无效。 |
| `nbf`    | Not Before       | JWT的生效时间，一个Unix时间戳，在此时间之前令牌应被视为无效。 |
| `iat`    | Issued At        | JWT的签发时间，标识令牌是何时被创建的。 |
| `jti`    | JWT ID           | JWT的唯一标识符，为令牌提供一个唯一标识，常用于防止同一令牌被重复使用（重放攻击）。 |

### type token:
在jwt中，jwt.token是一种数据类型，用于储存token信息，详细数据如下：
```go
type Token struct {
    Raw       string                 // 原始 Token 字符串
    Method    SigningMethod          // 签名方法
    Header    map[string]interface{} // 头部信息
    Claims    Claims                 // 声明信息
    Signature []byte                 // 签名部分
    Valid     bool                   // 是否验证通过
}
```
## 实现流程

### 1. 设置JWT默认配置
在`config`包下：
```go
package config

import (
	"time"
)

// JWTConfig JWT配置
type JWTConfig struct {
	SecretKey      string
	Issuer         string
	ExpirationTime time.Duration
}

// DefaultJWTConfig 默认的JWT配置
var DefaultJWTConfig = JWTConfig{
	SecretKey:      "this_is_secret_key", // 秘钥，一般不保存在源代码中
	Issuer:         "jwt_study_demo",     // 签发者
	ExpirationTime: time.Hour * 24 * 7,   // 七天有效期
}
```
以上代码设置了JWT的默认配置DefaultJWTConfig，用于后续JWT配置的使用

### 2. 设置JWT具体方法
在`util`包下：
```go
package utils

import (
	"GoGin/JWT/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// GenerateToken 生成 tokenString
func GenerateToken(userID string, username string) (string, error) {
	//获取默认JWT配置
	jwtConfig := config.DefaultJWTConfig

	//创建JWT声明
	claims := jwt.MapClaims{
		"iss":      jwtConfig.Issuer,                                // 签发者
		"sub":      userID,                                          // 指向主体
		"iat":      time.Now().Unix(),                               // issued At -- 签发时间
		"exp":      time.Now().Add(jwtConfig.ExpirationTime).Unix(), // 有效期
		"nbf":      time.Now().Unix(),
		"username": username, "user_id": userID,
		//"aud" : ... // 受众
		//"jti" : ... // 唯一标识符
	}

	// 生成Token，算法：HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims) // jwt.NewWithClaims - 利用某算法为claims生成token
	// 对token签名
	tokenString, err := token.SignedString([]byte(jwtConfig.SecretKey)) // token.SignedString(key) - 为token进行密钥key签名
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ValidateTokenString 验证 JWT Token
func ValidateTokenString(tokenString string) (*jwt.Token, error) { // *jwt.Token - 一种数据类型，表示token类型
	// 获取token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) { // jwt.Parse(tokenString,key) - 用密钥key解析并验证JWT，此处func为验证获取密钥
		// 验证签名方式是否正确
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok { // Method为类型token的内部变量，表示签名方法   此处为类型断言，判断是否为HMAC方法
			return nil, jwt.ErrSignatureInvalid // 返回错误：签名验证失败
		}

		// 返回密钥
		return []byte(config.DefaultJWTConfig.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// ExtractClaims 提取 JWT 声明信息
func ExtractClaims(token *jwt.Token) (jwt.MapClaims, error) {
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid { // token.Claims.(jwt.MapClaims) 表示对token的声明信息进行类型断言; token.Valid 表示验证是否通过
		return claims, nil // 通过
	} else {
		return nil, jwt.ErrTokenInvalidClaims // 返回错误：jwt声明信息无效
	}
}
```
以上代码创建了三个JWT方法：生成 tokenString、验证 JWT Token和提取 JWT 声明信息，注意这三个方法的参数以及返回值

### 3. 创建JWT认证中间件
```go
package middleware

import (
	"GoGin/JWT/utils"

	"errors"

	"github.com/gin-gonic/gin"

	"github.com/golang-jwt/jwt/v5"

	"net/http"

	"strings"
)

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取请求头中的Authorization字段，err：无该字段
		authHeader := c.GetHeader("Authorization") // 从请求头获取Authorization字段
		if authHeader == "" {                      // 无该字段
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization required",
			})
			c.Abort()
			return
		}

		// 解析，获取token，err：格式不合法
		parts := strings.SplitN(authHeader, " ", 2)  // 将Authorization: Bearer  <token> 提取为[0]{Bearer}和[1]{<token>}
		if parts[0] != "Bearer" || len(parts) != 2 { // Authorization 信息格式不合法
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format",
			})
			c.Abort()
			return
		}
		tokenString := parts[1]

		// 验证token，err：过期 / 非法
		token, err := utils.ValidateTokenString(tokenString) // 验证tokenString
		if err != nil {
			if errors.Is(err, jwt.ErrTokenExpired) { // 错误：过期
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "token is expired",
				})
				c.Abort()
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{ // 错误：非法
				"error": "invalid token",
			})
			c.Abort()
			return
		}

		//提取声明信息，err：claims失败
		claims, err := utils.ExtractClaims(token)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "extract claims failed",
			})
			c.Abort()
			return
		}

		// 保存claims到上下文
		c.Set("user_id", claims["user_id"])
		c.Set("username", claims["username"])

		//c.nest
		c.Next()
	}
}
```
以上代码创建了一个JWT认证中间件JWTAuthMiddleware，路由注册该中间件后，对该路由的请求会流过该中间件，验证请求头中是否含有token以及token是否合法

### 4. 为受保护的路由注册中间件
```go
package routes

import (
	"GoGin/JWT/middleware"

	"github.com/gin-gonic/gin"

	"GoGin/JWT/handler"
)

func InitRouter() {
	r := gin.Default()

	// 登录路由
	r.POST("/login", handler.LoginHandler)

	// 受保护的路由组
	protected := r.Group("/api")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		protected.GET("/info", handler.InfoHandler)
	}
}
```
现在访问`http://localhost:8080/api/info` 会验证JWT

## 实现效果
Demo：[Github](https://github.com/Claran309/Go-Demo-Login_And_Register)

Article：[My-Blog](https://www.claran-blog.work/2025/11/04/Go-Demo%EF%BC%9A%E7%94%A8%E6%88%B7%E6%B3%A8%E5%86%8C%E4%B8%8E%E7%99%BB%E5%BD%95%E7%B3%BB%E7%BB%9F/)

使用Postman测试api后：
![](/images/albums/blogAlbum/Go-Web6.png)

![](/images/albums/blogAlbum/Go-Web7.png)