---
townId: go-observability
title: 项目可视化：分布式系统中的可观测性
description: 讲解OpenTelemetry、Prometheus、Jaeger和ELK的使用.
category: Golang
tags:
  - Golang
  - 后端
  - 微服务
  - 分布式
date: 2026-03-17
draft: false
cover: /assets/posts/covers/cover32.webp
coverAlt: 项目可视化：分布式系统中的可观测性
---
# 引言
学完消息队列后象征性学习了一下API网关，现在继续学习可观测性部分的内容，万恶的Docker让我调试了大半天Demo

我们在之前写单体架构的项目时，总是用Zap等日志库对程序进行监控或获取调试信息。但是在分布式架构中，每个微服务都是不同的整体，这时候再用日志等方式记录调试信息，日志等数据就会分散在各个微服务内部，观测起来略显繁琐，所以，我们需要学习**可观测性**的相关内容

# 可观测性
可观测性到底是什么呢？

在计算机系统和软件领域，可观测性的含义是：可以从系统和应用对外输出的信息（**指标、日志和链路**），来**帮助我们了解应用程序的内部系统状态和运行情况**

但可观测性并不只是简单的数据采集，它更强调对这些数据的关联和分析，这能够帮助我们快速定位，找到问题的根本原因。**最终保障系统的可靠性，构建可靠的后端服务质量**

而可观测性有三大支柱：**指标**（**metrics**），**链路追踪**（**Tracing**）**和日志**（**logs**）
## 指标（Metrics）
指标（Metrics）指**服务器内可测量、记录的数据**。它包括特定属性，例如时间戳、名称、键和值。和⽇志不同，指标在默认情况下是结构化的，这会让查询和优化存储变得更加容易

指标可以用于记录应用程序的性能指标，例如请求响应时间、内存使用率和CPU负载等

指标分为三种类型：**Counter**（**计数器**），**Histogram**（**直方图**）和**Gauge**（**仪表盘**）

在程序中，我们通过Add方式记录Counter类指标，用Record方式记录Histogram指标，用Callback（回调函数）方式记录Gauge指标

一般来说，我们需要一个目标系统来统合指标数据，比如`Prometheus`，我们后文详解
## 链路追踪（Tracing）
链路追踪，有时候也被称为分布式追踪（Distributed Tracing），表示**请求通过分布式系统的端到端的路径**

Trace由Span（跨度）和TraceContext（跨度上下文）两个部分组成。一个 Trace 是 Spans 的有向无环图。链路追踪一般会通过一个可视化的瀑布图展现出来。瀑布图展示了用于调试的请求的每个阶段，以及每个部分的开始时间和持续时长

TraceContext（跟踪上下文）是一种用于在分布式系统中传递跟踪信息的标准格式。TraceContext包含了跟踪ID（Trace ID）、跨度ID（Span ID）、父级跨度ID（Parent Span ID）等属性，用于跨越多个服务和跨度的信息传递

每次请求都会产生一条Trace，用于记录该请求的信息和流程，该次Trace下请求的每个操作单元都是一条Span，这样我们就可以知道每个请求的链路流程
![](/images/albums/blogAlbum/observability1.png)

为每个Span加上parentIP或者时间戳等信息后，我们就形成了一条完整链路追踪链
![](/images/albums/blogAlbum/observability2.png)

### Span
**Span是一个Trace下的操作单元**，表示应用程序中的一个操作或事件，例如HTTP请求、数据库查询或RPC调用等

Span包括一些元数据信息，例如操作名称、起始时间和持续时间等，以及一些我们自己可以添加的标签和注释，用于描述Span的上下文和特征

一般来说，同一个Trace下的多个Span互相间呈父子关系或树状关系，例如单次请求流过了API网关（api-gateway）-RPC服务器（handler-service-dao），那么这次请求产生的trace就包含`api-gateway` -> `rpc.handler` -> `rpc.service` -> `rpc.dao`四条Span，顺序的Span呈父子关系，且各自记录了请求流过该部件时的部分信息

一般而言，Span间的父子关系由`context`声明，例如，子Span提取当前上下文`context`中父Span的信息从而产生

#### SpanContext
Span Context是Span内部用于存储Span信息的结构，是Span中包含的不可变的对象，子Span可以提取父Span的信息产生父子关系

#### SpanAttribute
pan Attributes（跨度属性）是用于描述Span的一些元数据信息的（K-V）键值对

pan Attributes可以包含各种有用的信息，例如操作类型、HTTP方法、HTTP路径、请求参数等。Span Attributes通常被用于分析和理解跟踪数据，以便更好地监控和调试应用程序的性能和行为

我们可以手动添加当前业务需要观测的数据到SpanAttribute中以完善可观测性

## 分布式日志（Logs）
分布式日志，是在单体日志（如Zap）的基础上，对每个微服务的单体日志进行搜索收集、整理聚合在进行优化展示后的日志记录方式

有关日志的基本实现方法：**[Zap的使用](https://www.claran-blog.work/go-viper&zap/)**

一般来说，分布式日志系统以ELK为典型，基于Elasticsearch、Logstash、Kibana三个开源软件构建的集中式日志管理平台

在分布式日志系统中，由Logstash收集整理各个微服务的日志文件，再进处理转发给Elasticsearch进行查询，最终由Kibana可视化输出给用户

有关ELK的详细实现后文细嗦

## 工具
以上就是可观测性的一些基本概念，同样的，可观测性的实现还离不开相对工具的使用

### Prometheus
[Prometheus](https://github.com/prometheus) 是由前 Google 工程师从 2012 年开始在 Soundcloud 以开源软件的形式进行研发的系统监控和告警工具包，自此以后，许多公司和组织都采用了 Prometheus 作为监控告警工具。Prometheus 的开发者和用户社区非常活跃，它现在是一个独立的开源项目，可以独立于任何公司进行维护

Prometheus 的主要优势有：
- 由指标名称和和键/值对标签标识的时间序列数据组成的多维数据模型
- 强大的查询语言 PromQL
- 不依赖分布式存储；单个服务节点具有自治能力
- 时间序列数据是服务端通过 HTTP 协议主动拉取获得的
- 也可以通过中间网关来推送时间序列数据
- 可以通过静态配置文件或服务发现来获取监控目标
- 支持多种类型的图表和仪表盘

可以使用docker部署（可选，之后我们用docker-compose统一管理）：
```bash
docker run \
    -p 9090:9090 \
    -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus
```

> 注：Prometheus容器只接受yml配置文件，不要搞错成yaml

容器启动后，使用浏览器打开 http://localhost:9090 即可访问 Prometheus UI，如果想要添加数据源，需要配置 prometheus.yml

### Jaeger
[Jaeger](https://www.jaegertracing.io/)  是由 Uber Technologies 作为开源发布的分布式跟踪系统，兼容 OpenTracing 以及 Zipkin 追踪格式，目前已成为 CNCF 基金会的开源项目。其前端采用React语言实现，后端采用GO语言实现，适用于进行链路追踪，分布式跟踪消息传递，分布式事务监控、问题分析、服务依赖性分析、性能优化等场景

我们一般使用`all-in-one`Docker 镜像作为Jaeger部署，其包含包含 Jaeger UI、jaeger-collector、jaeger-query 和 jaeger-agent，以及一个内存存储组件。适用于快速体验 Jaeger ，由于所有追踪数据存储在内存中，不适用于生产环境

```bash
docker run --rm --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.56
```

容器启动后，使用浏览器打开 http://localhost:16686 即可访问 Jaeger UI

### OpenTelemetry
就算有了以上这些工具，我们还是面临一大重量级难题：**各个检测组件的数据传输协议不一致**，这导致了我们很难去直接使用这些工具进行统一开发

这时候OpenTelemetry来了：

OpenTelemetry 简称 OTel， 是 CNCF （ Cloud Native Computing Foundation，云原生计算基金会，是一个开源软件基金会，致力于云原生技术的普及和可持续发展） 的一个可观测性项目。

OpenTelemetry 旨在提供可观测性领域的标准化方案，解决遥测数据的数据建模、采集、处理、导出等标准化问题，并能够将这些数据发送到你选择的后端（开源或商业均可）。这样你就可以建立不被供应商锁定的可观测，灵活地更改后端，不需要再次更改代码，重新进行插桩（Instrument）了

也就是说，OpenTelemetry是一个可以统一数据传输协议的工具，可以灵活地整合Jaeger、Prometheus等组件的使用


#### OTLP
OTLP就是传递遥测信号使用的统一传输协议，用于将数据导出到后端或其他收集器

OTLP 可以使用 gRPC (OTLP/gRPC) 或 HTTP (OTLP/HTTP)两种方式方式传输数据

#### otel-collector
OpenTelemetry Collector是OpenTelemetry 项目中的一个代理软件，作为遥测数据的中转站，能够对遥测数据做一些预处理的逻辑

也就是说，otel-collector可以进行数据的统一收集与整理

一般来说，我们有两种模式可以部署otel-collector：`gateway`模式和`agent`模式

#### pipeline
Collector 采用 Pipeline 方式来接收、处理和导出数据，每个 Collector 可配置一个或多个 Pipeline，每个 pipeline 包含如下组件：
- receiver
- processor
- exporter
- 
每个 receiver 可能被多个 pipeline 共用，多个 pipeline 也可能包含同一个 exporter

一个pipeline定义了一条数据流动的路径：从 Collector 数据接收开始，然后进一步的处理或修改，到最后通过exporter导出。

pipeline能够处理3种类型数据：trace、metric和logs。数据类型是需要pipeline配置的一个属性。在pipeline中receiver、processor和exporter必须支持某个特定的数据类型

### ELK
ELK是一个分布式日志系统，由Filebeat收集微服务日志文件，由Logstash解析、过滤、增强日志，由ElasticSearch存储、索引日志，最后由Kibana或者Grafana将日志文件可视化到Web UI上

需要注意的是，在使用ELK分布式日志系统时，我们最好确保项目内的日志输出格式是JSON格式，以便于Logstash解析日志内容，例如我们为Zap设置`JSONEncoder`而非`ConsoleEncoder`

也可以不使用JSON格式，但需要特别地在Filebeat和Logstash中进行适配Console格式的特殊配置
### Grafana
Grafana是一个可以将几乎所有可观测数据和组件统合到一个可视化仪表盘上的工具，我们只需要在docker-compose里适当配置Grafana的接受和监听端口就能实现相关功能，不需要集成到代码中去

### 工具整合
那么在项目中，我们完整的可观测性链路呈以下关系：
![](/images/albums/blogAlbum/observability10.jpg)

# 实践学习
接下来，我们开始学习在项目里实现完整的可观测性

此处我们使用hertz+kitex框架

需要注意的是，hertz和kitex框架也整合了OTel相关方法，以便我们可以快速实现可观测性

## 工具部署
我们需要先编写docker-compose.yaml和两个配置文件（otel-collector.yaml和prometheus.yml），统一拉取镜像并管理容器：

**docker-compose.yaml:**
```yaml
# docker-compose.yaml
version: '3.8'

networks:
  otel-network:
    driver: bridge

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: otel-collector
    volumes:
      - ../config/collector.yaml:/etc/otelcol-contrib/config.yaml # 挂载配置文件，注意核查路径
    ports:
      - "8079:4317"
      - "8082:4318"
      - "8889:8889"
    networks:
      - otel-network
    restart: unless-stopped
    command: ["--config=/etc/otelcol-contrib/config.yaml"]

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ../config/prometheus.yaml:/etc/prometheus/prometheus.yml # 确保为yml，Prometheus只会读取yml配置文件，又找了几个小时的bug
    ports:
      - "8084:9090"
    networks:
      - otel-network
    restart: unless-stopped
    depends_on:
      - otel-collector

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "8085:16686"
    networks:
      - otel-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    ports:
      - "8086:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - otel-network
    restart: unless-stopped
    depends_on:
      - prometheus
      - jaeger

volumes:
  grafana-data:
```

**otel-collector.yaml:**
```yaml
# otel-collector.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

exporters:
  debug:
    verbosity: detailed
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
  otlp:
    endpoint: jaeger:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug, otlp]      # trace通过OTLP发送到Jaeger
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug, prometheus] # 指标发送到Prometheus
```

**prometheus.yml**
```yml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

#告警
#rule_files:
#  - "alert.rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'otel-collector'
    scrape_interval: 10s
    scrape_timeout: 8s # 不能大于scrape_interval，否则会静默报错，别问我怎么知道，找了一天bug，容器日志也不报错，哭
    honor_labels: true
    metrics_path: '/metrics'
    static_configs:
      - targets: ['otel-collector:8889']
        labels:
          exported_job: 'otel-collector-scraper'
          instance: 'collector-1'
          component: 'metrics-gateway'
          environment: 'dev'

  - job_name: 'prometheus'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:9090']
        labels:
          instance: 'prometheus-server-1'
```

之后在项目目录执行`docker-compose up -d`，即可成功启动容器

## OpenTelemetry
**RPC：**
我们首先在main里初始化OTel Provider：
```go
// 初始化 OpenTelemetry provider
otelProvider := provider.NewOpenTelemetryProvider(
	provider.WithServiceName("user-service"),
	provider.WithExportEndpoint("localhost:8079"),
	provider.WithInsecure(),
	provider.WithEnableTracing(true),
	provider.WithEnableMetrics(true),
)
defer otelProvider.Shutdown(context.Background())
```
在创建rpc服务端时带上WithSuite集成OTel Tracing
```go
svr := userservice.NewServer(userHandler,
		server.WithServiceAddr(addr),
		server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{
			ServiceName: "user-service",
		}),
		server.WithRegistry(r),
		server.WithLimit(&limit.Option{
			MaxConnections: 1000,
			MaxQPS:         1000,
		}),
		server.WithSuite(tracing.NewServerSuite()), // 使用 Kitex 的 tracing
	)
```
这样我们就创建了一个在当前服务内全局可用的Tracer和Meter

**API：**
与rpc的差别只有把框架换成了hertz
```go
// 初始化OTel Provider
p := hertztracing.NewOpenTelemetryProvider(
	hertztracing.WithServiceName("api-gateway"),
	hertztracing.WithExportEndpoint("localhost:8079"),
	hertztracing.WithInsecure(),
)
defer p.Shutdown(context.Background())

// 初始化Tracer
tracer, cfg := tracing.NewServerTracer()
```
我们使用hertz集成度的链路追踪中间件
```go
// 注册全局Tracing中间件
h.Use(tracing.ServerMiddleware(cfg))
```

## Metrics
我们可以在需要监测指标的地方创建metric，此处以`user-service`的`handler`为例:
```go
// internal/user-service/handler/handler.go
var (
	// Metrics指标
	requestCounter  metric.Int64Counter // 计数器类型
	requestDuration metric.Float64Histogram // 直方图类型
	errorCounter    metric.Int64Counter
)

func initMetrics() {
	// 从全局获取 meter
	meter := otel.Meter("user-service.handler")

	var err error

	// 为Prometheus注册指标，下面两个同理
	requestCounter, err = meter.Int64Counter(
		"claran_user_request_total",
		metric.WithDescription("总请求数"),
	)
	if err != nil {
		panic(fmt.Sprintf("创建requestCounter失败: %v", err))
	}

	requestDuration, err = meter.Float64Histogram(
		"claran_user_request_duration_seconds",
		metric.WithDescription("请求耗时"),
		metric.WithUnit("s"),
	)
	if err != nil {
		panic(fmt.Sprintf("创建requestDuration失败: %v", err))
	}

	errorCounter, err = meter.Int64Counter(
		"claran_user_errors_total",
		metric.WithDescription("总错误数"),
	)
	if err != nil {
		panic(fmt.Sprintf("创建errorCounter失败: %v", err))
	}
}
```
之后我们在创建`UserServiceImpl`实例时顺带初始化
```go
// internal/user-service/handler/handler.go
// UserServiceImpl implements the last service interface defined in the IDL.
type UserServiceImpl struct {
	UserService service.UserService
}

func NewUserServiceImpl(userService service.UserService) *UserServiceImpl {
	// 初始化Metrics
	initMetrics()
	return &UserServiceImpl{UserService: userService}
}
```
接下来，我们就可以在涉及到指标监控变化的业务里对指标进行记录，以Register接口为例：
```go
// internal/user-service/handler/handler.go
// Register implements the UserServiceImpl interface.
func (s *UserServiceImpl) Register(ctx context.Context, req *user.RegisterReq) (resp *user.RegisterResp, err error) {
	startTime := time.Now()

	// 记录指标
	defer func() {
		// 计算响应时间
		duration := time.Since(startTime).Seconds()
		// 记录指标（Histogram类型，对应record方法）
		requestDuration.Record(ctx, duration,
			// 添加描述
			metric.WithAttributes(
				attribute.String("method", "Register"),
				attribute.String("status", getstatus(err)),
			))

		// 记录直播（Counter对应Add方法）
		requestCounter.Add(ctx, 1,
			//描述
			metric.WithAttributes(
				attribute.String("method", "Register"),
				attribute.String("status", getstatus(err)),
			))

		// 记录错误数量指标
		if err != nil {
			errorCounter.Add(ctx, 1,
				metric.WithAttributes(
					attribute.String("method", "Register"),
					attribute.String("status", getstatus(err)),
				))
		}
	}()
	
	newUser, err := s.UserService.Register(spanCtx, req.Username, req.Email, req.Password)
	if err != nil {
		log.Println("执行注册服务失败：" + err.Error())
		return resp, err
	}
	
	resp = &user.RegisterResp{
		Success: true,
		UserID:  newUser.UserID,
		Msg:     "注册成功",
	}

	return resp, nil
}
```
以上就完成了基础的指标检测，api中的实现与rpc几乎一样

## Trace和Span
我们在main已经创建了全局Trace，接下来我们只需要在不同业务代码里实现父子Span的创建

我们以`user-service`的`handler`和`service`为例：
```go
// internal/user-service/handler/handler.go
// Register implements the UserServiceImpl interface.
func (s *UserServiceImpl) Register(ctx context.Context, req *user.RegisterReq) (resp *user.RegisterResp, err error) {
	startTime := time.Now()

	// 记录指标
	defer func() {
		duration := time.Since(startTime).Seconds()
		requestDuration.Record(ctx, duration,
			metric.WithAttributes(
				attribute.String("method", "Register"),
				attribute.String("status", getstatus(err)),
			))

		requestCounter.Add(ctx, 1,
			metric.WithAttributes(
				attribute.String("method", "Register"),
				attribute.String("status", getstatus(err)),
			))

		if err != nil {
			errorCounter.Add(ctx, 1,
				metric.WithAttributes(
					attribute.String("method", "Register"),
					attribute.String("status", getstatus(err)),
				))
		}
	}()

	// 创建span - 从全局获取 tracer
	tracer := otel.Tracer("user-service")
	// 从context生出子Span
	spanCtx, span := tracer.Start(ctx, "handler.Register",
		// span描述
		trace.WithAttributes(
			attribute.String("username", req.Username),
		))
	// 一定要记得关闭span，不然这条tracing会从这里断掉！
	defer span.End()

	// 可以获取SpanContext，即Span元数据信息
	//sCtx := trace.SpanContextFromContext(ctx)
	//log.Printf("Handler -> Service, TraceID: %v", sCtx.TraceID())
	
	// 调用下层服务层，传递新的context，即子span的context，用于生成service层的子span
	newUser, err := s.UserService.Register(spanCtx, req.Username, req.Email, req.Password)
	if err != nil {
		log.Println("执行注册服务失败：" + err.Error())
		//遇到错误，记录在span中
		span.RecordError(err)
		span.SetStatus(codes.Error, "执行注册服务失败："+err.Error())
		span.SetAttributes(attribute.Bool("service.success", false))
		return resp, err
	}

	// 业务运行成功，记录信息在span中
	span.SetAttributes(
		attribute.String("username", newUser.Username),
		attribute.String("email", newUser.Email),
		attribute.Bool("service.success", true),
	)

	resp = &user.RegisterResp{
		Success: true,
		UserID:  newUser.UserID,
		Msg:     "注册成功",
	}

	return resp, nil
}
```
我们可以从上述代码看到span的使用实例和规范，接下来来到service层：
```go
// internal/user-service/service/service.go
func (u *userServiceImpl) Register(ctx context.Context, username string, email string, password string) (*model.User, error) {
	// 获取全局tracer
	tracer := otel.Tracer("user-service")
	// 从handler.span中生出子span和新的context
	spanCtx, span := tracer.Start(ctx, "service.Register")
	defer span.End() // 一定记住要END！不然链路会断开！

	if username == "" || email == "" || password == "" {
		// 记录错误信息
		span.RecordError(errors.New("关键字段为空"))
		span.SetStatus(codes.Error, "关键字段为空")
		span.SetAttributes(attribute.Bool("service.success", false))
		return nil, errors.New("关键字段为空")
	}

	var user = &model.User{Username: username, Email: email, Password: password}
	
	// 调用下层dao层，传递新context
	err := u.UserRepo.AddUser(spanCtx, user)
	if err != nil {
		// 记录错误信息
		span.RecordError(errors.New("添加用户失败: " + err.Error()))
		span.SetStatus(codes.Error, "添加用户失败: "+err.Error())
		span.SetAttributes(attribute.Bool("dao.success", false))
		return nil, errors.New("添加用户失败: " + err.Error())
	}

	// 业务流程结束，记录信息
	span.SetAttributes(
		attribute.String("username", user.Username),
		attribute.String("email", user.Email),
		attribute.Bool("dao.success", true),
	)

	// 生产者发送消息
	if u.KafkaProducer != nil {
		eventData, _ := json.Marshal(map[string]interface{}{
			"event_type":    "USER_REGISTER", // 明确的事件类型
			"user_id":       user.UserID,
			"username":      user.Username,
			"registered_at": time.Now(),
		})
		err := u.KafkaProducer.SendUserEvent(ctx, fmt.Sprintf("%d", user.UserID), eventData)
		if err != nil {
			// 错误信息
			span.RecordError(errors.New("发送用户注册事件失败:user_id:%d" + strconv.Itoa(int(user.UserID))))
			span.SetStatus(codes.Error, "发送用户注册事件失败:user_id:%d"+strconv.Itoa(int(user.UserID))+err.Error())
			span.SetAttributes(attribute.Bool("kafka.success", false))
			fmt.Printf("发送用户注册事件失败:user_id:%d", user.UserID)
		}
		fmt.Printf("发送用户注册事件:user_id:%d", user.UserID)
	}

	// 保存业务成功信息
	span.SetAttributes(attribute.Bool("kafka.success", true))

	return user, nil
}
```
以上，我们完成了链路追踪tracing的实现，api同理

## ELK
特别地，**使用ELK基本不需要对服务源代码进行修改**，ELK本身是非嵌入的服务，我们只需要正确配置docker-compose和各组件的配置文件，就能实现分布式日志的观测

此处我们以如下项目结构为例实现配置：
```
ELK-Demo/
├── docker/
│   ├── config/
│   │   └── logstash
│   │   │   ├── logstash.conf
│   │   │   └── services-template.json
│   │   ├── elasticsearch.yml
│   │   ├── filebeat.yml
│   │   └── kibana.yml
│   ├── ELK/
│   │   └── docker-compose.yaml
│   └── OTel/...
└── logs/
    ├── api-gateway/
    │   └── 2026-03-18/
    │       ├── ERR.log
    │       └── INFO.log
    ├── post-service/...
    └── user-service/...
```
首先，我们创建`docker-compose.yaml`文件
```yaml
#ELK-Demo/docker/ELK/docker-compose.yaml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
      - bootstrap.memory_lock=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
      - ../config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
    ports:
      - "9200:9200"
    networks:
      - elk-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -s -f http://localhost:9200/_cat/health > /dev/null || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 20
      start_period: 60s

  kibana:
    image: kibana:8.11.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - XPACK_SECURITY_ENABLED=false
      - XPACK_ENCRYPTEDSAVEDOBJECTS_ENCRYPTIONKEY=something_at_least_32_characters
      - XPACK_REPORTING_ENCRYPTIONKEY=something_at_least_32_characters
    volumes:
      - ../config/kibana.yml:/usr/share/kibana/config/kibana.yml:ro
    ports:
      - "5601:5601"
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -s -f http://localhost:5601/api/status > /dev/null || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 20
      start_period: 60s

  logstash:
    image: logstash:8.11.0
    container_name: logstash
    environment:
      - LS_JAVA_OPTS=-Xmx256m -Xms128m
      - XPACK_MONITORING_ENABLED=false
    volumes:
      - ../config/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    ports:
      - "5044:5044"
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy
    restart: unless-stopped
    command: logstash -f /usr/share/logstash/pipeline/logstash.conf
    healthcheck:
      test: ["CMD-SHELL", "curl -s -f http://localhost:9600 > /dev/null || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 10
      start_period: 30s

  filebeat:
    image: elastic/filebeat:8.11.0
    container_name: filebeat
    user: root
    volumes:
      - ../../logs/:/var/log/services:ro
      - ../config/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - filebeat-data:/usr/share/filebeat/data
    networks:
      - elk-network
    depends_on:
      logstash:
        condition: service_started
    restart: unless-stopped
    command: filebeat -e -strict.perms=false
    healthcheck:
      test: ["CMD", "filebeat", "test", "config"]
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 30s

networks:
  elk-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  elasticsearch-data:
    driver: local
  filebeat-data:
    driver: local
```
然后创建`Filebeat.yml`配置文件，注意使用合理路径策略正确挂载日志文件
```yaml
##ELK-Demo/docker/config/filebeat.yml
######################## Filebeat Configuration ########################

# 采集器全局配置
filebeat.config:
  modules:
    path: ${path.config}/modules.d/*.yml
    reload.enabled: false

# 自动重载配置（开发环境启用）
filebeat.autodiscover:
  providers:
    - type: docker
      hints.enabled: true

# 输出配置
output.logstash:
  hosts: ["logstash:5044"]
  enabled: true
  compression_level: 3
  bulk_max_size: 2048
  timeout: 30s
  ssl:
    enabled: false

# 监控
monitoring:
  enabled: true
  elasticsearch:
    hosts: ["http://elasticsearch:9200"]
    username: elastic
    password: changeme

# 日志
logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644

######################## Inputs Configuration ########################
# 修改输入配置，支持子目录和特定文件
filebeat.inputs:

  # 用户服务 - 所有 .log 文件
  - type: filestream
    id: user-service
    enabled: true
    paths:
      - /var/log/services/user-service/**/*.log
    fields:
      service: "user-service"
    fields_under_root: true
    json:
      keys_under_root: true
      overwrite_keys: true
    tags: ["user-service"]

  # 帖子服务 - 所有 .log 文件
  - type: filestream
    id: post-service
    enabled: true
    paths:
      - /var/log/services/post-service/**/*.log
    fields:
      service: "post-service"
    fields_under_root: true
    json:
      keys_under_root: true
      overwrite_keys: true
    tags: ["post-service"]

  # API 网关 - ERR.log
  - type: filestream
    id: api-gateway-error
    enabled: true
    paths:
      - /var/log/services/api-gateway/**/ERR.log
    fields:
      service: "api-gateway"
      log_type: "error"
    fields_under_root: true
    json:
      keys_under_root: true
      overwrite_keys: true
    tags: ["api-gateway", "error"]

  # API 网关 - INFO.log
  - type: filestream
    id: api-gateway-info
    enabled: true
    paths:
      - /var/log/services/api-gateway/**/INFO.log
    fields:
      service: "api-gateway"
      log_type: "info"
    fields_under_root: true
    json:
      keys_under_root: true
      overwrite_keys: true
    tags: ["api-gateway", "info"]

# 处理器
processors:
  - drop_fields:
      fields: ["host", "agent", "ecs", "log"]
      ignore_missing: true
```
随后创建logstash.conf配置Logstash，注意合理解析日志文件，此处我们对日志文件是JSON格式，我们要对JSON日志文件内的不同字段名进行合理解析
```conf
# ELK-Demo/docker/config/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  grok {
    match => { "message" => "\[%{DATA:extracted_service}\]\s*(?<json_message>.+)" }
  }

  json {
    source => "json_message"
    target => "parsed"
  }

  mutate {
    add_field => {
      "service" => "%{[parsed][service]}"
      "level" => "%{[parsed][level]}"
      "error_message" => "%{[parsed][error]}"
      "log_message" => "%{[parsed][message]}"
      "caller" => "%{[parsed][caller]}"
    }

    replace => { "service" => "%{extracted_service}" }

    remove_field => ["json_message", "message", "parsed"]
  }

  date {
    match => ["[parsed][timestamp]", "yyyy-MM-dd HH:mm:ss", "ISO8601"]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "services-%{+YYYY.MM.dd}"
  }
  stdout {
    codec => rubydebug
  }
}
```
随后创建`elasticsearch.yml`进行Elasticsearch配置
```yaml
# ELK-Demo/docker/config/elasticsearch/elasticsearch.yml
# 集群设置
cluster.name: "docker-cluster"
node.name: "elasticsearch-node-1"
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# 集群发现 - 单节点模式
discovery.type: single-node

# 内存设置
bootstrap.memory_lock: false  # Windows 上必须设置为 false

# 路径
path.data: /usr/share/elasticsearch/data
path.logs: /usr/share/elasticsearch/logs

# 安全设置
xpack.security.enabled: false
xpack.security.enrollment.enabled: false
xpack.security.http.ssl.enabled: false
xpack.security.transport.ssl.enabled: false

# 跨域设置
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization
http.cors.allow-credentials: true
```
最后创建`kibana.yml`配置kibana可视化
```yaml
server.name: kibana
server.host: 0.0.0.0
server.port: 5601
elasticsearch.hosts: ["http://elasticsearch:9200"]

# 安全设置
xpack.security.enabled: false
xpack.encryptedSavedObjects.encryptionKey: "something_at_least_32_characters"
xpack.reporting.encryptionKey: "something_at_least_32_characters"

# 监控
monitoring.ui.container.elasticsearch.enabled: true
monitoring.ui.container.logstash.enabled: true

# 数据视图默认设置
kibana:
  autocompleteTimeout: 1000
  autocompleteTerminateAfter: 100000
```
配置完成后，启动docker-compose
```bash
docker-compose up -d
```
这样ELK组件就成功在docker中运行了

如果遇到错误，可以查看组件健康状态，检查容器日志并让AI分析，一步步排查错误

一切就绪后，我们就可以访问Kibana Web UI观测日志了：

Kibana:**[http://localhost:5601](http://localhost:5601)**

进入Kibana UI后，我们要先查看Kibana监控的对象是否包含我们的项目： 

> 左侧菜单栏：`Stack Manager -> Data -> Index Management`

此处我们应该看到我们对service被监控：
![](/images/albums/blogAlbum/obser1.png)

随后我们添加数据源：

> 左侧菜单栏 `Kibana -> Data View -> Create Data View`
> 
> 选择需要监控的服务，服务列表位于右侧

添加好数据源后，我们返回主页面，在左侧菜单栏`discover`里就能看到我们对服务日志了：
![](/images/albums/blogAlbum/obser2.png)

我们可以使用KQL（Kibana查询语句）对日志进行筛选和查找

比如，我们可以使用`level :"error"`查找Level为ERROR级别的日志条目：
![](/images/albums/blogAlbum/obser3.png)

至此，ELK就算完成了

## UI观测
仿照以上步骤，我们写好了微服务全部的代码并开始运行，我们可以通过docker中规定的端口访问Prometheus、Jaeger和Grafana的Web UI，测试可观测性结果并调试程序

### Prometheus
Prometheus: http://localhost:8084

成功的Prometheus指标监控：
![](/images/albums/blogAlbum/observability4.png)
Prometheus监控`otel-collector`和自身两个Job

![](/images/albums/blogAlbum/observability3.png)
我们可以输入在程序中注册的指标名查看指标数据

> Prometheus有时会自动转义指标名，如在指标名前加`otel-`前缀

### Jaeger
Jaeger: http://localhost:8085

进入Jaeger Web UI后，我们对`user-service`的`trace`进行查找

成功的Jaeger Trace：
![](/images/albums/blogAlbum/observability5.png)

我们可以看到Trace里呈父子关系的Span：`rpc-handler-service-dao`

![](/images/albums/blogAlbum/observability6.png)
也可以查看span的详细数据

### Grafana
除了用Prometheus和Jaeger自带的Web UI，我们也可以使用Grafana Web UI：

Grafana: http://localhost:8086

初始账号/密码：admin/admin123

进入Grafana后，我们要新添加数据源：在Connections-Data Sources中搜索并添加Prometheus、Jaeger和ElasticSearch（可选），并使用容器内docker网络连接`http://prometheus:9090`和`http://jaeger:16686`、`http://elasticsearch:9200`
![](/images/albums/blogAlbum/observability7.png)

添加好数据源后，我们便可以在Explore里进行Metrics和Tracing的检测
![](/images/albums/blogAlbum/observability9.png)
![](/images/albums/blogAlbum/observability8.png)

另外，我们还可以在Dashboard里创建仪表盘或使用别人的仪表盘模板，美化或系统换资源监控界面

# 参考资料
**[Lanshan-Go-2023-lesson17 | 可观测性](https://github.com/LanshanTeam/Courseware-Backend-Go-2023/blob/main/lesson17/%E5%90%8E%E7%AB%AF%20Go%20%E7%AC%AC%E5%8D%81%E4%B8%83%E6%AC%A1%E8%AF%BE.md)**