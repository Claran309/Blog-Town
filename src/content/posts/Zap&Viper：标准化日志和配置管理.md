---
townId: go-viper-zap
title: Zap&Viper：标准化日志和配置管理
description: 第三方库Zap和Viper的学习.
category: Golang
tags:
  - Golang
  - 后端
date: 2026-02-20
draft: false
cover: /assets/posts/covers/cover22.webp
coverAlt: Zap&Viper：标准化日志和配置管理
---
# 引言

在开发Go后端项目时，我们总会用到两大王牌工具：**Zap-标准化日志管理系统** 和 **Viper-配置管理系统**

# Zap
在构建可靠、可维护的Go应用程序时，直接使用fmt.Println或log标准库虽然简单，但难以满足生产环境对高性能、结构化和灵活配置的需求

Zap是一个能够进行**标准化日志管理的第三方库**，可以实现结构化，等级化且高自定义性的日志输出，无论是控制台还是日志文档都不在话下

## 快速学习

安装依赖：
```bash
go get -u go.uber.org/zap
```

### 基本使用

Zap使用**日志器**（**Logger**）作为对象实例进行日志管理方法

在使用Logger前，需要**初始化创建Logger**：

而Zap提供了不同模式的Logger以供选择

```go
func dev() {
  logger, _ := zap.NewDevelopment()
  logger.Info("dev this is info")
  logger.Warn("dev this is warn")
  logger.Error("dev this is error")
}

func test() {
  logger := zap.NewExample()
  logger.Info("exam this is info")
  logger.Warn("exam this is warn")
  logger.Error("exam this is error")
}

func prod() {
  logger, _ := zap.NewProduction()
  logger.Info("prod this is info")
  logger.Warn("prod this is warn")
  logger.Error("prod this is error")
}
```
**dev模式**下，日志格式是text格式，并且warn和error会有栈信息

**example模式**下，格式是json，并且字段只有level和msg

**prod模式**下，格式也是json，多一个时间和函数位置字段，生产环境上用json格式的日志更方便排查
![Zap1.png](/images/albums/blogAlbum/Zap1.png)
### 日志级别

```go
// 使用 zap 的 NewDevelopmentConfig 快速配置
cfg := zap.NewDevelopmentConfig()
cfg.Level = zap.NewAtomicLevelAt(zap.WarnLevel)
// 创建 logger
logger, _ := cfg.Build()
logger.Debug("this is dev debug log")
logger.Info("this is dev info log")
logger.Warn("this is dev warn log")
logger.Error("this is dev error log")
logger.Fatal("this is dev fatal log")
```

### 时间格式化
Zap默认的时间格式并不美观和实用，我们可以自己更改**日志时间格式**：

```go
// 使用 zap 的 NewDevelopmentConfig 快速配置
cfg := zap.NewDevelopmentConfig()
cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05") // 替换时间格式化方式

// 创建 logger
logger, _ := cfg.Build()

logger.Info("dev this is info")
```

这样，Zap输出的日志时间格式就是形如`2026-2-20 15:12:32`样式的了

### Sugar日志

它提供了两种主要的日志器（Logger）：

- **SugaredLogger**： 在性能与易用性间取得平衡，支持printf风格的格式化（如Infof）和松散的键值对（如Info("failed to fetch URL", "url", url, "attempt", 3)），性能远超标准库。

- **Logger**： 追求极致性能，要求所有日志字段都必须是强类型的（使用zap.Field，如zap.String("url", url)），性能比SugaredLogger更高。

一般的Logger只有Error，Info等字符串方法，使得插入变量这一操作更加复杂

而SugaredLogger（以下简称Slog）是一个**加强版的Logger实例**，可以支持Printf类似的**格式化字符串**方法，比如Errorf，Infof等

使用 `Slog := logger.Sugar()`得到Logger的Slog

![Zap2.png](/images/albums/blogAlbum/Zap2.png)

### 结构化日志

`zap`支持通过`Field`的形式记录结构化日志，方便分析和查询

```go
logger, _ := zap.NewDevelopment()
logger.Info("this is info",
  zap.String("username", "admin"),
  zap.Int("user_id", 42),
  zap.Bool("active", true),
)
```

![Zap3.png](/images/albums/blogAlbum/Zap3.png)

## 自定义解码器
对于更深层级的Zap使用，我们会用到**自定义解码器**，允许我们对Zap默认解码器的内部进行**配置和功能修改**

### 颜色控制
让zap输出指定颜色的日志，本质上是对默认配置`NewDevelopmentConfig()`中的解码器配置`EncoderConfig`里的`EncodeLevel`定制解码器`Encoder`

以及，我们需要了解控制台的**颜色控制字符**

```go
  fmt.Printf("\033[31mthis is 红色\n\033[0m")
  fmt.Printf("\033[32mthis is 绿色\n\033[0m")
  fmt.Printf("\033[33mthis is 黄色\n\033[0m")
  fmt.Printf("\033[34mthis is 蓝色\n\033[0m")
  fmt.Printf("\033[35mthis is 紫色\n\033[0m")
  fmt.Printf("\033[36mthis is 青色\n\033[0m")
```

Encoder代码示例：
```go
// 定义颜色
const (
  colorRed    = "\033[31m"
  colorGreen  = "\033[32m"
  colorYellow = "\033[33m"
  colorBlue   = "\033[34m"
  colorReset  = "\033[0m"
)

// 自定义 EncodeLevel
func coloredLevelEncoder(level zapcore.Level, enc zapcore.PrimitiveArrayEncoder) {
  switch level {
  case zapcore.DebugLevel:
    enc.AppendString(colorBlue + "DEBUG" + colorReset)
  case zapcore.InfoLevel:
    enc.AppendString(colorGreen + "INFO" + colorReset)
  case zapcore.WarnLevel:
    enc.AppendString(colorYellow + "WARN" + colorReset)
  case zapcore.ErrorLevel, zapcore.DPanicLevel, zapcore.PanicLevel, zapcore.FatalLevel:
    enc.AppendString(colorRed + "ERROR" + colorReset)
  default:
    enc.AppendString(level.String()) // 默认行为
  }
}
func dev() {
  // 使用 zap 的 NewDevelopmentConfig 快速配置
  cfg := zap.NewDevelopmentConfig()
  cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05") // 替换时间格式化方式
  cfg.EncoderConfig.EncodeLevel = coloredLevelEncoder
  // 创建 logger
  logger, _ := cfg.Build()

  logger.Info("dev this is info")
  logger.Warn("dev this is warn")
  logger.Error("dev this is error")
}
```

此时日志等级的输出效果被美化
![Zap4.png](/images/albums/blogAlbum/Zap4.png)

### 自定义日志输出
通过自定义**Encoder**，对原始日志行进行字符串方法处理

以下是为日志行增加项目名称前缀的示例
```go
// 定义前缀
const logPrefix = "[MyApp] "

// 自定义 Encoder
type prefixedEncoder struct {
  zapcore.Encoder
}

func (e *prefixedEncoder) EncodeEntry(entry zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
  // 先调用原始的 EncodeEntry 方法生成日志行
  buf, err := e.Encoder.EncodeEntry(entry, fields)
  if err != nil {
    return nil, err
  }

  // 在日志行的最前面添加前缀
  logLine := buf.String()
  buf.Reset()
  buf.AppendString(logPrefix + logLine)

  return buf, nil
}
func dev() {
  // 使用 zap 的 NewDevelopmentConfig 快速配置
  cfg := zap.NewDevelopmentConfig()
  cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05") // 替换时间格式化方式
  // 创建自定义的 Encoder
  encoder := &prefixedEncoder{
    Encoder: zapcore.NewConsoleEncoder(cfg.EncoderConfig), // 使用 Console 编码器
  }
  // 创建 Core
  core := zapcore.NewCore(
    encoder,                    // 使用自定义的 Encoder
    zapcore.AddSync(os.Stdout), // 输出到控制台
    zapcore.DebugLevel,         // 设置日志级别
  )

  // 创建 Logger
  logger := zap.New(core, zap.AddCaller())

  logger.Info("dev this is info")
  logger.Warn("dev this is warn")
  logger.Error("dev this is error")
}
```

效果预览

![Zap5.png](/images/albums/blogAlbum/Zap5.png)

### 全局日志
有些时候想要在应用程序的任何地方都可以直接使用的日志实例，就需要用到**全局日志**

```go
// 初始化全局日志
func initLogger() {
  // 使用 zap 的 NewDevelopmentConfig 快速配置
  cfg := zap.NewDevelopmentConfig()
  cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05") // 替换时间格式化方式
  // 创建 Logger
  logger, _ := cfg.Build()
  zap.ReplaceGlobals(logger)
}

func dev() {
  zap.L().Info("dev this is info")
  zap.L().Warn("dev this is warn")
  zap.L().Error("dev this is error")
  zap.S().Infof("dev this is info %s", "xxx")
  zap.S().Warnf("dev this is warn %s", "xxx")
  zap.S().Errorf("dev this is error %s", "xxx")
}
```

L方法返回的是**标准zap实例**，S方法返回的是**SuperedZap的实例**

### 日志双写
日志双写就是同时把日志行写出在控制台和日志文件中

```go
// 初始化全局日志
func initLogger() {
  // 使用 zap 的 NewDevelopmentConfig 快速配置
  cfg := zap.NewDevelopmentConfig()
  cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05") // 替换时间格式化方式
  // 创建 Core
  consoleCore := zapcore.NewCore(
    zapcore.NewConsoleEncoder(cfg.EncoderConfig),
    zapcore.AddSync(os.Stdout), // 输出到控制台
    zapcore.DebugLevel,         // 设置日志级别
  )
  file, _ := os.OpenFile("app.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
  fileCore := zapcore.NewCore(
    zapcore.NewConsoleEncoder(cfg.EncoderConfig),
    zapcore.AddSync(file), // 输出到文件
    zapcore.DebugLevel,    // 设置日志级别
  )
  core := zapcore.NewTee(consoleCore, fileCore)
  // 创建 Logger
  logger := zap.New(core, zap.AddCaller())
  zap.ReplaceGlobals(logger)
}
```

> 使用zapcore.NewTee可以组合多个core实例

### 日志分片
将日志文件以不同的策略进行分片处理，常见的为**按时间分片**和**按等级分片**


以下代码实现了按照日期进行日志分片，并单独分理处ERR等级的日志行
```go
package log

import (
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

// 颜色配置
const (
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorReset  = "\033[0m"
)

// MyEncoder 自定义解码器模型
type MyEncoder struct {
	AppName string
	zapcore.Encoder
	errFile *os.File
	writer  MyLogWriter
}

// MyLogWriter 自定义日志文件写入器模型
type MyLogWriter struct {
	mu      sync.Mutex
	logDate string
	file    *os.File
	logPath string
}

// 自定义解码器
func (m *MyEncoder) EncodeEntry(entry zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	// 获取原始解码数据
	buf, err := m.Encoder.EncodeEntry(entry, fields)
	if err != nil {
		return nil, err
	}

	// 自定义前缀数据
	DataStr := buf.String()
	buf.Reset()
	buf.AppendString("[" + m.AppName + "] " + DataStr)

	// 时间分片
	m.writer.mu.Lock()
	defer m.writer.mu.Unlock()
	currentDate := time.Now().Format("2006-01-02")

	// 检查是否需要切换到新的日志文件
	if m.writer.logDate != currentDate {
		// 关闭当前日志文件
		if m.writer.file != nil {
			m.writer.file.Close()
		}

		// 创建新的日志文件
		newPath := filepath.Join(m.writer.logPath, "/", currentDate)
		if err := os.MkdirAll(newPath, 0755); err != nil {
			return nil, errors.New("创建文件夹错误")
		}
		filePath := filepath.Join(newPath, " INFO")
		file, err := os.OpenFile(filePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644) // 不存在则创建，只写入
		if err != nil {
			return nil, errors.New("打开文件错误" + filePath)
		}
		// 更新writer
		m.writer.file = file
		m.writer.logDate = currentDate
	}

	// 如果是err及以下的log_level
	if entry.Level >= zapcore.ErrorLevel {
		if m.errFile == nil {
			// 创建新的日志文件
			newPath := filepath.Join(m.writer.logPath, "/", currentDate)
			filePath := filepath.Join(newPath, " ERR")
			errFile, err := os.OpenFile(filePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644) // 不存在则创建，只写入
			if err != nil {
				return nil, err
			}
			m.errFile = errFile
		}
		m.errFile.WriteString(buf.String())
	}

	if m.writer.logDate == currentDate {
		m.writer.file.WriteString(buf.String())
	}

	// 返回数据
	return buf, nil
}

func InitLogManager(appName string, logPath string) {
	cfg := zap.NewDevelopmentConfig()
	// 时间格式化配置
	cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")

	// 配置自定义解码器
	myEncoder := &MyEncoder{
		AppName: appName,
		Encoder: zapcore.NewConsoleEncoder(cfg.EncoderConfig),
		writer: MyLogWriter{
			logPath: logPath,
		},
	}

	// 创建core
	core := zapcore.NewCore(
		myEncoder,                  // 解码器
		zapcore.AddSync(os.Stdout), // 输出到控制台
		zapcore.InfoLevel,          // log_level
	)

	// 创建logger
	Logger := zap.New(core, zap.AddCaller())

	// 全局日志
	zap.ReplaceGlobals(Logger)
}
```

效果预览

![Zap6.png](/images/albums/blogAlbum/Zap6.png)

## 使用标准
在后端web项目中，应当对**主程序的开始/结束**，**路由的注册**，**路由的请求开始/结束**，**缓存的命中信息**，以及**所有的错误触发点**进行日志写入，并搭配合理的错误抛出机制，快速定位错误来源

注意**避免暴露敏感信息**

项目日志示例：

![Zap7.png](/images/albums/blogAlbum/Zap7.png)

# Viper
Viper则是配置管理的万能钥匙，支持**多种配置源管理**和**动态热更新**

Viper 使用如下的优先级来读取配置：

1. 显示的值设置
2. 命令行标记标记
3. 环境变量
4. 配置文件
5. 键值存储
6. 默认值

> 注：Viper 配置中的键不区分大小写

## 快速学习
安装依赖
```bash
go get -u github.com/spf13/viper
```

### 设置默认值
```go
viper.SetDefault("filePath","./dir/images/albums/blogAlbum/usr")
viper.SetDefault("root","123456")
```

以下以环境变量`.env`管理和配置文件`.yaml`管理做代码演示
### 环境变量
viper可以轻松地绑定环境变量
```go
viper.AutomaticEnv() // 自动绑定所有环境变量
viper.BindEnv("database.user", "DB_USER") // 显式绑定特定环境变量
```

### 配置文件
viper可以轻松地读写配置文件

#### 读取
首先需要配置viper，让viper知道在哪里查找配置文件

Viper 支持 JSON、 TOML、 YAML、 HCL、 INI、 envfile 和 JavaProperties 文件

Viper 可以同时搜索多个路径，但目前单个 Viper 实例**只支持单个配置文件**

下面是使用 Viper 读取配置文件的一个示例，不需要指定一个完整路径，但在使用时至少应当提供一个配置文件
```go
func TestReadConfigFile(t *testing.T) {
   viper.SetConfigName("config.yml") // 读取名为config的配置文件，没有设置特定的文件后缀名
   viper.SetConfigType("yaml")       // 当没有设置特定的文件后缀名时，必须要指定文件类型
   viper.AddConfigPath("./")         // 在当前文件夹下寻找
   viper.AddConfigPath("$HOME/")     // 使用变量
   viper.AddConfigPath(".")          // 在工作目录下查找
   err := viper.ReadInConfig() //读取配置
   if err != nil {
      log.Fatalln(err)
   }
}
```
当未找到配置文件时：
```go
if err := viper.ReadInConfig(); err != nil {
  if _, ok := err.(viper.ConfigFileNotFoundError); ok {
    // 配置文件未找到
  } else {
    // 其他类型的错误
  }
}
```

当访问嵌套配置的时候通过`.`**分隔符**进行访问，例如：
```json
{
  "server":{
    "database":{
      "url": "mysql...."
    }
  }
}
```
可以通过`GetString("server.database.url")`来进行**嵌套访问**

访问配置的所有函数：

- `Get(key string) : interface{}`
- `GetBool(key string) : bool`
- `GetFloat64(key string) : float64`
- `GetInt(key string) : int`
- `GetIntSlice(key string) : []int`
- `GetString(key string) : string`
- `GetStringMap(key string) : map[string]interface{}`
- `GetStringMapString(key string) : map[string]string`
- `GetStringSlice(key string) : []string`
- `GetTime(key string) : time.Time`
- `GetDuration(key string) : time.Duration`
- `IsSet(key string) : bool`
- `AllSettings() : map[string]interface{}`

##### 演示
对于这样一个依赖于环境变量`.env`的`yaml`配置文件：
```yaml
#===============================应用配置=================================
app:
  name: ${APP_NAME}
  env: ${APP_ENV}
  log_path: ${LOG_PATH}
  max_requests_every_minute: ${MAX_REQUESTS_EVERY_MINUTE}

  http:
    host: ${APP_HOST}
    port: ${APP_PORT}

  file:
    cloud_file_dir: ${CLOUD_FILE_DIR}
    avatar_dir: ${AVATAR_DIR}
    default_avatar_dir: ${DEFAULT_AVATAR_PATH}
    max_file_size: ${MAX_FILE_SIZE}
    normal_user_max_storage: ${NORMAL_USER_MAX_STORAGE}
    limited_speed: ${LIMITED_SPEED}

jwt:
  secret_key: ${SECRET_KEY}
  issuer: ${ISSUER}
  exp_time_hours: ${EXP_TIME_HOURS}

#===============================数据库配置===============================
database:
  mysql:
    root_password: ${MYSQL_ROOT_PASSWORD}
    database: ${MYSQL_DATABASE}
    user: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
    dsn: ${DB_DSN}

  redis:
    addr: ${REDIS_ADDR}
    password: ${REDIS_PASSWORD}
    db: ${REDIS_DB}

#===============================存储配置================================
minIO:
  root_user: ${MINIO_ROOT_USER}
  password: ${MINIO_ROOT_PASSWORD}
  endpoint: ${MINIO_ENDPOINT}
  bucket_name: ${MINIO_BUCKET_NAME}

#===============================服务器邮箱配置===========================
email:
  SMTP_host: ${SMTP_HOST}
  SMTP_port: ${SMTP_PORT}
  SMTP_user: ${SMTP_USER}
  SMTP_pass: ${SMTP_PASS}
  from_name: ${FROM_NAME}
  from_email: ${FROM_EMAIL}
```
使用如下代码进行配置管理：
```go
package config

import (
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type EmailConfig struct {
	SMTPHost  string
	SMTPPort  int
	SMTPUser  string
	SMTPPass  string
	FromName  string
	FromEmail string
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

type MinIOConfig struct {
	MinIORootName   string
	MinIOPassword   string
	MinIOEndpoint   string
	MinIOBucketName string
}

type Config struct {
	// App
	AppName     string
	LogPath     string
	MaxRequests int

	// jwt
	JWTSecret      string
	JWTIssuer      string
	JWTExpireHours int

	// Files
	CloudFileDir         string
	AvatarDIR            string
	DefaultAvatarPath    string
	MaxFileSize          int64 // 单个文件大小限制 (GB)
	NormalUserMaxStorage int64 // 非VIP用户存储空间限制 (GB)
	LimitedSpeed         int64 // 非VIP用户下载速度限额 (MB) - 0 为不限速

	// mysql
	DSN string

	//redis
	Redis RedisConfig

	//minIO
	MinIO MinIOConfig

	//Email
	Email EmailConfig

	//http
	Host string
	Port int
}

func InitConfigByViper() *Config {
	//初始化viper
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config/config.yaml")

	// 加载环境变量文件 .env
	godotenv.Load()
	
	//读取config.yaml
	configContent, err := os.ReadFile("./config/config.yaml")
	if err != nil {
		zap.S().Fatalf("os读取config.yaml失败: %v", err)
	}

	//展开环境变量
	expandedContent := os.ExpandEnv(string(configContent))

	//提取config.yaml
	if err := viper.ReadConfig(strings.NewReader(expandedContent)); err != nil {
		zap.S().Fatalf("viper提取config.yaml失败: %v", err)
	}

	// 默认配置
	viper.SetDefault("app.name", "ClaranCloudDisk")
	viper.SetDefault("app.file.cloud_file_dir", "./CloudFiles")
	viper.SetDefault("app.file.avatar_dir", "./Avatars")
	viper.SetDefault("app.file.default_avatar_path", "./Avatars/DefaultAvatar/DefaultAvatar.png")
	viper.SetDefault("app.log_path", "./log./logs")

	//返回配置数据
	return &Config{
		AppName:              viper.GetString("app.name"),
		LogPath:              viper.GetString("app.log_path"),
		MaxRequests:          viper.GetInt("app.max_requests_every_minute"),
		JWTSecret:            viper.GetString("jwt.secret_key"),
		JWTIssuer:            viper.GetString("jwt.issuer"),
		JWTExpireHours:       viper.GetInt("jwt.exp_time_hours"),
		CloudFileDir:         viper.GetString("app.file.cloud_file_dir"),
		AvatarDIR:            viper.GetString("app.file.avatar_dir"),
		DefaultAvatarPath:    viper.GetString("app.file.default_avatar_dir"),
		MaxFileSize:          viper.GetInt64("app.file.max_file_size"),           // 25 GB
		NormalUserMaxStorage: viper.GetInt64("app.file.normal_user_max_storage"), //100 GB
		LimitedSpeed:         viper.GetInt64("app.file.limited_speed"),           // 10 MB/s
		DSN:                  viper.GetString("database.mysql.dsn"),
		Redis: RedisConfig{
			Addr:     viper.GetString("database.redis.addr"),
			Password: viper.GetString("database.redis.password"),
			DB:       viper.GetInt("database.redis.db"),
		},
		MinIO: MinIOConfig{
			MinIORootName:   viper.GetString("minio.root_user"),
			MinIOPassword:   viper.GetString("minio.password"),
			MinIOEndpoint:   viper.GetString("minio.endpoint"),
			MinIOBucketName: viper.GetString("minio.bucket_name"),
		},
		Email: EmailConfig{
			SMTPHost:  viper.GetString("email.SMTP_host"),
			SMTPPort:  viper.GetInt("email.SMTP_port"),
			SMTPUser:  viper.GetString("email.SMTP_user"),
			SMTPPass:  viper.GetString("email.SMTP_pass"),
			FromName:  viper.GetString("email.from_name"),
			FromEmail: viper.GetString("email.from_email"),
		},
		Host: viper.GetString("app.http.host"),
		Port: viper.GetInt("app.http.port"),
	}
}
```

#### 写入
Viper 提供了一系列函数来方便开发者将运行时存储的配置**写入配置文件**中
```go
// WriteConfig 将配置写入原配置文件中，不存在会报错，存在的话会覆盖
func WriteConfig() error { return v.WriteConfig() }

// SafeWriteConfig 将配置安全的写入原配置文件中，不存在时会写入，存在的话则不会覆盖
func SafeWriteConfig() error { return v.SafeWriteConfig() }

// WriteConfigAs 将当前的配置写入指定文件，文件不存在时会返回错误，存在时会覆盖原有配置
func WriteConfigAs(filename string) error { return v.WriteConfigAs(filename) }

// SafeWriteConfigAs 如果指定的文件存在的话，将不会覆盖原配置文件，文件存在的话会返回错误
func SafeWriteConfigAs(filename string) error { return v.SafeWriteConfigAs(filename) }
```

## 监控和重载配置
Viper 允许应用程序在运行时**动态读取配置文件**，即不需要重新启动应用程序也可以使更新的配置生效

只需要简单地告诉 Viper 实例去监视配置变化，或者可以提供一个函数给 viper 以便每次发生变化时运行该函数

```go
func TestWatchingConfig(t *testing.T) {
  viper.OnConfigChange(func(e fsnotify.Event) {
    fmt.Println("配置文件已更改:", e.Name)
  })
  viper.WatchConfig()
}
```

以下为项目中监控和重载配置的示例：
```go
func WatchConfig() {
	zap.L().Info("开始监控配置文件")
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		zap.S().Fatalf("创建监控器失败: %v", err)
		return
	}
	defer watcher.Close()

	if err := watcher.Add("./config/config.yaml"); err != nil {
		zap.S().Fatalf("监控文件失败: %v", err)
		return
	}

	zap.L().Info("监控配置文件中: ./config/config.yaml")

	//信号传递
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	//持续监控
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}

			if event.Op&fsnotify.Write == fsnotify.Write {
				zap.S().Warnf("检测到配置文件变化: %s", event.Name)

				time.Sleep(100 * time.Millisecond)

				//热重载
				//读取config.yaml
				configContent, err := os.ReadFile("./config/config.yaml")
				if err != nil {
					zap.S().Fatalf("os读取config.yaml失败: %v", err)
				}

				//展开环境变量
				expandedContent := os.ExpandEnv(string(configContent))

				//fmt.Println(expandedContent)

				//提取config.yaml
				if err := viper.ReadConfig(strings.NewReader(expandedContent)); err != nil {
					zap.S().Fatalf("viper提取config.yaml失败: %v", err)
				}

				zap.L().Warn("配置已热重载，请及时重启服务器")
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			zap.S().Errorf("监控出错:  %v", err)

		case <-signalChan:
			zap.L().Info("停止监控")
			return
		}
	}
}
```

# 参考文章
**[Viper | Golang学习中文文档](https://golang.halfiisland.com/community/pkgs/config/Viper.html)**

**[枫枫知道 | Zap第三方库](https://www.fengfengzhidao.com/article/e8OCcZUB8lppN5cb7HmJ)**