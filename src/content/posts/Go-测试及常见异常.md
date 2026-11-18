---
townId: go-test
title: 项目实践中的测试与常见异常
description: Go的测试代码和常见异常学习.
category: Golang
series: "Go 工程实践"
seriesIndex: 1
tags:
  - Golang
  - 后端
date: 2025-10-24
draft: false
cover: /assets/posts/covers/cover15.webp
coverAlt: 项目实践中的测试与常见异常
---
# 测试（Testing）
测试，顾名思义就是对于已有程序/项目的测试/检验

测试分为以下三类：

- 功能测试（test）
- 基准测试（benchmark，也称性能测试）
- 示例测试（example）

> 编写测试文件，我们会用到 `"testint"` 包

## 功能测试：
测试某函数/方法是否正常工作

### 基本写法
以测试函数(a+b)为例：
```go
func TestAdd(t *testing.T) { // t 就是 *testing.T 类型
    result := Add(2, 3)
    if result != 5 {
        // 调用 T 的方法来报告测试失败
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}
```

### testing.T 结构体的主要方法
| 方法 | 作用 | 是否停止测试 |
|------|------|-------------|
| `Errorf(format string, args...)` | 记录错误并继续执行 | 否 |
| `Fatalf(format string, args...)` | 记录错误并立即停止 | 是 |
| `Logf(format string, args...)` | 记录日志信息 | 否 |
| `Fail()` | 标记失败但继续执行 | 否 |
| `FailNow()` | 标记失败并立即停止 | 是 |
| `SkipNow()` | 跳过当前测试 | 是 |
| `Run(name string, f func(t *T))` | 运行子测试 | - |

## 基准测试 (Benchmark Testing)

用于衡量代码的性能，比如运行时间和内存分配情况

### 基本写法
```go
// calculator_test.go
package main

import "testing"

func BenchmarkAdd(b *testing.B) {
for i := 0; i < b.N; i++ {
Add(1, 2)
}
}

func BenchmarkAddWithSetup(b *testing.B) {
// 准备工作
b.ResetTimer() // 重置计时器
for i := 0; i < b.N; i++ {
Add(1, 2)
}
b.StopTimer()
// 清理工作
}
```

### testing.B 结构体的专属方法
| 方法 | 作用 |
|------|------|
| `ResetTimer()` | 重置基准测试计时器 |
| `StartTimer()` | 开始计时 |
| `StopTimer()` | 停止计时 |
| `ReportAllocs()` | 报告内存分配统计 |
| `SetBytes(n int64)` | 设置单次操作处理的字节数 |

**注意**: `testing.B` 继承了 `testing.T` 的所有方法。

## 示例测试 (Example Testing)

### 基本写法

```go
// calculator_test.go
package main

import "fmt"

func ExampleAdd() {
sum := Add(1, 2)
fmt.Println(sum)
// Output: 3
}

func ExampleAdd_negativeNumbers() {
sum := Add(-5, -3)
fmt.Println(sum)
// Output: -8
}
```

### 示例测试的特点
- 不需要 `testing.T` 或 `testing.B` 参数
- 函数名必须以 `Example` 开头
- 必须包含 `// Output:` 注释来验证输出
- 输出会被严格匹配验证

## 测试文件组织

### 文件命名约定
- 测试文件: `原文件名_test.go`
- 包名: 通常与源文件相同（也可用 `包名_test`）

## 运行测试的命令

-  运行所有测试: 
go test

- 显示详细输出:
go test -v

- 运行基准测试:
go test -bench=.

- 显示内存分配信息:
go test -bench=. -benchmem

- 运行特定测试:
go test -run TestAdd

- 测试覆盖率:
go test -cover

- 生成覆盖率报告:
go test -coverprofile=coverage.out
go tool cover -html=coverage.out
%%

## 总结对比表

| 测试类型 | 函数前缀 | 参数 | 主要用途 | 验证方式 |
|---------|----------|------|----------|----------|
| 功能测试 | `Test` | `*testing.T` | 验证逻辑正确性 | 断言检查 |
| 基准测试 | `Benchmark` | `*testing.B` | 测量性能指标 | 循环计时 |
| 示例测试 | `Example` | 无 | 提供可执行文档 | 输出匹配 |

# 常见异常（Error）
防御性编程：预见可能会出现的panic并在其出现前避免 (例如：检查指针是否为nil)
## 主动判断异常
```go
//返回两个值:结果+错误信息
func divide(a,bfloat64) (float64,error){
	if b == 0{
		return 0, fmt.Errorf("除数不能为0")
    }
    return a/b, nil// nil 表示没有错误
}
```
## 空指针解引用
尝试通过空指针访问其指向的值将导致运行时错误（panic），因此在使用空指针之前，
通常需要检查它是否为nil，否则会出现空指针异常
```go
func main() {
    var p *int = nil // 声明一个指向int类型的空指针

    // 尝试通过空指针p访问其指向的值，这将导致运行时panic
    // 因为p是空指针，没有指向任何有效的内存地址
    fmt.Println(*p) // 这里会发生空指针异常
}
```

## 索引越界
基本上是最常见的一种异常了，就是访问 数组/切片/映射 索引 不存在/越界 的情况发生的异常
```go
func main(){
	slice := make([]int,3)
	slice[4] = 0// 索引越界
}
```

## 类型断言失败
顾名思义，就是对空接口存储的值未类型断言或类型断言失败导致的数据类型不匹配而Panic
```go
type Stack struct{
	elements []interface{}
}

func (s *Stack) Push(item interface{}) {
    s.elements = append(s.elements, item)
}

func (s *Stack) Top() interface{} {
    if s.Empty() {
        return nil
    }
    return s.elements[len(s.elements)-1]
}

func main(){
	var s Stack
	s.Push(float64(3.14))
	value := s.Top().(rune) // 类型断言失败 - Panic
	// 应使用安全断言：
	value, ok := s.Top().(rune)
	if(ok != nil){
		...
    }
}
```

