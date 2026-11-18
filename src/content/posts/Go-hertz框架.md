---
townId: go-hertz
title: 走进hertz框架
description: 对hertz框架的简单介绍.
category: Golang
series: "Go Web 开发"
seriesIndex: 1
tags:
  - Golang
  - 后端
date: 2026-03-02
draft: false
cover: /assets/posts/covers/cover25.webp
coverAlt: 走进hertz框架
---
# 引言

即将进入微服务时，hertz是最好要学习的一个web框架，这篇文章简单介绍一下hertz的特色和使用示例

**代码示例仓库：[Link](https://github.com/Claran309/microservice-learning-demo)**

# 概述

hertz是一个由**字节跳动**开发的高性能web框架

相比于gin框架，hertz性能更高，**原生主持http1.1/http2和websocket**等协议，支持IDL一键生成代码，且内部封装多重常用中间件，更加适应于微服务和云原生项目

# 快速学习

由于hertz的类gin API设计，拥有gin基础后学习hertz的成本会很低，此处进行常规代码示例和与gin差异之处的讲解

## 启动服务器、使用中间件与注册路由

与gin类似，区别在于hertz启动服务器为srv.spin()

```go
func main() {
// 初始化 Hertz 服务器
// 默认使用 Netpoll 网络库
h := server.Default(
server.WithHostPorts(":8080"),      // 监听端口
server.WithMaxRequestBodySize(4<<20), // 最大请求体 4MB
)

    // 日志中间件
    // 配置 Logrus 作为日志器
    logger := logrus.NewLogger()
    hlog.SetLogger(logger)
    
    // 恢复中间件（防止 panic 导致服务崩溃）
    h.Use(recovery.Recovery(
        recovery.WithRecoveryHandler(func(c context.Context, ctx *app.RequestContext, err interface{}, stack []byte) {
            hlog.CtxErrorf(c, "发生 Panic: %v\n堆栈: %s", err, stack)
            ctx.JSON(500, utils.H{
                "error": "服务器内部错误",
            })
        }),
    ))
    
    // 自定义中间件
    h.Use(requestTimeMiddleware())
    
    // 公开路由（无需认证）
    public := h.Group("/api")
    {
        public.GET("/ping", pingHandler)
        public.GET("/health", func(c context.Context, ctx *app.RequestContext) {
            ctx.String(200, "OK")
        })
    }
    
    // 需要认证的路由组
    api := h.Group("/api")
    api.Use(authMiddleware()) // 应用认证中间件
    {
        // 用户相关路由
        userGroup := api.Group("/users")
        {
            userGroup.GET("/:id", getUserHandler)      // GET /api/users/123
            userGroup.POST("", createUserHandler)       // POST /api/users
            userGroup.PUT("/:id", updateUserHandler)   // PUT /api/users/123
            userGroup.DELETE("/:id", deleteUserHandler) // DELETE /api/users/123
        }
        
        // 产品相关路由
        api.GET("/products", listProductsHandler)
        api.GET("/products/:id", getProductHandler)
    }
    
    // 静态文件服务
    h.Static("/static", "./static")
    
    // 404 处理
    h.NoRoute(func(c context.Context, ctx *app.RequestContext) {
        ctx.JSON(404, utils.H{
            "error": "请求的资源不存在",
            "path":  string(ctx.Request.URI().Path()),
        })
    })
    
    // 优雅关闭处理
    h.OnShutdown = append(h.OnShutdown, func(ctx context.Context) {
        hlog.Info("服务正在优雅关闭...")
        time.Sleep(2 * time.Second) // 等待请求处理完成
        hlog.Info("服务已关闭")
    })
    
    // 启动服务器
    hlog.Info("Hertz 服务器启动，监听端口: 8080")
```

其他差异

```go
// 获取 Form 表单数据（multipart/form-data）
formValue := ctx.FormValue("field")
formFile, _ := ctx.FormFile("file")
```

## handler示例

区别在于

1. 参数由`c *gin.context`变为`c context.Context,ctx *app.RequestContext`

2. 绑定请求结构体方法由`ShouldBindJSON`变为`Bind`或`BindAndValidate`

3. `gin.H`由内部结构`utils.H`替换

```go
// Handler 示例
func updateUserHandler(c context.Context, ctx *app.RequestContext) {
userID := ctx.Param("id")

    var req struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }
    
    if err := ctx.BindAndValidate(&req); err != nil {
        ctx.JSON(400, utils.H{"error": "invalid request"})
        return
    }
    
    // 获取中间件设置的用户信息
    authUserID, _ := ctx.Get("user_id")
    
    ctx.JSON(200, utils.H{
        "id":        userID,
        "name":      req.Name,
        "email":     req.Email,
        "updated_by": authUserID,
        "status":    "updated",
    })
}
```

## 中间件示例

除了参数差异`c *gin.context`变为`c context.Context,ctx *app.RequestContext`，其他完全与gin相同

以jwt中间件为例

```go
func JWTMiddleware(config JWTConfig) app.HandlerFunc {
	return func(c context.Context, ctx *app.RequestContext) {
        // 从请求头获取token
		authHeader := ctx.GetHeader("Authorization")
        if authHeader == "" {
            ctx.JSON(consts.StatusUnauthorized, utils.H{
                "code":    401,
                "message": "Authorization header is required",
            })
        ctx.Abort()
        return
	}

        // 检查Bearer格式
        const bearerPrefix = "Bearer "
        if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
            ctx.JSON(consts.StatusUnauthorized, utils.H{
                "code":    401,
                "message": "Authorization header format must be 'Bearer {token}'",
            })
            ctx.Abort()
            return
        }
        
        // 提取token
        tokenString := authHeader[len(bearerPrefix):]
        
        // 解析和验证token
        claims, err := ParseToken(tokenString, config)
        if err != nil {
            ctx.JSON(consts.StatusUnauthorized, utils.H{
                "code":    401,
                "message": "Invalid or expired token",
                "error":   err.Error(),
            })
            ctx.Abort()
            return
        }
        
        // 将用户信息存储到上下文
        ctx.Set("user_id", claims.UserID)
        ctx.Set("username", claims.Username)
        ctx.Set("roles", claims.Roles)
        ctx.Set("jwt_claims", claims)
        
        // 继续处理请求
        ctx.Next(c)
    }
}
```

# 总结

hertz框架总体来说与gin较类似，基础学习较为简单，这篇文章仅做基础框架讲解，关于hertz更复杂的方法今后再详细学习，接下来先步入微服务的学习

# 学习文章
**[CloudWeGo | Hertz](https://www.cloudwego.io/zh/docs/hertz/)**