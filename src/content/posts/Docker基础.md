---
townId: docker
title: Docker基础
description: 初步讲解Docker,Dockerfile和Docker-compose.
category: 工具
series: "Go 工程化与工具"
seriesIndex: 2
tags:
  - 工具
  - 后端
  - linux
date: 2025-12-12
draft: false
cover: /assets/posts/covers/cover8.webp
coverAlt: Docker基础
---
# Docker
## Docker是什么？
Docker 是一个容器化平台，它可以将应用程序及其所有依赖项打包到一个标准化的、可移植的"容器"中

容器就像一个轻量级的虚拟机，但更加高效

**核心特点：**

- **轻量**：共享主机操作系统内核，不需要完整操作系统

- **快速**：秒级启动

- **一致**：在任何地方运行结果相同

- **隔离**：应用之间互不干扰

- **可移植**："一次构建，处处运行"

## 基础概念

### 镜像（image）

镜像就是将写好的源代码或编译后生成的可执行文件打包后的结果，特点就是可以分发，存储

docker 的镜像有着自己的储存格式，每个镜像相当于一个 root 的层状文件系统，不仅仅包含了服务程序本身，还包含了程序所有的依赖，例如 python, java 程序需要一个对应的解释器环境

在 dockerhub (https://hub.docker.com/) 中储存了很多镜像

![Docker2.png](/images/albums/blogAlbum/Docker2.png)

### 容器（Container）

容器就是镜像实体化执行后的实例，互相隔离

容器本质上是一个进程及它的子进程等，一个容器基于一个镜像，十分类似面向对象编程中类与对象之间的关系，容器基于镜像产生，当启动一个容器，我们写的服务程序就开始运行了

容器的生命周期是短暂的，它不像镜像从构建并发布后就可以一直存在。当一个容器被删除，它运行时具有的文件系统会被清理，但它基于的镜像的数据卷不会被删除，所以需要有一个动态变化的数据或者持久化容器内程序的运行结果，要将其放到数据卷内挂载到容器内部，否则容器被删除后文件也会被删除

### 仓库（Repository）

一个镜像属于一个仓库，可以通过 “仓库名称:镜像tag” 来定位一个具体的镜像

### 注册中心（Registry）

一个储存大量仓库的地方，最大的公开 Registry 莫过于 [**docker hub**](https://hub.docker.com/)

### 挂载和数据卷（Volume）

### 端口映射（ports）

### 环境变量（ENV）

## Docker的安装

### Docker Desktop

### Docker Engine

## Docker的使用

### 工作流程

#### 拉取镜像

#### 创建镜像

见下文Dockerfile内容

#### 操作容器

#### 数据管理

#### 端口映射和容器互联

### 常用指令

## Docker的底层原理和核心技术

### Namespace

### CGroups

### UnionFS

# Dockerfile

# docker-compose