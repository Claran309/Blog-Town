---
townId: go-user-demo
title: Go-Demo：用户注册与登录系统
description: 学习过程中写的一个用户相关的CRUD基础Demo.
category: Golang
tags:
  - Golang
  - 后端
  - 项目
date: 2025-11-04
draft: false
cover: /assets/posts/covers/cover10.webp
coverAlt: Go-Demo：用户注册与登录系统
---
# [Github](https://github.com/Claran309/Go-My_Demo_1)

## 版本演进历程

### V1 - 基础版本
- 基于内存的临时数据存储
- 外层并发锁保证线程安全
- 基础的username/email注册登录系统

#### 项目结构

![](/images/albums/blogAlbum/Go-Web3.png)

****

### V2 - 认证升级
- 数据格式从前端表单升级为JSON
- 新增user_id作为唯一用户标识
- 引入JWT认证机制

#### 项目结构

![](/images/albums/blogAlbum/Go-Web5.png)

#### Postman

![](/images/albums/blogAlbum/Go-Web6.png)

![](/images/albums/blogAlbum/Go-Web7.png)

****
### V2.1 - 架构优化
- 重构项目结构，提升代码规范性

****
### V3 - 设计模式升级
- 采用面向接口编程思想
- 实现依赖注入架构

#### 项目结构

![](/images/albums/blogAlbum/Go-Demo1.png)

****
### V4 - 数据持久化
- 数据存储层重构：内存存储 → MySQL持久化存储

#### 项目结构

![](/images/albums/blogAlbum/Go-Demo2.png)

### V4.1 - 安全增强
- 敏感信息配置化，使用.env文件管理

****
### V5 - 业务功能扩展
- 支持refresh_token机制
- 基于jwt_role的身份鉴权系统
- 新增完整的选课系统功能：
    - 选课/退课操作
    - 课程列表查询
    - 已选课程查询
    - 管理员课程添加权限

#### 项目结构

![](/images/albums/blogAlbum/Go-Demo3.png)

****
### V6 - 安全与功能完善
- 密码加密/解密（bcrypt算法）
- 新增To-do-list功能模块：
    - 新建待办事项
    - 标记完成并删除
    - 直接删除事项
    - 获取已完成/未完成清单
  
****
### V7 - 性能优化
- 引入Redis缓存层，提升系统性能

#### 项目结构
```
GinProject_Logging&Registering/
├── api/                    # API层代码
│   ├── dao/               # 数据访问层
│   │   ├── cache/         # 缓存实现
│   │   │   ├── interface.go    # 缓存接口定义
│   │   │   └── redis.go        # Redis缓存实现
│   │   ├── memory/        # 内存存储实现
│   │   │   └── database.go
│   │   └── mysql/         # MySQL存储实现
│   │       ├── courses_mysql.go
│   │       ├── database.go
│   │       ├── todo_mysql.go
│   │       └── user_mysql.go
│   ├── handlers/          # HTTP处理器
│   │   ├── courses_handlers.go
│   │   ├── todo_handlers.go
│   │   └── user_handlers.go
│   └── services/          # 业务逻辑层
│       ├── courses.go
│       ├── todo.go
│       └── user.go
├── cmd/                   # 应用入口
│   └── main.go           # 主程序入口
├── internal/              # 内部包
│   ├── config/           # 配置管理
│   │   └── config.go
│   ├── middleware/       # 中间件
│   │   └── JWTMiddleware.go
│   ├── model/                # 数据模型
│   │   ├── courses.go
│   │   ├── jwt.go
│   │   ├── request.go
│   │   ├── todo.go
│   │   └── user.go
│   └── util/                 # 工具包
│       └── jwt_util/        # JWT工具
│           ├── interface.go
│           ├── util.go
│           ├── password.go
│           └── response.go
├── .env                  # 环境变量
├── .gitignore           # Git忽略文件
├── go.mod               # Go模块定义
├── go.sum              # Go模块校验和
└── README.md           #项目说明文档
```