---
townId: go-APIgateway
title: 请求闸口：反向代理和API网关
description: 对反向代理和API网关的介绍.
category: Golang
series: "Go Web 进阶"
seriesIndex: 1
tags:
  - Golang
  - 后端
  - 微服务
  - 分布式
date: 2026-03-11
draft: false
cover: /assets/posts/covers/cover30.webp
coverAlt: 请求闸口：反向代理和API网关
---
# 引言
经过前面的学习，我们已经掌握了微服务架构，注册中心，服务治理和消息队列，在步入可观测性和分布式事务之前，我们先来学习，准确地说，回顾一下，反向代理和API网关的内容

# 概念简述

## 反向代理
首先，我们要知道反向代理是什么

反向代理是**代理服务器**的一种。**它接收客户端请求，然后代为转发给内部的后端服务器，并将结果返回给客户端**。客户端感知不到后端服务器的存在

反向代理仅实现代为转发，不对请求进行处理等操作

反向代理可以代理任何HTTP/HTTPS流量，比如一个静态网站、一个PHP应用。它可以隐藏后端，均衡负载，SSL终结，缓存静态内容...

比较出名的反向代理技术-`Nginx`:高性能的HTTP服务器和反向代理

## API网关
API网关是一种特殊的反向代理，或者说，是反向代理的超集和演进。它专为API设计，是所有客户端请求的单一入口点。

API网关在反向代理的基础之上，增加了API生命周期管理：路由、认证授权、限流熔断、监控日志、请求/响应转换、协议转换等

一个比较好用的API网关工具就是`Traefik`一款现代的HTTP反向代理和API网关，天生为微服务和容器设计

# 技术实现

其实这一部分的实现，只需要注意学习反向代理工具和API网关的工具的使用即可，对于一个复杂API网关的设计，其实在我们之前的微服务架构和服务治理中已经实现过了，
不过当时我们并没有体系化地行程`API网关`这一具体概念，只是将这一模块作为一个`api-gateway`的服务去实现的，所以API网关这一块其实已经基本学习地差不多了，或者可以说，API网关的内容只是对之前内容的整理与总结罢了

既然是整理和总结了，多少还是提一嘴吧

## API网关

我们在实现API网关，也就是实现微服务API入口时，通常会包括以下方面：依赖管理、中间件/工具模块初始化、客户端创建、路由注册和管理

而我们在项目中可以拆分成这么几个结构：
```
Project
  -- api-gateway
      -- main.go
      -- client
      -- middleware
      -- routes
      -- handler
```

### main.go
`main.go`主要负责依赖管理、其他包和工具模块的初始化、注册服务器等功能

### client
`client`负责创建并封装rpc客户端、并集成注册中心解析器、熔断器等客户端

### middleware
`middleware`负责实现中间件方法

### router
`router`负责注册路由、或者实现路由分发与管理、中间件注册等方法

### handler
`handler`用于实现各个api路由的处理器方法，封装路由处理器和业务逻辑

## Traefik
Traefik可搭配K8s使用，具体方法K8s再细嗦

实现注册用户注册登录接口的简单示例
```
客户端 → [Traefik/Nginx] → [api-gateway] → Kitex RPC服务
```
### Traefik 静态配置
```yaml
# traefik/traefik.yml
api:
  dashboard: true
  debug: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    
# 自动HTTPS
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@yourdomain.com
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

# 日志
log:
  level: INFO
  filePath: /var/log/traefik/traefik.log

accessLog:
  filePath: /var/log/traefik/access.log
  format: json
  bufferingSize: 100

# 提供者配置
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-network
  file:
    filename: /etc/traefik/dynamic/config.yml
    watch: true

# 指标
metrics:
  prometheus:
    entryPoint: metrics
    addRoutersLabels: true
    addServicesLabels: true

tracing:
  jaeger:
    samplingServerURL: http://jaeger:5778/sampling
    localAgentHostPort: jaeger:6831
```

### Traefik 动态配置
```
# traefik/dynamic/config.yml
http:
  # 全局中间件
  middlewares:
    # 限流中间件
    rate-limit:
      rateLimit:
        average: 10
        burst: 20
        sourceCriterion:
          ipStrategy: {}
          
    # 熔断中间件
    circuit-breaker:
      circuitBreaker:
        expression: "LatencyAtQuantileMS(50.0) > 100"

    # 添加安全头
    security-headers:
      headers:
        frameDeny: true
        sslRedirect: true
        browserXssFilter: true
        contentTypeNosniff: true
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000

  # 路由配置
  routers:
    # 用户登录路由
    user-login:
      rule: "Host(`api.yourdomain.com`) && PathPrefix(`/user/login`)"
      entryPoints:
        - websecure
      middlewares:
        - rate-limit
        - compress
        - security-headers
      service: hertz-service
      tls:
        certResolver: letsencrypt
        options: default
      priority: 100
    
    # 用户注册路由
    user-register:
      rule: "Host(`api.yourdomain.com`) && PathPrefix(`/user/register`)"
      entryPoints:
        - websecure
      middlewares:
        - rate-limit
        - compress
        - security-headers
      service: hertz-service
      tls:
        certResolver: letsencrypt
      priority: 100
    
    # Dashboard路由（受保护）
    traefik-dashboard:
      rule: "Host(`traefik.yourdomain.com`)"
      entryPoints:
        - websecure
      middlewares:
        - basic-auth
        - ip-whitelist
      service: api@internal
      tls:
        certResolver: letsencrypt

  # 服务配置
  services:
    hertz-service:
      loadBalancer:
        healthCheck:
          path: /health
          interval: 10s
          timeout: 3s
        servers:
          - url: "http://hertz-service:8080"
        passHostHeader: true
        stickiness:
          cookie:
            name: _stickiness
            httpOnly: true
            secure: true
```

### 使用
```bash
# 创建项目目录
mkdir -p traefik-project/{traefik/dynamic,hertz-service}
cd traefik-project

# 创建配置文件
# 创建上面提到的各个配置文件

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f hertz-service

# 测试
curl -X POST https://api.yourdomain.com/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'

# 查看Traefik Dashboard
# 访问 https://traefik.yourdomain.com
```

## Nginx
实现注册用户注册登录接口的简单示例
```
客户端 → [Traefik/Nginx] → [api-gateway] → Kitex RPC服务
```

### 基础配置（nginx.conf）
```conf
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                    '"$http_x_forwarded_for" $request_time $upstream_response_time';
    
    access_log /var/log/nginx/access.log main;
    
    # 基础优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip压缩
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    
    # 包含微服务配置
    include /etc/nginx/conf.d/*.conf;
}
```
### 微服务路由配置
```conf
# /etc/nginx/conf.d/microservice.conf
# 用户服务上游
upstream user-service {
    # 如果你的Hertz服务是多实例
    server 127.0.0.1:8080 weight=3;
    server 127.0.0.1:8081 weight=2;
    server 127.0.0.1:8082 weight=1;
    
    # 健康检查
    # 注：基础版Nginx需要手动配置，或使用nginx-plus/第三方模块
}

# 全局限流设置
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $server_name zone=global_limit:10m rate=100r/s;

server {
    listen 80;
    server_name api.yourdomain.com;
    
    # 全局限流
    limit_req zone=global_limit burst=200 nodelay;
    
    # 用户登录接口
    location = /user/login {
        # 针对登录接口的特殊限流（防止暴力破解）
        limit_req zone=api_limit burst=5 nodelay;
        limit_req_status 429;
        
        # 转发到Hertz服务
        proxy_pass http://user-service/user/login;
        
        # 代理头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;
        
        # 缓冲设置
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # 允许跨域
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # 用户注册接口
    location = /user/register {
        limit_req zone=api_limit burst=3 nodelay;
        limit_req_status 429;
        
        proxy_pass http://user-service/user/register;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 更大的body
        client_max_body_size 10m;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
    
    # 健康检查端点
    location = /health {
        access_log off;
        proxy_pass http://user-service/health;
        proxy_set_header Host $host;
    }
    
    # 默认路由
    location /api/v1/ {
        # 匹配 /api/v1/user/login 等
        rewrite ^/api/v1/(.*)$ /$1 break;
        proxy_pass http://user-service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 添加API版本头
        proxy_set_header X-API-Version v1;
    }
    
    # 静态文件服务（如有）
    location /static/ {
        root /var/www/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # 防盗链
        valid_referers none blocked server_names ~\.yourdomain\.com;
        if ($invalid_referer) {
            return 403;
        }
    }
    
    # SSL重定向（如果启用HTTPS）
    # location / {
    #     return 301 https://$server_name$request_uri;
    # }
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 复用HTTP配置
    include /etc/nginx/conf.d/microservice_http.conf;
}
```

### 使用
```bash
# 安装Nginx
sudo apt-get install nginx

# 备份默认配置
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# 创建配置文件
sudo vim /etc/nginx/conf.d/microservice.conf
# 粘贴上面的Nginx配置

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx

# 启动你的Hertz服务
cd hertz-service
go run main.go

# 测试
curl -X POST http://localhost/user/login \
-H "Content-Type: application/json" \
-d '{"username":"test","password":"123456"}'
```