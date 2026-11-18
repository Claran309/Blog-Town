---
townId: go-usually
title: Go-常用包与函数
description: Go-常用包的汇总.
category: Golang
tags:
  - Golang
  - 后端
date: 2025-10-17
draft: false
cover: /assets/posts/covers/cover4.webp
coverAlt: Go-常用包与函数
---

## 自创包
字面意思，自己写包自己用(对外公开的接口/方法/结构体需大写)

例如，go中没有现成的栈和队列，于是我们可以自己搓一个

> 如果引入一个包时其设置了一个特殊`_`作为包名，那么这个包的引入方式就称为匿名引入
> 
> 一个包被匿名引入的目的主要是为了加载这个包，从而使得这个包中的资源得以初始化。
> 
> 被匿名引入的包中的`init`函数将被执行并且仅执行一遍。

### 队列
```go
package queue

type Queue struct {
	elements []interface{} //0永远为Top/Front
}

func (q *Queue) Push(item interface{}) {
	q.elements = append(q.elements, item)
}

func (q *Queue) Pop() {
	if !q.Empty() {
		q.elements = q.elements[1:] //delete top
	}
}

func (q *Queue) Front() interface{} {
	if q.Empty() {
		return nil //队列空返回nil
	}
	item := q.elements[0]
	return item
}

func (q *Queue) Empty() bool {
	return q.Size() == 0
}

func (q *Queue) Size() int {
	return len(q.elements)
}

func (q *Queue) Clear() {
	q.elements = make([]interface{}, 0)
}

```

## 栈

```package stack

type Stack struct {
	//切片储存栈元素，i=len(elements)为top
	elements []interface{}
}

func (s *Stack) Push(item interface{}) {
	s.elements = append(s.elements, item)
}

func (s *Stack) Pop() {
	if !s.Empty() {
		lastIdx := len(s.elements) - 1
		s.elements = s.elements[:lastIdx]
	}
}

func (s *Stack) Top() interface{} {
	if s.Empty() {
		return nil
	}
	return s.elements[len(s.elements)-1]
}

func (s *Stack) Empty() bool {
	return s.Size() == 0
}

func (s *Stack) Size() int {
	return len(s.elements)
}

func (s *Stack) Clear() {
	s.elements = make([]interface{}, 0)
}
```

注意，这样生成的结构体在其他包使用时需要遵循一下语法：

`var q queue.Queue`

前者为包名，后者为结构体名

## 生成随机数
包含包：

```go
import (
    "fmt"
    "math/rand"//rand函数
    "time"//产生时间刻
)
```

详细方法：

```go
rend.Seed(time.Now().UnixNano())//用系统时间刻设置随机数种子
randNum := rand.Intn(100)//生成范围0～100的随机数
fmt.Println(randNum)//打印随机数
```

## 任意大整数
包：`"math/big"`

该类型值不能用常规运算符计算，只能用自带方法

+ `big.Int()` 一种数据类型，表示任意大整数
+ big.NewInt() 创建*big.Int (from int64)
+ .Add(x,y) x+y
+ .Sub(x,y) x-y
+ .Mul(x,y) x*y
+ .Quo(x,y) x/y
+ .Rem(x,y) x%y
+ x.Cmp(y) return -1(x<y) : 0(x==y) : 1(x>y)
+ z.Set(x) z = x且为big.Int 

> 注意：为节省空间，big.Int一般用指针方法接收
>
> 因此，big.NewInt(x)返回的值为*big.Int()
>

## time包(时间获取)

### 基础时间获取
```go
import "time"
import "fmt"
func main() {
    now := time.Now() // 获取当前时间
    fmt.Println(now) // 打印完整时间
    fmt.Println(now.Year()) // 年份
    fmt.Println(now.Month()) // 月份
    fmt.Println(now.Day()) // 日期
    fmt.Println(now.Hour()) // 小时
    fmt.Println(now.Minute()) // 分钟
    fmt.Println(now.Second()) // 秒数
    tomorrow := now.Add(24 * time.Hour) // 当前时间加24小时（明天）
    fmt.Println(tomorrow)
    format := "2006-01-02 15:04:05" // 固定格式（Go的参考时间）
    fmt.Println(now.Format(format)) // 格式化输出
}
```
### 时间戳
时间戳是自1970年1月1日（08:00:00GMT）至当前时间的总毫秒数

它也被称为Unix时间戳（UnixTimestamp）
```go
func timestampDemo() {
    now := time.Now()            //获取当前时间
    timestamp1 := now.Unix()     //时间戳
    timestamp2 := now.UnixNano() //纳秒时间戳
    fmt.Printf("current timestamp1:%v\n", timestamp1)
    fmt.Printf("current timestamp2:%v\n", timestamp2)
}
```
> 使用time.Unix()函数可以将时间戳转为时间格式

### 时间间隔
time.Duration是time包定义的一个类型，它代表两个时间点之间经过的时间，以纳秒为单位

### 时间操作

#### Add
时间+时间间隔

方法签名：`func (t Time) Add(d Duration) Time`

eg:`later := now.Add(time.Hour) // 当前时间加1小时后的时间`

#### Sub
求两个时间之间的差值：

    func (t Time) Sub(u Time) Duration

返回一个时间段t-u(Duration)

> 要获取时间点t-d（d为Duration），可以使用`t.Add(-d)`

#### Equal
    func (t Time) Equal(u Time) bool
判断两个时间是否相同，会考虑时区的影响，因此不同时区标准的时间也可以正确比较。

#### Before
    func (t Time) Before(u Time) bool
如果t代表的时间点在u之前，返回真；否则返回假。
### 定时器
使用time.Tick(时间间隔)来设置定时器，定时器的本质上是一个通道（channel）。
```go
func tickDemo() {
    ticker := time.Tick(time.Second) //定义一个1秒间隔的定时器
    for i := range ticker {
        fmt.Println(i)//每秒都会执行的任务
    }
}
```
## strconv包
```go
import "strconv"
import "log"
import "fmt"
func main() {
    s := "10"
 // 字符串转整数
    i, err := strconv.Atoi(s)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(i) // 输出 10
    // 字符串转64位浮点数
    f, err := strconv.ParseFloat(s, 64)
    if err != nil {
        log.Fatal(err)
     }
    fmt.Println(f) // 输出 10.0
    // 字符串转布尔值（"1"→true，"0"→false，其他报错）
    b, err := strconv.ParseBool("1")
    if err != nil {
        log.Fatal(err)
	}
    fmt.Println(b) // 输出 true
    // 整数转字符串
    s = strconv.Itoa(i)
    fmt.Println(s) // 输出 "10"
     // 浮点数转字符串（格式'f'=十进制，精度2）
    s = strconv.FormatFloat(f, 'f', 2, 64)
     fmt.Println(s) // 输出 "10.00"
    // 布尔值转字符串
     s = strconv.FormatBool(b)
    fmt.Println(s) // 输出 "true"
}
```

## container
占位

## math
占位

## reflect
占位

## IO & bufio
占位

## os
占位

## sync
见：**[My Blog](https://www.claran-blog.work/2025/10/27/Go-%E5%B9%B6%E5%8F%91%EF%BC%9AGo%EF%BC%8CChannel-sync%E5%8C%85/)**

## http & Gin
见：**[My Blog](https://www.claran-blog.work/2025/10/29/Go-Web%EF%BC%9A%E8%AE%A1%E7%BD%91%EF%BC%8Chttp%EF%BC%8CJSON%E5%92%8CGin%E6%A1%86%E6%9E%B6/)**