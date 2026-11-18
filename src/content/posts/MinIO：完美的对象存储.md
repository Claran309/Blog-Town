---
townId: go-minio
title: MinIO：完美的对象存储
description: minio及其在Go中的使用.
category: Golang
tags:
  - Golang
  - 后端
  - 工具
date: 2026-02-19
draft: false
cover: /assets/posts/covers/cover21.webp
coverAlt: MinIO：完美的对象存储
---
# 引言
最近做了网盘相关项目，了解一下一般情况下常用的一些文件存储方法：用IO库进行的**本地磁盘存储**，需要付费但是方便安全的**OSS云存储**（阿里云等），以及今天的主角的-**MinIO**对象存储系统

可以说，MinIO就是可以存储文件的“数据库”

> 在本质上，OSS云存储也只不过是在企业云服务器上部署的MinIO或本地存储方式，MinIO同样也是经过包装过的直接访问本地磁盘的存储方式

# 概述和特点
MinIO的独特之处，在于其完全**云原生**，**高性能**，**轻量级**且**完全开源**的设计哲学，内部完全由**Go语言**实现，它重新定义了企业级对象存储的构建和运行方式

再简单点说，MinIO的独特之处在于，它将对象存储的门槛降到了最低（**轻量 & 开源**），同时将性能拉到了最高，专为**云原生**和**容器化环境**而生

如同之前所说，MinIO是一种完美的对象存储系统，那么MinIO和其他存储方式有什么区别呢？

这里我们就要聚焦到MinIO的**设计理念**和**S3标准的云原生**

## 独特的对象和K-V化存储（Object & Bucket）

MinIO的对象化存储，存的不只是文件的数据，还有文件的**标识符Key**和文件的**元数据Value**

### K-V
在minIO的存储设计里，所有需要存储的文件本质上都是一个**对象（Object）**

我们都知道，无论是最简单的文本文件TXT，还是动辄几GB的视频文件或文件流，本质上都是由**字节流**（**byte[]**）构成的，而MinIO存储的正是这种字节流（byte[]），因此MinIO基本能够存储所有文件类型

更重要的是，MinIO将每个对象都通过一个唯一的“键”寻址，并与元数据绑定，这也是S3的协议标准

### 存储桶（Bucket）

在MinIO中，这个K-v设计中的这个Key可以是`MyApp/Project1/storage/1.txt`，但本质上这个Key是一个**标识符**，而非真实的目录层级

因此，与传统的**树状文件系统**不同的是，MinIO独特的**KV式**设计，让他的对象存储变成了一个巨大的**“存储池”**，而非依赖于路径下层层进深的树状结构。

所有对象都放在一个巨大的**桶**（**Bucket**）里，通过唯一的键Key直接定位

这种设计让存储的拓展性变得无比简单，让人无须担心目录树的深度或复杂度

## S3
在说云原生之前，我们需要先了解一下S3这一概念

S3 是 **Amazon Simple Storage Service** 的简称，是亚马逊AWS云提供的一项**核心对象存储服务**，核心结构也为B-O（Bucket-Object）式存储服务，具有**高耐久性**和**可用性**，使用标准的**RESTful API**进行上传，下载和管理操作

由于S3出色的设计，可靠的稳定性，S3的API接口已经成为对象存储领域的行业标准协议。无数应用程序，工具或开源项目都原生支持S3协议

## 云原生

云原生意味着MinIO不仅采用了**云原生架构原则**，也可以运行在云服务器上

MinIO本身可以看作一个**提供S3 API的微服务**，用户可以通过K8S，用yaml文档声明式地定义和部署一个MinIO集群以实现自动化运维，且可以根据自身情况，动态规划MinIO中的Pod实例数量来契合个人的项目数据

也正是因为MinIO的**S3支持**和他强大的**工具生态**，MinIO才得以成为对象存储的杀手锏

# MinIO的使用
我们可以在自己的项目里运用MinIO存储

## 快速开始

### 1. 拉取并运行Docker镜像
```bash
# 拉取最新的MinIO镜像
docker pull minio/minio

# 运行 MinIO 容器
# 将主机上的 `~/minio/data` 目录挂载到容器内，用于持久化存储数据
# 将主机上的 `~/minio/config` 目录挂载到容器内，用于存储配置
# 默认控制台端口为 9001，API端口为 9000
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -v ~/minio/data:/data \
  -v ~/minio/config:/root/.minio \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=yourstrongpassword" \
  minio/minio server /data --console-address ":9001"
```

### 2. MinIO管理控制台

运行后，可以通过访问http://localhost:9001，使用上述账号密码登录MinIO管理控制台

### 3. 安装客户端库

```bash
go get github.com/minio/minio-go/v7
```

### 4. 初始化客户端库

```go
package main

import (
    "log"
    "github.com/minio/minio-go/v7"
    "github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
    // 配置参数
    endpoint := "localhost:9000"
    accessKeyID := "admin" // 即 MINIO_ROOT_USER
    secretAccessKey := "yourstrongpassword" // 即 MINIO_ROOT_PASSWORD
    useSSL := false // 使用http/https

    // 初始化客户端
    minioClient, err := minio.New(endpoint, &minio.Options{
        Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
        Secure: useSSL,
    })
    if err != nil {
        log.Fatalln("初始化客户端失败:", err)
    }
    log.Printf("%#v\n", minioClient) // 打印客户端信息，确认连接成功
}
```

## API实例

### 初始化客户端
```go
    ctx := context.Background()
    endpoint := "localhost:9000"
    accessKeyID := "your-access-key"
    secretAccessKey := "your-secret-key"
    useSSL := false

    // 初始化客户端
    minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
    })
    if err != nil { 
		log.Fatalln(err)
    }
```

### 创建存储桶
```go
    // 创建一个存储桶（如果不存在）
    bucketName := "my-documents"
    location := "us-east-1" // 对MinIO来说，这个值通常无关紧要

    err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{Region: location})
    if err != nil {
        // 检查存储桶是否已存在
        exists, errBucketExists := minioClient.BucketExists(ctx, bucketName)
        if errBucketExists == nil && exists {
            log.Printf("存储桶 %s 已存在\n", bucketName)
        } else {
            log.Fatalln("创建存储桶失败:", err)
        }
    } else {
        log.Printf("成功创建存储桶 %s\n", bucketName)
    }
```

### 上传文件
```go
   // 3. 上传一个文件
    objectName := "example.jpg"
    filePath := "./local-image.jpg"
    contentType := "image/jpeg"

    info, err := minioClient.FPutObject(ctx, bucketName, objectName, filePath, minio.PutObjectOptions{ContentType: contentType})
    if err != nil {
        log.Fatalln("上传文件失败:", err)
    }
    log.Printf("成功上传 %s，大小：%d bytes， ETag： %s\n", objectName, info.Size, info.ETag)
```
### 生成URL
```go
    // 4. 生成一个用于临时访问文件的预签名URL（有效期7天）
    expiry := 7 * 24 * 60 * 60 // 秒
    presignedURL, err := minioClient.PresignedGetObject(ctx, bucketName, objectName, time.Duration(expiry)*time.Second, nil)
    if err != nil {
        log.Fatalln("生成预签名URL失败:", err)
    }
    log.Println("您可以通过此链接临时访问文件：", presignedURL.String())
```

## 注意事项
1. 启用HTTPS以加密数据传输
2. 可以在控制台通过`Access Key`为不同程序创建具有特定策略（policy）的子账户，避免直接使用ROOT账户密钥
3. 数据持久化：使用Docker或K8S不是时，务必通过卷（Volume）或持久化卷声明（PVC）将`/data`目录挂载到宿主机或网络存储，避免重启容器造成数据丢失
4. 桶命名（bucket_name）限制: 3-63字符，只允许 小写字母,数字,点号`.`,连字符`-`，不能包含相邻的句点`..`或与连字符相邻的句点`.-`/`-.`
5. 对象命名（object_name）: 建议使用 ASCⅡ可打印字符，在Windows环境使用时，不允许包含对操作系统有歧义的字符 "./"

## 项目实例
```go
package minIO

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime"
	"os"
	"path"
	"path/filepath"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
)

type MinIOClient struct {
	Client     *minio.Client
	BucketName string
}

func NewMinIOClient(endpoint, accessKeyID, secretAccessKey, bucketName, DefaultAvatarPath string) (*MinIOClient, error) {
	//初始化minIOClient
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false, // http
	})
	if err != nil {
		return nil, fmt.Errorf("初始化minIO客户端失败: %v", err)
	}

	//验证bucket是否存在
	exist, err := minioClient.BucketExists(context.Background(), bucketName)
	if !exist {
		err = minioClient.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("新建bucket失败: %v", err)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("验证minIO_bucket失败: %v", err)
	}

	//上传默认头像
	Path := filepath.Join(".", DefaultAvatarPath)
	DefaultAvatar, err := os.Open(Path)
	if err != nil {
		fmt.Printf("获取默认头像失败:%v\n", err)
	}
	DefaultAvatarData, _ := io.ReadAll(DefaultAvatar)
	ext := path.Ext(DefaultAvatarPath)
	reader := bytes.NewReader(DefaultAvatarData)
	size := int64(len(DefaultAvatarData))
	mimeType := mime.TypeByExtension(ext)
	opts := minio.PutObjectOptions{ContentType: mimeType}
	_, err = minioClient.PutObject(context.Background(), bucketName, DefaultAvatarPath, reader, size, opts)
	if err != nil {
		zap.S().Errorf("上传默认头像失败:%v\n", err)
		fmt.Printf("上传默认头像失败:%v\n", err)
	}

	return &MinIOClient{
		Client:     minioClient,
		BucketName: bucketName,
	}, nil
}

func (m *MinIOClient) Save(ctx context.Context, objectName string, data []byte, ext string) error {
	//捕获数据
	//mimeType := mime.TypeByExtension(ext)
	mimeType := mime.TypeByExtension(ext)
	reader := bytes.NewReader(data)
	size := int64(len(data))
	//Options
	opts := minio.PutObjectOptions{ContentType: mimeType}

	//保存文件
	//PutObject(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64,opts PutObjectOptions) (info UploadInfo, err error)
	_, err := m.Client.PutObject(ctx, m.BucketName, objectName, reader, size, opts)
	if err != nil {
		zap.S().Errorf("保存到minIO失败: %v", err)
		return fmt.Errorf("保存到minIO失败: %v", err)
	}

	return nil
}

func (m *MinIOClient) Delete(ctx context.Context, objectName string) error {
	//RemoveObject(ctx context.Context, bucketName, objectName string, opts minio.RemoveObjectOptions) error
	err := m.Client.RemoveObject(ctx, m.BucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		zap.S().Errorf("从minIO删除文件失败: %v", err)
		return fmt.Errorf("从minIO删除文件失败: %v", err)
	}

	return nil
}

func (m *MinIOClient) Update(ctx context.Context, objectName string, data []byte, ext string) error {
	return m.Save(ctx, objectName, data, ext)
}

func (m *MinIOClient) Exists(ctx context.Context, objectName string) (bool, error) {
	//StatObject(ctx context.Context, bucketName, objectName string, opts StatObjectOptions) (ObjectInfo, error)
	//NoSuchKey
	_, err := m.Client.StatObject(ctx, m.BucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		if errType, ok := err.(minio.ErrorResponse); ok && errType.Code == "NoSuchKey" {
			return false, nil
		}
		return false, fmt.Errorf("检查文件失败: %v", err)
	}
	return true, nil
}

func (m *MinIOClient) GetBytes(ctx context.Context, objectName string) ([]byte, error) {
	//GetObject(ctx context.Context, bucketName, objectName string, opts GetObjectOptions) (*Object, error)
	obj, err := m.Client.GetObject(ctx, m.BucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("获取文件失败: %v", err)
	}
	defer obj.Close()

	//检查文件是否存在
	if _, err := obj.Stat(); err != nil {
		return nil, fmt.Errorf("文件不存在: %v", err)
	}

	//读取数据
	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %v", err)
	}

	return data, nil
}

func (m *MinIOClient) GetStream(ctx context.Context, objectName string) (io.ReadCloser, error) { //GetObject(ctx context.Context, bucketName, objectName string, opts GetObjectOptions) (*Object, error)
	obj, err := m.Client.GetObject(ctx, m.BucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("获取文件失败: %v", err)
	}
	//流式传输不关闭obj，直接返回

	return obj, nil
}

```

# 参考文章
**[minio-Go 快速入门指南](https://min-io.cn/docs/minio/linux/developers/go/minio-go.html)**