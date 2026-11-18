---
townId: go-interface
title: Go的“面向对象”-接口与相关思想
description: Go中关于接口的使用和思想.
category: Golang
series: "Go 语言基础"
seriesIndex: 2
tags:
  - Golang
  - 后端
date: 2025-10-20
draft: false
cover: /assets/posts/covers/cover13.webp
coverAlt: Go的“面向对象”-接口与相关思想
---
# 接口（interface）
接口是一组方法签名的集合，定义了类型应实现的行为。实现是隐式的：只要类型具有接口所需方法，就实现
该接口。

### 定义格式
```go
type 接口名 interface {
     Method1(arg T) R
     Method2() error
}
```

**例如**

```go
type Stringer interface {
    String() string
}

func Print(s Stringer) {
    fmt.Println(s.String())
}

type Person struct { Name string }

func (p Person) String() string { return p.Name }

Print(Person{Name: "Tom"}) // Person 隐式实现 Stringer
```

# 接口与面向对象
Go的面向对象包含三大要素：接口、方法、结构体

定制接口 - 接口要求方法 - 存在方法满足接口要求 - struct存储信息 - 调用接口

方法需要结构体作为接受者，也就是结构体与方法是“封装”一步的关键

如图
![](/images/albums/blogAlbum/Go-接口与面向对象1.jpg)


多接口![](/images/albums/blogAlbum/Go-接口与面向对象2.jpg)

代码实现
```go
type 接口名 interface {// 定义一个接口
    方法名(参数) 返回值(方法类型) // 创建接口要求方法，满足所用方法即调用接口
    ...
}

type 结构体名 struct {// 根据设计意图进行变量封装
    ...
}

func (结构体变量名 结构体名/*方法接收器，定义方法操作的对象*/) 方法名(参数) 返回值{//定义满足要求方法的方法
    ... //方法实现过程
}
```


## 多态
通过用不同类型实现同一接口，可以实现接口的多态表现
## 解耦
通过接口定义依赖关系，降低模块之间的耦合

区别于Java类OOP式面向对象的Is-a关系，Go的Can-do关系不要求强制存在父类、子类和方法之间的访问修饰符定义等强耦合关系

## 泛化
使用空借口interface{}可表示任意类型

## 空接口
空接口 interface{} 可以表示任何类型
```go
var x interface{}
x = 123
x = "hello
```

## 类型断言与类型选择

- 类型断言获取具体类型或判断类型：
```go
var v interface{} = "abc"
s := v.(string) // 断言，若失败会 panic
s, ok := v.(string) // 安全断言
```
- 类型开关：
```go
switch t := v.(type) {
case int:
    // t 是 int
case string:
    // t 是 string
default:
}
```

# 泛型（any）

与空接口类似，可以表示任何类型

不同的是，空接口在编译时容易发生类型安全错误，需要频繁类型断言

而泛型any会自动保证编译时类型安全，编译器会为每个使用的具体类型生成一份特化代码

拓展知识之后会逐渐接触