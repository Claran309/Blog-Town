---
townId: go-email
title: email包:在Go项目中发送邮件
description: Go中email包的使用.
category: Golang
series: "开发环境与工具"
seriesIndex: 2
tags:
  - Golang
  - 后端
date: 2026-02-20
draft: false
cover: /assets/posts/covers/cover9.webp
coverAlt: email包:在Go项目中发送邮件
---
# 引言
有时候我们可能需要项目实现**发送邮件**给指定用户之类的功能，这时候就需要用到**email包**`github.com/jordan-wright/email`

# Email包

## 概述
email包是一个专为**电子邮件**设计的“高级工具箱”，让构建和发送邮件变得像调用API一样简单、直观。

其核心目标是提供一套简洁、直观且功能完整的API，用于在Go程序中轻松创建和发送电子邮件，屏蔽了MIME格式的复杂性，让开发者能够专注于邮件内容本身

> 本质上，一封符合MIME标准的邮件是一个结构复杂的多部分文档，因此email包的价值在于，它将底层复杂的MIME构建逻辑完全封装，为开发者提供了一个清晰、类型安全的抽象层

## SMTP
电子邮件在网络中传输和网页一样需要遵从特定的协议，常用的电子邮件协议包括 **SMTP，POP3，IMAP**
其中邮件的创建和发送只需要用到 **SMTP 协议**

SMTP 是 **Simple Mail Transfer Protocol** 的简称，即**简单邮件传输协议**

## 快速学习
安装依赖
```bash
go get github.com/jordan-wright/email
```

### 编写代码前的准备
要实现项目发送邮件的功能，我们需要先准备一个**充当服务器邮箱的邮箱地址**

此博客中的邮箱地址以`example@gmail.com`为例

#### 邮箱准备
1. 开启**两步验证**

访问 https://myaccount.google.com/security

找到"两步验证"，按提示开启（需要绑定手机号）

2. 生成**应用专用密码**

访问 https://myaccount.google.com/apppasswords

选择应用：邮件

选择设备：其他（自定义名称），输入你的项目名称

点击"生成"，复制16位密码
> 只显示一次，务必保存好！

#### 配置准备

通过email包实现的邮件发送需要以下配置：
```go
EmailConfig{
    SMTPHost:  "smtp.gmail.com", // gmail邮箱服务器地址（由邮箱企业服务器提供）
    SMTPPort:  587,      // gmail邮箱服务器端口（由邮箱服务器地址决定）
    SMTPUser:  "example@gmail.com", // 用作服务器的邮箱
    SMTPPass:  "abcdefghijklmnop",  // 刚刚生成的应用专用密码
    FromName:  "Claran云盘", // 邮件发送人署名
    FromEmail: "example@gmail.com", // 邮件发送人邮箱
}
```

### 邮件对象化构建
在email包的设计里，一封邮件就是一个**Email结构体实例**。你需要关心的只是这个对象的属性：
```go
e := &email.Email{
    From:    "发件人 <example@gmail.com>",
    To:      []string{"收件人1@example.com", "收件人2@example.com"},
    Cc:      []string{"抄送人@example.com"},
    Bcc:     []string{"密送人@example.com"},
    Subject: "您的账户验证码",
    Text:    []byte("您的验证码是 %s",validationCode), // 纯文本正文
    HTML:    []byte(`<h1>欢迎！</h1><p>您的验证码是<strong>123456</strong></p>`), // HTML正文
}
```

### 嵌入式资源和附件
email包最亮眼的功能之一：添加附件或内嵌图片（如HTML中的Logo）无需与底层的multipart/mixed或multipart/related纠缠

- 添加附件： 只需指定文件路径或io.Reader，并可选设置文件名

- 嵌入图片： 调用Attach或Embed后，你会得到一个唯一的Content-ID (CID)。在HTML中通过`<img src="cid:your-cid">`引用即可，包会自动将图片作为邮件的一部分（而非附件）发送

```go
// 添加一个PDF附件
_, err := e.AttachFile("report.pdf")
// 嵌入一张图片作为HTML正文的一部分
cid, err := e.Embed("logo.png")
e.HTML = []byte(fmt.Sprintf(`<img src="cid:%s" alt="Logo"/> <p>正文</p>`, cid))
```

### 发送一封简单邮件

```go
package main

import (
	"fmt"
	"log"
	"github.com/jordan-wright/email"
)

type EmailConfig struct {
	SMTPHost  string  // gmail邮箱服务器地址（由邮箱企业服务器提供）
	SMTPPort  int     // gmail邮箱服务器端口（由邮箱服务器地址决定）
	SMTPUser  stgring // 用作服务器的邮箱
	SMTPPass  string  // 刚刚生成的应用专用密码
	FromName  string  // 邮件发送人署名
	FromEmail string  // 邮件发送人邮箱
}

func main() {
	emailConfig := EmailConfig{
		SMTPHost:  "smtp.gmail.com",    // gmail邮箱服务器地址（由邮箱企业服务器提供）
		SMTPPort:  587,                 // gmail邮箱服务器端口（由邮箱服务器地址决定）
		SMTPUser:  "example@gmail.com", // 用作服务器的邮箱
		SMTPPass:  "abcdefghijklmnop",  // 刚刚生成的应用专用密码
		FromName:  "Claran云盘",        // 邮件发送人署名
		FromEmail: "example@gmail.com", // 邮件发送人邮箱
	}
	e := email.NewEmail()
	e.From = fmt.Sprintf("系统通知 <%s>",emailConfig.FromName)
	e.To = []string{"user@example.com"} // 接收人邮件
	e.Subject = "测试邮件" // 邮件主题
	e.Text = []byte("这是一封来自Go程序的测试邮件。") // 正文
	// 或 e.HTML = []byte("<h1>HTML正文</h1>")

	// 使用SMTP发送
	return e.Send(emailConfig.SMTPHost+":"+strconv.Itoa(emailConfig.SMTPPort), smtp.PlainAuth("", emailConfig.FromEmail, emailConfig.SMTPPass, emailConfig.SMTPHost))
	if err != nil {
		log.Fatal("发送失败: ", err)
	}
	log.Println("邮件发送成功！")
}
```

### 邮件抄送
该插件有两种抄送模式即 `CC（Carbon Copy）`和 `BCC （Blind Carbon Copy）`

抄送功能只需要添加两个参数即可
```go
    e.Cc = []string{"XXX@qq.com",XXX@qq.com}
    e.Bcc = []string{"XXX@qq.com"}
```

### 带HTML代码的邮件
使用`e.HTML = []byte(htmlContent)`实现该功能

```go
func (s *VerificationService) SendEmail(ctx context.Context, toEmail, code string) error {
	// 构建邮件主题
	subject := fmt.Sprintf("ClaranCloudDisk验证码")

	// 构建邮件内容，前端框架由AI生成
	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			.code { 
				font-size: 24px; 
				color: #1890ff; 
				font-weight: bold;
				letter-spacing: 5px;
				padding: 10px 20px;
				background: #f0f9ff;
				border-radius: 4px;
				display: inline-block;
			}
		</style>
	</head>
	<body>
		<div>
			<h3>邮箱验证码</h3>
			<p>您的验证码是：<span class="code">%s</span></p>
			<p>验证码5分钟内有效，请尽快使用。</p>
		</div>
	</body>
	</html>`, code)

	// 创建邮件
	e := email.NewEmail()
	e.From = fmt.Sprintf("%s <%s>", s.emailConfig.FromName, s.emailConfig.FromEmail)
	e.To = []string{toEmail}
	e.Subject = subject
	e.HTML = []byte(htmlContent)
	e.Text = []byte(fmt.Sprintf("您的验证码是: %s", code))

	// 使用连接池发送
	//return s.pool.Send(e, 10*time.Second)
	return e.Send(s.emailConfig.SMTPHost+":"+strconv.Itoa(s.emailConfig.SMTPPort), smtp.PlainAuth("", s.emailConfig.FromEmail, s.emailConfig.SMTPPass, s.emailConfig.SMTPHost))
}

```


### 邮件连接池
每次调用Send时都会和 SMTP 服务器建立一次连接，如果发送邮件很多很频繁的话可能会有性能问题

而email提供了**连接池**，可以复用网络连接

以下程序创建了 4 goroutine 共用一个连接池发送邮件，并设置发送 10 封邮件后程序退出

```go
package main

import (
    "fmt"
    "log"
    "net/smtp"
    "os"
    "sync"
    "time"

    "github.com/jordan-wright/email"
)

func main() {
    ch := make(chan *email.Email, 10)
    p, err := email.NewPool(
        "smtp.qq.com:25",
        4,
        smtp.PlainAuth("", "XXX@qq.com", "你的授权码", "smtp.qq.com"),
    )

    if err != nil {
        log.Fatal("failed to create pool:", err)
    }

    var wg sync.WaitGroup
    wg.Add(4)
    for i := 0; i < 4; i++ {
        go func() {
            defer wg.Done()
            for e := range ch {
                err := p.Send(e, 10*time.Second)
                if err != nil {
                    fmt.Fprintf(os.Stderr, "email:%v sent error:%v\n", e, err)
                }
            }
        }()
    }

    for i := 0; i < 10; i++ {
        e := email.NewEmail()
        e.From = "dj <XXX@qq.com>"
        e.To = []string{"XXX@qq.com"}
        e.Subject = "Awesome web"
        e.Text = []byte(fmt.Sprintf("Awesome Web %d", i+1))
        ch <- e
    }

    close(ch)
    wg.Wait()
}
```

# 注意事项
- **SMTP认证与安全**： 生产环境务必使用STARTTLS（端口587）或SSL/TLS（端口465）。**避免使用明文认证**。对于Gmail、QQ等，使用“**应用专用密码**”而非登录密码
- **连接池管理**： 对于发送量大的应用，务必使用**连接池**(**email.Pool**)以避免频繁建立TCP/TLS连接的开销。注意合理设置池大小和超时时间
- **错误处理与重试**： 邮件发送可能因网络或SMTP服务器问题失败。生产代码中应考虑加入**重试机制**（如指数退避）和**死信队列**，确保关键邮件不丢失
- **附件大小限制**： 大多数SMTP服务器和邮件客户端对附件总大小有限制（通常为10MB-25MB）。对于大文件，应考虑上传到**云存储**（如MinIO/S3）后，**在邮件中发送下载链接**
- **收件人列表**： 批量发送时，**避免在To或Cc字段填入所有收件人地址**，这会**暴露用户邮箱**。应使用Bcc（密送），或更好的方式是**为每个收件人单独调用Send**
- **HTML邮件兼容性**： 并非所有邮件客户端都完美支持现代HTML/CSS。应使用**简单的布局和内联样式**，并务必**提供Text后备版本**。可以使用专业工具进行测试
- **模板注入风险**： 如果邮件模板内容来自用户输入，必须警惕**模板注入攻击**。使用html/template（而非text/template）并确保对动态内容进行正确的HTML转义

# 参考文章
**[发送邮件 | Go语言中文文档](https://www.topgoer.com/%E5%85%B6%E4%BB%96/%E5%8F%91%E9%82%AE%E4%BB%B6.html)**