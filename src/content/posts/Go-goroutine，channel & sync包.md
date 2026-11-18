---
townId: go-goroutine
title: Go并发基础-goroutine，channel & sync包
description: Go的并发基础学习.
category: Golang
tags:
  - Golang
  - 后端
date: 2025-10-27
draft: false
cover: /assets/posts/covers/cover11.webp
coverAlt: Go并发基础-goroutine，channel & sync包
---
# 并发

#### 📚 五种执行模式定义

**1. 同步 (Synchronous)** - 调用后等待结果返回

**2. 异步 (Asynchronous)** - 调用后立即返回,不等待

**3. 串行 (Serial)** - 任务一个接一个顺序执行

**4. 并发 (Concurrency)** - 多任务交替执行,逻辑上同时

**5. 并行 (Parallelism)** - 多任务真正同时执行,物理上同时

# Goroutine (go)
创建一个额外线程执行相应内容
> 内存占用极小（2kb），Go的特有优势
```go
func sayHello(name string) {
    for i := 0; i < 3; i++ {
        fmt.Printf("Hello %s! (%d)\n", name, i+1)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // 普通调用:同步执行
    sayHello("同步")

    // 加 go:异步执行
    go sayHello("异步1")
    go sayHello("异步2")

    // 等待 goroutine 完成
    time.Sleep(1 * time.Second)
}
// 可能的输出(顺序不确定):
// Hello 同步! (1)
// Hello 同步! (2)
// Hello 同步! (3)
// Hello 异步1! (1)
// Hello 异步2! (1)
// Hello 异步1! (2)
// Hello 异步2! (2)
// ...
```

那么为什么会不同步呢？

因为Go的底层逻辑是跟一个复杂的调度器有关，因此go的执行顺序与代码内容无关

所以最后的time.Sleep就是在等待其他线程都执行完再结束主函数

那我们该怎么控制不同线程呢？这就是sync包会讲的内容

在此之前，先让我们认识一下Channel

# Channel
channel就是不同线程间传输数据的通道

![](/images/albums/blogAlbum/Go-并发：Go，Channel&sync包1.png)

这就涉及到了Go的设计哲学💡：
> **"不要通过共享内存来通信,而要通过通信来共享内存"**

这是Go并发编程的核心思想!

### 基本操作

```go
// 1. 创建 channel
ch := make(chan int)          // 无缓冲
buffered := make(chan int, 5) // 有缓冲(容量5)

// 2. 发送数据
ch <- 42

// 3. 接收数据
value := <-ch

// 4. 关闭 channel
close(ch)

// 5. 遍历 channel
for value := range ch {
    fmt.Println(value)
}
```

### 有/无缓冲
**无缓冲 Channel**:必须有人接收,发送才能成功

在无人接收时，Channel会阻塞当前节点（无法进行下一行内容），直到有人接收
```go
ch := make(chan int)  // 容量为0

go func() {
    ch <- 42  // 会阻塞,直到有人接收
    fmt.Println("发送成功")
}()

value := <-ch  // 接收,上面的发送才能完成
fmt.Println("收到:", value)
```
**有缓冲 Channel**:可以先放进去,后面再取
```go
ch := make(chan int, 3)  // 容量为3

// 可以连续发送3个,不会阻塞
ch <- 1
ch <- 2
ch <- 3
fmt.Println("发送了3个值")

// 后面再接收
fmt.Println(<-ch)  // 1
fmt.Println(<-ch)  // 2
fmt.Println(<-ch)  // 3
```

### 只接收/只发送
- `chan<- int`:只能发送的channel(防止你误接收)
- `<-chan int`:只能接收的channel(防止你误发送)
- 这是类型安全的保护!体现了Go"在编译期发现问题"的设计

# Select
select用于同时监听多个channel，用default实现非阻塞操作

在select内部可以包含多个channel case，哪个channel先准备好，哪个case就先执行
![](/images/albums/blogAlbum/Go-并发：Go，Channel&sync包2.png)

比如：超时控制：
```go
package main

import (
    "fmt"
    "time"
)

func fetchData(ch chan<- string) {
    time.Sleep(2 * time.Second)  // 模拟耗时操作
    ch <- "数据获取成功"
}

func main() {
    ch := make(chan string)

    go fetchData(ch)

    // 设置1秒超时
    select {
    case result := <-ch:
        fmt.Println(result)
    case <-time.After(1 * time.Second):
        fmt.Println("超时!操作耗时过长")
    }
}

// 输出: 超时!操作耗时过长
```
多重监听：
```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    quit := make(chan bool)

    // 1秒后发送
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "消息1"
    }()

    // 2秒后发送
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "消息2"
    }()

    // 3秒后发送退出信号
    go func() {
        time.Sleep(3 * time.Second)
        quit <- true
    }()

    // 持续监听
    for {
        select {
        case msg := <-ch1:
            fmt.Println("收到:", msg)
        case msg := <-ch2:
            fmt.Println("收到:", msg)
        case <-quit:
            fmt.Println("退出!")
            return
        }
    }
}

// 输出:
// 收到: 消息1
// 收到: 消息2
// 退出!
```
# sync包
包含多个方法控制线程：WaitGroup/Mutex/Once/RWMutex

**适用场景对比:**

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 传递数据 | Channel | Go 的设计哲学 |
| 等待一组任务完成 | sync.WaitGroup | 简单直接 |
| 保护共享资源 | sync.Mutex | 传统且高效 |
| 只读一次的配置 | sync.Once | 保证单次执行 |
| 高并发读多写少 | sync.RWMutex | 性能优化 |

## sync.WaitGroup
可以精确等待某线程执行完毕

可以通过此方法调控go并发的执行顺序

核心方法：
```go
var wg sync.WaitGroup // 创建WaitGroup实例

wg.Add(n)    // 计数器 +n (启动 goroutine 前调用)
wg.Done()    // 计数器 -1 (goroutine 结束时调用)
wg.Wait()    // 阻塞,直到计数器为 0
```
代码示例：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()  // 完成时通知 WaitGroup(推荐用defer)

    fmt.Printf("Worker %d 开始工作\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d 完成工作\n", id)
}

func main() {
    var wg sync.WaitGroup

    // 启动5个 worker
    for i := 1; i <= 5; i++ {
        wg.Add(1)  // 计数器 +1
        go worker(i, &wg)
    }

    wg.Wait()  // 阻塞,直到计数器归零
    fmt.Println("所有 worker 完成!")
}

// 输出(顺序可能不同):
// Worker 1 开始工作
// Worker 5 开始工作
// Worker 2 开始工作
// Worker 3 开始工作
// Worker 4 开始工作
// Worker 1 完成工作
// Worker 3 完成工作
// ...
// 所有 worker 完成!
```

## sync.Mutex
当多个 goroutine 同时修改同一个变量会出现**竞态条件**(race condition),导致结果错误!

于是，我们可以使用 `sync.Mutex` 互斥锁保护共享资源

`sync.Mutex` 可以保护数据同时只被一项进程读写：
![](/images/albums/blogAlbum/Go-并发：Go，Channel&sync包3.png)

核心方法：
```go
var mu sync.Mutex

mu.Lock()    // 加锁(阻塞,直到获得锁)
mu.Unlock()  // 解锁
```

基本使用：
```go
package main

import (
    "fmt"
    "sync"
)

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()         // 加锁
    c.count++           // 安全修改
    c.mu.Unlock()       // 解锁
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()         // 读取也要加锁
    defer c.mu.Unlock() // defer 确保一定会解锁
    return c.count
}

func main() {
    counter := SafeCounter{}
    var wg sync.WaitGroup

    // 1000 个 goroutine 同时累加
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }

    wg.Wait()
    fmt.Println("最终值:", counter.Value())  // 总是 1000(正确!)
}
```

## sync.RWMutex
我们知道`sync.Mutex` 不区分读和写,即使只是读取数据也要加锁,效率低

于是我们可以使用`RWMutex` 允许多个 goroutine 同时读,但写时独占

核心方法：
```go
var mu sync.RWMutex

// 读操作
mu.RLock()    // 加读锁(可以有多个)
mu.RUnlock()  // 释放读锁

// 写操作
mu.Lock()     // 加写锁(独占)
mu.Unlock()   // 释放写锁
```
基本使用：
```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Config struct {
    mu   sync.RWMutex
    data map[string]string
}

// 读配置(多个协程可以同时读)
func (c *Config) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.data[key]
}

// 写配置(独占,其他人不能读也不能写)
func (c *Config) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
    fmt.Printf("更新配置: %s = %s\n", key, value)
}

func main() {
    config := Config{
        data: map[string]string{
            "host": "localhost",
            "port": "8080",
        },
    }

    var wg sync.WaitGroup

    // 10 个协程读取配置(可以并发)
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            host := config.Get("host")
            fmt.Printf("协程 %d 读取: %s\n", id, host)
            time.Sleep(time.Millisecond * 100)
        }(i)
    }

    // 1 个协程更新配置
    wg.Add(1)
    go func() {
        defer wg.Done()
        time.Sleep(time.Millisecond * 50)
        config.Set("host", "127.0.0.1")
    }()

    wg.Wait()
}
```

## sync.Once
某些初始化操作(如加载配置、建立连接)只能执行一次

于是我们可以使用`sync.Once` 保证函数只执行一次,即使被多次调用也只执行一次

核心方法：
```go
var once sync.Once

once.Do(func() {
    // 这个函数只会执行一次
    // 即使 Do 被多次调用
})
```

基本使用：
```go
package main

import (
    "fmt"
    "sync"
)

var (
    instance *Database
    once     sync.Once
)

type Database struct {
    Connection string
}

// 单例模式:只初始化一次
func GetDatabase() *Database {
    once.Do(func() {
        fmt.Println("初始化数据库连接...")
        instance = &Database{
            Connection: "localhost:5432",
        }
    })
    return instance
}

func main() {
    var wg sync.WaitGroup

    // 10 个 goroutine 同时获取数据库实例
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            db := GetDatabase()
            fmt.Printf("协程 %d 获得实例: %p\n", id, db)
        }(i)
    }

    wg.Wait()
}

// 输出:
// 初始化数据库连接...  (只输出一次!)
// 协程 1 获得实例: 0xc0000a4000
// 协程 2 获得实例: 0xc0000a4000  (地址相同!)
// 协程 3 获得实例: 0xc0000a4000
// ...
```

## 总结
![](/images/albums/blogAlbum/Go-并发：Go，Channel&sync包4.png)