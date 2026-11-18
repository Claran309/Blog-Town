---
townId: go-etcd
title: 服务发现：从手搓注册中心到etcd与kitex的快速集成
description: 注册中心etcd详解和kitex框架下的代码实现.
category: Golang
series: "Go 微服务"
seriesIndex: 1
tags:
  - Golang
  - 后端
  - 微服务
  - 分布式
date: 2026-03-04
draft: false
cover: /assets/posts/covers/cover27.webp
coverAlt: 服务发现：从手搓注册中心到etcd与kitex的快速集成
---
# 引言
注册中心（register）就是服务信息的存储器，存储记录了每个注册服的务网络地址等信息（微服务的ServiceName、IP、Port、MetaData等），常用的注册中心如`etcd`，`concul`

关于注册中心更详细的概念讲解可阅读上一篇文章：**[Link](https://www.claran-blog.work/go-kitex/)**

**这篇文章以etcd为主例讲解**

# 特性
etcd采用键值对存储网络实例

注册中心应该有以下三个特性：
- **服务注册(Registry)**：为rpc路由注册服务
- **服务发现(Resolver/Discovery)**：为api查找rpc服务
- **健康检查(KeepAlive)**：keepalive保障注册键值对存活

# 服务注册中心的代码实现与解释
接下来在go里面实现etcd注册中心

日常开发为避免重复造轮子，**可直接使用kitex内部自带的etcd服务注册和发现拓展包**，kitex自带etcd包在该栏目后讲解，此处不使用kitex框架便于理解原理

## 核心流程

### 服务注册流程
```
1. 服务启动 -> 连接etcd -> 创建ServiceInfo -> 注册到etcd -> 启动续约 -> 监听RPC请求
2. 服务关闭 -> 收到信号 -> 注销服务 -> 停止续约 -> 退出程序
```

### 服务发现流程
```
1. 网关接收HTTP请求 -> 从etcd查询服务 -> 获取服务实例列表
2. 随机选择实例 -> 创建RPC客户端 -> 转发请求 -> 返回响应
```

### 数据流
```
客户端 -> HTTP请求 -> API网关 -> etcd查询 -> 微服务 -> RPC调用 -> 返回响应 -> 客户端
```

## 环境准备
安装etcd（拉取docker镜像）
```bash
# 拉取最新稳定版镜像
docker pull quay.io/coreos/etcd:v3.5.0

# 运行单节点集群
docker run -d \
  -p 2379:2379 \           # 客户端通信端口
  -p 2380:2380 \           # 节点间通信端口
  --name etcd \            # 容器名称
  quay.io/coreos/etcd:v3.5.0 \  # 镜像版本
  /usr/local/bin/etcd \    # etcd二进制文件路径
  --advertise-client-urls http://0.0.0.0:2379 \  # 对外暴露的客户端URL
  --listen-client-urls http://0.0.0.0:2379       # 监听的客户端URL
```

## etcd公共包

### 客户端封装（Client）

```go
//pkg/etcd/client.go
package etcd

import (
    "context"
    "time"
    
    "go.etcd.io/etcd/clientv3"
)

// Client结构体包装etcd客户端
type Client struct {
    *clientv3.Client  // 嵌入原始etcd客户端，可以直接调用其方法
}

// NewClient 创建etcd客户端实例
// endpoints: etcd服务器地址列表，如 ["localhost:2379"]
// 返回: 自定义的Client实例和错误信息
func NewClient(endpoints []string) (*Client, error) {
    // 创建etcd客户端配置
    cli, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,        // etcd服务器地址
        DialTimeout: 5 * time.Second,  // 连接超时时间
    })
    if err != nil {
        return nil, err  // 连接失败返回错误
    }
    
    // 返回包装后的客户端
    return &Client{cli}, nil
}
```

### 服务注册（Registry）
```go
//pkg/etcd/registry.go
package etcd

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "time"
    
    "go.etcd.io/etcd/clientv3"
)

// ServiceInfo 定义服务信息结构
// 用于在etcd中存储服务实例的元数据
type ServiceInfo struct {
    ID      string            // 服务实例的唯一ID
    Name    string            // 服务名称，如"user-service"
    Address string            // 服务地址，如"127.0.0.1"
    Port    int               // 服务端口，如8888
    Meta    map[string]string // 服务元数据，如版本、环境等
}

// Registry 服务注册器
// 负责将服务信息注册到etcd，并维护租约
type Registry struct {
    client   *Client           // etcd客户端
    service  *ServiceInfo      // 服务信息
    leaseID  clientv3.LeaseID  // 租约ID
    stopChan chan struct{}     // 停止信号通道
}

// NewRegistry 创建注册器实例
// client: etcd客户端实例
// service: 要注册的服务信息
func NewRegistry(client *Client, service *ServiceInfo) *Registry {
    return &Registry{
        client:   client,
        service:  service,
        stopChan: make(chan struct{}),  // 初始化停止通道
    }
}

// Register 注册服务到etcd
// ctx: 上下文，用于控制注册过程
// ttl: 租约存活时间(秒)，到期后etcd自动删除服务信息
func (r *Registry) Register(ctx context.Context, ttl int64) error {
    // 创建租约
    // 租约是etcd中的一个时间租约，到期后自动删除相关键值对
    leaseResp, err := r.client.Grant(ctx, ttl)
    if err != nil {
        return fmt.Errorf("创建租约失败: %w", err)
    }
    r.leaseID = leaseResp.ID  // 保存租约ID
    
    // 序列化服务信息为JSON供etcd存储
    data, err := json.Marshal(r.service)
    if err != nil {
        return fmt.Errorf("序列化失败: %w", err)
    }
    
    // 将服务信息写入etcd
    // 键的格式: /services/{服务名}/{实例ID}
    key := fmt.Sprintf("/services/%s/%s", r.service.Name, r.service.ID)
    _, err = r.client.Put(ctx, key, string(data), clientv3.WithLease(r.leaseID))
    if err != nil {
        return fmt.Errorf("注册失败: %w", err)
    }
    
    // 启动续约协程，保持服务在线状态
    go r.keepAlive(ctx)
    
    log.Printf("服务注册成功: %s (%s:%d)", r.service.Name, r.service.Address, r.service.Port)
    return nil
}

// Deregister 从etcd注销服务
// 服务关闭时调用，删除服务注册信息
func (r *Registry) Deregister(ctx context.Context) error {
    // 发送停止信号，停止续约协程
    close(r.stopChan)
    
    // 从etcd删除服务信息
    key := fmt.Sprintf("/services/%s/%s", r.service.Name, r.service.ID)
    _, err := r.client.Delete(ctx, key)
    if err != nil {
        return err
    }
    
    // 撤销租约，释放资源
    _, err = r.client.Revoke(ctx, r.leaseID)
    if err != nil {
        return err
    }
    
    log.Printf("服务注销: %s", r.service.Name)
    return nil
}

// keepAlive 租约续约协程
// 定期向etcd发送心跳，保持租约有效
func (r *Registry) keepAlive(ctx context.Context) {
    // 启动租约续约
    ka, err := r.client.KeepAlive(ctx, r.leaseID)
    if err != nil {
        return  // 续约失败直接返回
    }
    
    // 监听续约通道
    for {
        select {
        case _, ok := <-ka:
            // 收到续约响应
            if !ok {
                // 通道关闭，停止续约
                return
            }
            // 续约成功，服务继续在线
        case <-r.stopChan:
            // 收到停止信号，停止续约
            return
        }
    }
}
```
#### KeepAlive
上述代码中，`client.KeepAlive`会返回一个通道，etcd会**定期**（通常为ttl的1/3，可配置）**往通道发送健康检查信号并自动续期**，我们就需要异步goroutine持续监听该通道来接受该信号并检查服务健康状态

![](/images/albums/blogAlbum/etcd.jpg)

#### Metadata
另一方面，在服务实例增加**服务元数据**，可以支持均衡**负载机制**等功能的拓展，在服务被发现时可以根据元数据进行一定策略的服务实例选择，更细致的部分在服务治理再细嗦

### 服务发现（discovery）
```go
//pkg/etcd/discovery.go
package etcd

import (
    "context"
    "encoding/json"
    "fmt"
    "math/rand"
    "time"
    
    "go.etcd.io/etcd/clientv3"
)

// Discover 服务发现器
// 负责从etcd查询服务实例信息
type Discover struct {
    client  *Client  // etcd客户端
    service string   // 要发现的服务名称
}

// NewDiscover 创建服务发现器实例
// client: etcd客户端实例
// service: 要发现的服务名称
func NewDiscover(client *Client, service string) *Discover {
    return &Discover{
        client:  client,
        service: service,
    }
}

// GetService 从etcd获取一个服务实例
// 使用随机负载均衡策略选择一个实例
func (d *Discover) GetService(ctx context.Context) (*ServiceInfo, error) {
    // 构造查询前缀
    // 查询格式: /services/{服务名}/
    prefix := fmt.Sprintf("/services/%s/", d.service)
    
    // 从etcd查询所有匹配的服务实例
    // WithPrefix(): 查询所有以prefix为前缀的键
    resp, err := d.client.Get(ctx, prefix, clientv3.WithPrefix())
    if err != nil {
        return nil, fmt.Errorf("查询失败: %w", err)
    }
    
    // 检查是否有可用实例
    if len(resp.Kvs) == 0 {
        return nil, fmt.Errorf("没有找到服务: %s", d.service)
    }
    
    // 随机选择一个服务实例（简单的负载均衡）
    // 使用当前时间作为随机种子
    rand.Seed(time.Now().UnixNano())
    kv := resp.Kvs[rand.Intn(len(resp.Kvs))]
    
    // 反序列化服务信息
    var info ServiceInfo
    if err := json.Unmarshal(kv.Value, &info); err != nil {
        return nil, fmt.Errorf("解析失败: %w", err)
    }
    
    // 返回服务信息
    return &info, nil
}

```
#### 均衡负载
在上述代码中，我们使用随机选择服务实例模拟了均衡负载的结果，有关均衡负载机制放在服务治理细嗦，此处只需要意识到其存在

## 微服务主程序示例
```go
// 用户微服务主程序
// 启动用户服务，注册到etcd，监听RPC请求
package main

import (
    "context"
    "fmt"
    "log"
    "net"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/cloudwego/kitex/server"
    "user-service/kitex_gen/user/userservice"  // Kitex自动生成的代码
    
    "etcd-simple-demo/pkg/etcd"
)

func main() {
    fmt.Println("启动用户服务...")
    
    // 连接etcd服务注册中心
    // endpoints: etcd服务器地址列表，这里使用默认端口2379
    etcdClient, err := etcd.NewClient([]string{"localhost:2379"})
    if err != nil {
        log.Fatal("连接etcd失败:", err)
    }
    defer etcdClient.Close()  // 程序退出时关闭etcd连接
    
    // 服务配置
    serviceName := "user-service"  // 服务名称，用于etcd注册
    port := 8888                   // 服务监听端口
    // 生成服务实例ID：服务名-IP-时间戳，确保唯一性
    instanceID := fmt.Sprintf("user-%s-%d", getLocalIP(), time.Now().Unix())
    
    // 创建服务信息对象
    // 包含服务的元数据，将注册到etcd
    serviceInfo := &etcd.ServiceInfo{
        ID:      instanceID,             // 服务实例唯一ID
        Name:    serviceName,            // 服务名称
        Address: getLocalIP(),           // 服务IP地址
        Port:    port,                   // 服务端口
        Meta: map[string]string{         // 服务元数据
            "version": "1.0.0",
            "env":     "dev",
        },
    }
    
    // 创建服务注册器
    registry := etcd.NewRegistry(etcdClient, serviceInfo)
    
    // 注册服务到etcd
    // 创建10秒TTL的租约，服务需要定期续约保持在线
    ctx := context.Background()
    if err := registry.Register(ctx, 10); err != nil {
        log.Fatal("注册服务失败:", err)
    }
    
    // 设置优雅关闭
    // 监听系统信号，程序退出前注销服务
    setupGracefulShutdown(registry)
    
    // 启动RPC服务器
    // 解析TCP地址，监听指定端口
    addr, _ := net.ResolveTCPAddr("tcp", fmt.Sprintf(":%d", port))
    
    // 创建Kitex服务器
    svr := userservice.NewServer(
        new(UserServiceImpl),     // 业务逻辑处理器
        server.WithServiceAddr(addr),  // 设置监听地址
    )
    
    // 打印启动信息
    log.Printf("用户服务启动成功")
    log.Printf("   监听地址: %s:%d", getLocalIP(), port)
    log.Printf("   注册到etcd: %s", instanceID)
    log.Printf("   可用接口: Register, Login")
    
    // 启动服务，阻塞等待请求
    if err := svr.Run(); err != nil {
        log.Fatal("服务运行失败:", err)
    }
}

// getLocalIP 获取本机非回环IP地址
// 返回: 本机IP地址字符串
func getLocalIP() string {
    // 获取所有网络接口地址
    addrs, err := net.InterfaceAddrs()
    if err != nil {
        return "127.0.0.1"  // 获取失败返回本地回环地址
    }
    
    // 遍历所有地址，找到第一个非回环的IPv4地址
    for _, addr := range addrs {
        if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
            if ipnet.IP.To4() != nil {
                return ipnet.IP.String()
            }
        }
    }
    return "127.0.0.1"  // 未找到返回本地回环地址
}

// setupGracefulShutdown 设置优雅关闭
// 监听系统信号，在程序退出前注销etcd中的服务注册
func setupGracefulShutdown(registry *etcd.Registry) {
    stopChan := make(chan os.Signal, 1)  // 创建信号通道
    
    // 监听中断信号和终止信号
    signal.Notify(stopChan, syscall.SIGINT, syscall.SIGTERM)
    
    // 启动协程等待信号
    go func() {
        <-stopChan  // 阻塞等待信号
        log.Println("收到关闭信号，正在注销服务...")
        
        // 从etcd注销服务
        if err := registry.Deregister(context.Background()); err != nil {
            log.Println("注销失败:", err)
        }
        
        log.Println("服务关闭完成")
        os.Exit(0)  // 退出程序
    }()
}
```
**流程图**
```
链接etcd服务注册中心
      ↓
构造服务注册实例
      ↓
创建服务注册器
      ↓
注册服务
```

## api网关主程序
```go
// API网关主程序
// 提供HTTP接口，通过etcd发现服务，转发请求到对应的微服务
package main

import (
    "context"
    "fmt"
    "log"
    "time"
    
    "github.com/cloudwego/hertz/pkg/app"
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/cloudwego/kitex/client"
    
    "etcd-simple-demo/pkg/etcd"
    "user-service/kitex_gen/user"
    "user-service/kitex_gen/user/userservice"
)

func main() {
    fmt.Println("启动API网关...")
    
    // 连接etcd服务注册中心
    etcdClient, err := etcd.NewClient([]string{"localhost:2379"})
    if err != nil {
        log.Fatal("连接etcd失败:", err)
    }
    defer etcdClient.Close()
    
    // 启动HTTP服务器
    // Hertz是高性能HTTP框架，监听8080端口
    h := server.Default(server.WithHostPorts(":8080"))
    
    // 注册HTTP路由和处理器
    h.GET("/health", healthCheck)                          // 健康检查接口
    h.POST("/api/register", createRegisterHandler(etcdClient))  // 用户注册
    
    // 打印启动信息
    log.Println("API网关启动成功")
    log.Println("   访问地址: http://localhost:8080")
    log.Println("   可用接口:")
    log.Println("   GET    /health             健康检查")
    log.Println("   POST   /api/register       用户注册")
    
    // 启动HTTP服务器
    h.Spin()
}

// healthCheck 健康检查处理器
// 用于监控网关服务是否正常运行
func healthCheck(c context.Context, ctx *app.RequestContext) {
    ctx.JSON(200, map[string]interface{}{
        "status":  "ok",
        "service": "api-gateway",
        "time":    time.Now().Unix(),
    })
}

// createRegisterHandler 创建用户注册HTTP处理器
// 返回一个闭包函数，闭包可以访问etcdClient
func createRegisterHandler(etcdClient *etcd.Client) app.HandlerFunc {
    return func(c context.Context, ctx *app.RequestContext) {
        // 从etcd发现用户服务实例
        discover := etcd.NewDiscover(etcdClient, "user-service")
        instance, err := discover.GetService(c)
        if err != nil {
            // 服务发现失败，返回503服务不可用
            ctx.JSON(503, errorResponse("用户服务不可用"))
            return
        }
        
        // 解析HTTP请求体为JSON
        var req struct {
            Username string `json:"username"`
            Password string `json:"password"`
            Email    string `json:"email"`
        }
        
        if err := ctx.BindJSON(&req); err != nil {
            ctx.JSON(400, errorResponse("参数错误"))
            return
        }
        
        // 创建RPC客户端连接到用户服务
        endpoint := fmt.Sprintf("%s:%d", instance.Address, instance.Port)
        userClient, err := userservice.NewClient(
            "user-service",
            client.WithHostPorts(endpoint),
        )
        if err != nil {
            ctx.JSON(500, errorResponse("内部错误"))
            return
        }
        
        // 构造RPC请求并调用用户服务
        rpcReq := &user.RegisterRequest{
            Username: req.Username,
            Password: req.Password,
            Email:    req.Email,
        }
        
        rpcResp, err := userClient.Register(c, rpcReq)
        if err != nil {
            ctx.JSON(500, errorResponse("服务调用失败"))
            return
        }
        
        // 根据RPC响应返回HTTP响应
        if rpcResp.Success {
            ctx.JSON(200, successResponse("注册成功", map[string]interface{}{
                "user_id": rpcResp.UserId,
            }))
        } else {
            ctx.JSON(400, errorResponse(rpcResp.Message))
        }
    }
}

// successResponse 成功响应格式
func successResponse(message string, data interface{}) map[string]interface{} {
    return map[string]interface{}{
        "code":    200,
        "message": message,
        "data":    data,
    }
}

// errorResponse 错误响应格式
func errorResponse(message string) map[string]interface{} {
    return map[string]interface{}{
        "code":    400,
        "message": message,
    }
}
```
**流程图**
```
创建服务发现器并寻找实例
     ↓
从服务发现器获取实例
     ↓
提取实例元数据
     ↓
继续调用rpc/返回响应
```
## 进阶
以上讲解了最基础的etcd注册中心的实现和使用，但是并不是etcd注册中心的最优形态，在生产级环境中，我们会用到以下进阶部分优化我们的注册中心

### 本地缓存
在基础版本中，每次服务调用都需要查询etcd，这会带来显著的性能开销：

- **网络延迟**：每次RPC调用前都需要与etcd通信

- **etcd压力**：大量服务实例同时查询会压垮etcd

- **单点故障**：etcd宕机将导致整个系统无法服务发现

因此，一如redis之于数据库那样，我们可以考虑**引入本地缓存**缓解服务器压力

我们可以在服务发现器的实例中新增服务缓存：
```go
type ServiceDiscovery struct {
    client    *clientv3.Client  // etcd客户端连接
    services  map[string][]*ServiceInstance // 服务缓存: 服务名->实例列表
    stopChan  chan struct{}     // 停止信号通道
    // 注意：这里没有添加并发锁，多个goroutine访问services map会有并发问题
}
```

这样，对于每个服务发现器，都有内部的内存缓存缓解压力，监听到新的注册就写入缓存，监听到注册信息改动就更新缓存信息（删+再写），监听到注册失效就删除缓存

更进阶的，比如说使用redis集群作缓存，实现更为复杂，先按下不表

不过刚刚我们发现了一个新的词语**监听**

### 服务监听
etcd的`Watch`机制是服务发现监听的核心，它允许客户端监听特定key的前缀变化

**Watch工作流**
```
客户端建立Watch连接
    ↓
监听 /services/user-service/ 前缀
    ↓
etcd推送事件（PUT/DELETE）
    ↓
客户端更新本地服务列表
```
根据不同的事件，我们可以配合缓存进行优化：
```go
// 本地缓存如何保持最新
func 缓存更新机制() {
    // 首次启动，全量获取
    缓存 = 从etcd获取所有实例()
    
    // 监听etcd变化（Watch机制）
    go func() {
        for 事件 := range etcd.Watch() {
            if 事件类型 == 新增 {
                缓存.添加(事件.实例)
            } else if 事件类型 == 删除 {
                缓存.删除(事件.实例)
            } else if 事件类型 == 更新 {
                缓存.更新(事件.实例)
            }
        }
    }()
    
    // 定期刷新（兜底机制，防止Watch丢失事件）
    go func() {
        for {
            time.Sleep(30 * time.Second)
            缓存 = 从etcd获取所有实例()  // 全量刷新
        }
    }()
}
```
**示例代码**

```go
// watchServiceChanges 监听etcd服务变化并更新本地缓存
// cache: 本地缓存map，格式为 map[服务名][]服务实例
// serviceName: 要监听的服务名称
func watchServiceChanges(ctx context.Context, client *clientv3.Client, cache map[string][]*ServiceInstance, serviceName string) error {
    // 构建监听的前缀key
    watchKey := fmt.Sprintf("/services/%s/", serviceName)
    
    // 开始监听etcd变化
    watchChan := client.Watch(ctx, watchKey, clientv3.WithPrefix())
    
    go func() {
        for watchResp := range watchChan {
            for _, event := range watchResp.Events {
                // 根据事件类型处理
                switch event.Type {
                case clientv3.EventTypePut: // 新增或更新
                    handlePutEvent(event, cache, serviceName)
                case clientv3.EventTypeDelete: // 删除
                    handleDeleteEvent(event, cache, serviceName)
                }
            }
        }
    }()
    
    return nil
}

// handlePutEvent 处理新增或更新事件
func handlePutEvent(event *clientv3.Event, cache map[string][]*ServiceInstance, serviceName string) {
    // 解析etcd中的服务实例信息
    var instance ServiceInstance
    if err := json.Unmarshal(event.Kv.Value, &instance); err != nil {
        log.Printf("解析服务实例失败: %v", err)
        return
    }
    
    // 获取当前服务列表
    instances, exists := cache[serviceName]
    
    // 更新或添加实例
    found := false
    for i, ins := range instances {
        if ins.ID == instance.ID {
            // 更新已有实例
            instances[i] = &instance
            found = true
            break
        }
    }
    
    if !found {
        // 添加新实例
        cache[serviceName] = append(instances, &instance)
    }
    
    log.Printf("服务实例更新: %s/%s (%s:%d)", serviceName, instance.ID, instance.Address, instance.Port)
}

// handleDeleteEvent 处理删除事件
func handleDeleteEvent(event *clientv3.Event, cache map[string][]*ServiceInstance, serviceName string) {
    // 从key中提取实例ID
    keyParts := strings.Split(string(event.Kv.Key), "/")
    if len(keyParts) < 4 {
        return
    }
    instanceID := keyParts[3]
    
    // 从缓存中删除该实例
    instances, exists := cache[serviceName]
    if !exists {
        return
    }
    
    // 查找并删除
    for i, ins := range instances {
        if ins.ID == instanceID {
            // 从切片中删除元素
            cache[serviceName] = append(instances[:i], instances[i+1:]...)
            log.Printf("服务实例删除: %s/%s", serviceName, instanceID)
            return
        }
    }
}
```

### 并发安全
大部分基础项目在遇到**高并发场景**的情况下，都难免会出现一些问题

同样的，etcd实现的注册中心在高并发场景下的问题如下：
- 缓存崩溃：由于go内部的map并不是并发安全的，所以在未设置互斥锁的情况下，多线程读写map会导致程序panic，因为缓存读多写少，应使用读写锁管理
- 数据竞争：leaseID存在竞争条件，应使用互斥锁管理
  ...(还有很多)

### 实例元数据
我们知道，一个被注册的服务实例通常含有其地址，端口，服务名等信息。在这个基础上，我们可以在实例结构体内新增**实例元数据**（**metadata**）标记该实例的详细信息，例如系统资源占用情况，复杂度，版本号，标签等信息，以便我们进行**均衡负载机制**调控，**版本管理**和**标签过滤**等功能

大部分会在后续的**服务治理学习**中展开细讲

# kitex-etcd
**万幸的是，以上部分的内容我们并不需要挨个手写，强大的kitex会帮我们搞定**

CloudWeGo社区对kitex框架提供了官方的etcd注册中心插件，专门用于集成etcd注册中心的服务注册和发现

在该框架下，服务注册和发现非常简单，这样我们以后在自己写微服务的时候就没有自己写一大堆服务注册器或服务发射器的必要了，方便又快捷

## 快速学习
kitex封装的etcd包十分方便，只需要创建一个注册中心/解析器，再在`NewServer`/`NewClient`时加一个配置项（注册/发现）即可

### 安装依赖
```bash
# 安装 registry-etcd
go get github.com/kitex-contrib/registry-etcd

# 安装 etcd 客户端库
go get go.etcd.io/etcd/client/v3

# 启动 etcd（Docker）
docker run -d -p 2379:2379 \
  --name etcd \
  quay.io/coreos/etcd:v3.5.0 \
  etcd --advertise-client-urls http://0.0.0.0:2379 \
        --listen-client-urls http://0.0.0.0:2379
```
### 服务注册示例
```go
package main

import (
    "context"
    "log"
    "net"
    
    "github.com/cloudwego/kitex/pkg/rpcinfo"
    "github.com/cloudwego/kitex/server"
    etcd "github.com/kitex-contrib/registry-etcd"
    
    "demo/kitex_gen/echo"
    "demo/kitex_gen/echo/echoservice"
)

type EchoServiceImpl struct{}

func (s *EchoServiceImpl) Echo(ctx context.Context, req *echo.EchoRequest) (*echo.EchoResponse, error) {
    return &echo.EchoResponse{Message: req.Message}, nil
}

func main() {
    // 创建 etcd 注册中心
    r, err := etcd.NewEtcdRegistry([]string{"127.0.0.1:2379"})
    if err != nil {
        log.Fatal(err)
    }
    
    // 启动服务并注册
    addr, _ := net.ResolveTCPAddr("tcp", ":8888")
    svr := echoservice.NewServer(
        new(EchoServiceImpl),
        server.WithServiceAddr(addr),
        server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
            ServiceName: "echo-service",
        }),
        server.WithRegistry(r),  // 注册到 etcd
    )
    
    log.Println("服务已启动并注册到 etcd")
    svr.Run()
}
```

### 服务发现示例
```go
package main

import (
    "context"
    "log"
    "time"
    
    "github.com/cloudwego/kitex/client"
    etcd "github.com/kitex-contrib/registry-etcd"
    
    "demo/kitex_gen/echo"
    "demo/kitex_gen/echo/echoservice"
)

func main() {
    // 创建 etcd 解析器
    r, err := etcd.NewEtcdResolver([]string{"127.0.0.1:2379"})
    if err != nil {
        log.Fatal(err)
    }
    
    // 创建客户端（自动发现服务）
    client, err := echoservice.NewClient(
        "echo-service",  // 服务名，必须与服务端一致
        client.WithResolver(r),  // 从 etcd 发现服务
        client.WithRPCTimeout(3*time.Second),
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // 调用服务
    resp, err := client.Echo(context.Background(), &echo.EchoRequest{
        Message: "Hello from client",
    })
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("收到响应: %s", resp.Message)
}
```

# 拓展
现在我们了解到了，etcd其实就是一个**kv式存储系统**，这也就意味着etcd还能够实现许多功能（横向比较redis），例如通过etcd实现阻塞式的**分布式锁**，且不会像redis那样单点故障：**[redis，mysql和etcd实现分布式锁的区别](https://b23.tv/Widbhcr)**

有关etcd的更多使用，今后再来回顾🥺

# 学习文章
**[kitex-etcd | CloudWeGo](https://www.cloudwego.io/zh/docs/kitex/tutorials/third-party/service_discovery/etcd/)**

