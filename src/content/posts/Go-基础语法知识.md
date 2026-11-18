---
townId: go-basic
title: Go-基础语法知识
description: Golang语言的基础语法学习.
category: Golang
series: "Go 语言基础"
seriesIndex: 0
tags:
  - Golang
  - 后端
date: 2025-10-16
draft: false
cover: /assets/posts/covers/cover9.webp
coverAlt: Go-基础语法知识
---

推荐学习网站：[菜鸟教程](https://www.cainiaojc.com/golang/golang-tutorial.html)



注：golang**不用打分号**！！！

另：当变量/类型/函数名等标识符以大写字符开头，则该标识符对外部可见（即Java中的public），否则对外不可见

## 头文件（包）的声明：imort
```go
import "fmt" //基础包
import (
    "fmt"
    "..."
)
```

---



## 基础框架
```go
package main

import (
    "fmt"
)

func main(){
    ...
}
```

## 输入/输出
在go中，输入输出所在包为** fmt 基础包**

注：Print/Scan 首字母**需要大写**！

### 输出
 **%v 以默认格式打印值，打印任意类型的变量的值**

%+v:结构体时会显示字段名和值

%#v:值的Go语法表示

```go
fmt.Print("There have ",num," numbers")
fmt.Println("Auto \0")
fmt.Printf("%d + $d = %d",a,b,a+b)
```

### 输入
```go
fmt.Scan(&a,&b)
fmt.Scanf("%d %c",&a,&c)
```

---

## 常量
const同C，替代var

### inta：在const内自动逐行计数
```go
package main

import "fmt"

func main() {
    const (
            a = iota   //0
            b          //1
            c          //2
            d = "ha"   //独立值，iota += 1
            e          //"ha"   iota += 1
            f = 100    //iota +=1
            g          //100  iota +=1
            h = iota   //7,恢复计数
            i          //8
    )
    fmt.Println(a,b,c,d,e,f,g,h,i)
}
```



## 声明变量
注意：未使用过的变量会导致编译错误（全局变量除外）

在Go中，未初始化的变量会自动赋初始值（默认为"零值"）

int32 = int

int64 = long long

Go中有多种声明变量的方式：

```go
var 变量名称 数据类型
变量名称 := 值

eg:
var a int = 1;
a := [4]int{1,2,3,4}
a := 4;
sum := a+b;

var (
    n int
    b bool
    num float32
)
```

---



## 函数
函数的声明：

```go
func 数据名称(参数)(返回类型){
    return 返回值
}
```

注意，同一函数**返回多个值**是合法的：

```go
func swap(x,y string)(string string){
    return y,x
}
```
### 可变参数函数
在不确定会传入多少个参数时使用：
```go
func sum(numbers ...int)int{
    ...	
}
```
> numbers ... int实际上是个[]int切片
> 
> 同时 ... 还可以用来展开切片：
> 
> 存在num切片，使用sum(num...)即可全部累加
### 构造函数与工厂函数
用于标准化构造结构体或其他自定义结构的函数
```go
func NewPerson(name string, age int) *Person {
	return &Person{Name: name, Age: age}
}
```

---

## 函数一等公民
<font style="color:rgb(51, 51, 51);">函数是一等公民是指函数在语言中具有与其他数据类型（如数字、字符串等）相同的地位</font>

<font style="color:rgb(51, 51, 51);">也就是说，函数可以被当做一种数据类型而被用作赋值、参数传递、返回值。</font>

```go
   
// 定义一个函数类型
type mathOperation func(int, int) int// 这个类型可以表示任何参数为(int, int) 且返回值为int的函数

// 一个普通的加法函数
func add(a, b int) int {
    return a + b
}

// 一个函数，接受另一个函数作为参数
func calculate(op func(int, int) int, a, b int) int { // 添加一个函数参数，该函数餐位数的参数为(int, int)且返回值为int
    return op(a, b)// 返回执行该参数函数后的值
}

// 一个函数返回另一个函数
func getMultiplier() mathOperation {// 返回值为(int, int) int类型的函数
    return func(a, b int) int {// 返回功能为两数相乘的函数
        return a * b
    }
}

func main() {
    // 将函数赋值给变量
    var operation mathOperation // 定义一个(int, int) int类函数
    operation = add // 该函数被赋予add的内容

    // 调用函数
    result := operation(3, 4) // result := add(3, 4)
    fmt.Println("3 + 4 =", result)

    // 将函数作为参数传递给另一个函数
    result = calculate(add, 5, 6) //在calculate中，返回值为add(5, 6);故result = add(5, 6)
    fmt.Println("5 + 6 =", result)

    // 将函数作为返回值
    multiplier := getMultiplier() // multiplier = unc(int,a b int) int{ return a*b }
    result = multiplier(3, 7)// result = 3*7
    fmt.Println("3 * 7 =", result)
}
```

---



## for/gota/if/defer/switch
### for
区别于C++，在Go中，for/if**不需要括号**框入三段式，且省略三段式时可省略分号：

```go
for i := 1;i <= n;i++ {
    fmt.Print(i)
    ...
}

for sum <= n {
    sum++
    ...
}
```

另外，for循环的range形式可遍历切片或映射

当使用for循环遍历切片时，每次迭代都会返回两个值：**第一个值为当前元素的下标，第二个值为改下表所对应的元素的一份副本**

```go
var num = []int{1,2,4,8,16,32,64,128}

for i, v := range num {
    fmt.Println("i=",i" v=",v)
}
```

同时，可以将下标或值写为_以忽略它

`for i, _ := range a`

`for _, value := range a`

若只需要下标，忽略第二个变量即可

`for i := range pow`

### gota
通过定义标签，跳转到被标记的区域 （尽在同一函数内有用）

```go
package main

import "fmt"

func main() {
    i := 0

Loop: // 定义标签
    fmt.Println(i)
    i++
    if i < 5 {
        goto Loop // 跳转到 Loop 标签
    }
}
```

### if
同时，if语句可以在条件表达式前**执行一个简短短语**（该语句声明的变量作用域仅在 if / else 之内）：

```go
if tmp := i*j;tmp <= max {
    tmp+=cnt
    ...
}
```

### defer
defer语句会将函数推迟到外层函数返回之后执行：

```go
func main(){
    defer fmt.Print(" world!")
    fmt.Print("Hello")
}
//输出:Hello world!
```

注：被推迟调用的函数会被压入一个栈中

defer 常见的使用就是在函数结束后执行一些收尾工作，比如我们在打开文件之后，在程序结束的时候需要关闭这个文件，以及在我们创建一个临时管道的时候需要在函数退出的时候能够及时关闭这个管道。
另外 defer 也是一个比较常考的八股文，比如，在以下两个函数中，函数的返回值会是什么呢？为什么会有区别，这就涉及到 defer 和 return 的执行过程：
```
package main

import "fmt"

func returnValue1() int {
a := 1
defer func() {
a += 1
}()
return a
}

func returnValue2() (a int) {
a = 1
defer func() {
a += 1
}()

        return a
}

func main() {
fmt.Println(returnValue1()) // 1
fmt.Println(returnValue2()) // 2
}
```
在 return 的时候，如果函数签名没有定义返回的变量，那就会定义一个临时变量，或者说帮你填充了一个你不知道的变量名，然后将返回的数据赋予这个临时变量，如果你已经定义好了变量名，那就将返回的数据赋予给这个定义的变量；第二步，我们会执行 defer 的操作；最后，我们真正将这个临时变量/已经定义的变量返回回去。
也就是说，我们在函数签名已经定义好了变量名的时候，在最后会将这个变量名的值返回，如果没有，那么就会首先定义一个临时变量，然后赋予它返回值，再执行 defer 的函数，最后将这个临时变量返回。
大概是这样的：
```go
// 如果定义了返回值变量名
a = 返回的数据
defer xxxx // 此时对 a 执行修改操作会反馈到 return 值上面
return a

// 如果没有定义变量名
tmp := a
defer xxx // 此时如果对 a 进行修改无法反馈到 tmp 上面
return tmp
```
简单来说分为三步，就是赋值，执行defer，返回值。

### switch
处理多分支情况

> fallthrough<font style="color:rgb(51, 51, 51);">可以在匹配一条 case 之后，继续执行后面的 case </font>
>

```go
t := time.Now()
	switch {
	// 根据现在的时间判断是上午还是下午
	case t.Hour() < 12:
		fmt.Println("It's before noon")
	default:
		fmt.Println("It's after noon")
	}
```

---



## 指针
仅与C++不同的是，Go无法进行指针运算

> 注：Go语言对结构体指针提供了语法糖，即可以直接通过指针访问字段，而不用再显示解引用
>

```go
//传统指针（如C）
(*target).Heath = 50

//go
target.Health = 50
```

---



## 结构体
与C++仅声明格式不同：

```go
type student struct {
    height int
    weight int
    score int
    name string
}
```

---

## 字符
go中没有像c++中的char数据类型，与之相对的，go中有byte和rune两种数据类型

1. byte：用于存储ASCII中的字符
2. rune：用于存储任意Unicode字符

---

## 字符串
仅与C++不同的是，Go中字符串（直接声明的string）具有**不可变性**（内容不可修改）

另外，在`"strings"`包中，存在若干便携的字符串函数：

```go
information := []string{"06072504","2025212533","Claran"}//创建一个字符串切片
result1 := strings.Join(information,"-")//字符串result1为由各字符串合成的单个字符串，以'-'链接
...
```

### String & Stringf (fmt)
```go
// 字符串生成
 s1 := fmt.Sprint(x, y, z)
 fmt.Println(s1) // 输出 "10 3.14 Hello"
 s2 := fmt.Sprintf("x=%d, y=%.2f, z=%s", x, y, z)
 fmt.Println(s2) // 输出 "x=10, y=3.14, z=Hello
```

---



## 数组/切片
### 数组
数组声明格式：`var a [10]int`  10不能为变量，但是可以为 ... 代替不确定长度的数组长度

注意：Go语言中，数组的大小是类我，因此不同大小的数组是不兼容的。

    Go的数组不能随意改变大小，因此Go有其独特的功能：**切片**

```go
var a = [...]int{1,2,3,4,5}

b := [4]int{1:2,3:4}
```

### 切片
类型 []T表示一个元素类型为T的切片，切片可以包含各种类型，包括其他切片。

切片通过两个下标来界定：**上界与下界** 

`a[low : high]`

切片会选出一个区间，包含上界元素，但不包含下界元素

因此 `a[1:4]`实际包含了数组a[1]到a[3]的值

在进行切片时，可以忽略上下界。此时，被忽略的上下界分别默认为0和其底层数组长度n

另外，切片可以被声明为nil，即零值，此时其底层数组不存在，直到向其中添加值

```go
var a []int//创建一个空切片
base [101]int
b ;= base[0:51]//创建一个含base[0]到base[50]的切片
c := base[:51]//与上句意义相同
```

此外，切片含3项结构：

+ **指针(ptr)**
+ **长度(len) **- 切片含数量
+ **容量(cap) -** 底层数组容量

### 切片的操作
#### make
格式：`make(数据类型,len,cap)`

make函数为Go内置函数，可以用来**直接创建切片**--make函数会分配一个元素为零值的数组并返回一个引用了它的切片：

```go
a := make([]int, 5) // len(a)=5
b := make([]int, 0 , 5) // len(b)=0,cap(b)=5

b = b[:cap(b)] //len(b)=0 -> 5
b = b[1:] //len(b)=5 -> 4  cap(b)=5 -> 4
```

#### append
格式：`append(切片名称 , 添加元素1 , ... )`

append函数为Go的内置函数，可以用来**为切片追加新的元素**。但被添加切片的底层数组太小，它就会被分配一个更大的数组。返回的切片会指向这个新分配的数组

```go
var s []int

s = append(s,0)//可在空切片上添加
s = append(s,1)
s = append(s,2,3,4)//可以一次性添加多个元素
```

#### len/cap
len()函数可以获取切片长度

cap()函数可以获取切片容量

#### copy
copy可用于拷贝切片

```go
copy(slice1,slice2)//拷贝slice2的内容到silce1
```

## range
用于for循环中迭代数组、字符串、切片、channel或map

range在数组和切片中返回两个值：下标和对应值或只返回下标；在集合map中返回Key-value对

> 使用 _ 来忽略索引或值
>

例如：

```go
a := [6]int{0,1,2,3,4,5}
for i, j := range a {// 若只有i则只返回下标
    fmt.Print(i," ",j)// i返回下标，j返回a[i]
}
```

## map
与C++类似，map是一种无序的 索引-值 的集合

使用make或字面量来创建map

```go
m := make(map[byte]int)// 创建ACSII map
m := map[byte]int{
    'A' = 65,
    ...
    'a' = 97,
    ...
} // 另一种创建方式
m['a'] = 97
...
m['A'] = 65
...

fmt.Print(m['f'])// 查询m对应的ASCII码
```

获取元素：

`v, b := m[a] // 如果键不存在，则b的值为false，v2为零值`

len、range同样对map适用

使用delete删除键值对：

`delete(m,"a")`

## 强制数制转换
> go不支持隐式类型转换
>

格式：`float32(6)`

### strconv
使用 strconv.Atoi() 函数，可以自动解析字符串中的数字字符并返回相应整形

相反 strconv.Itoa() 函数，可以将整形转换为字符串

```go
str := "123"
var num int
num, _ = strconv.Atoi(str)// num = 123, _用于忽略strconv返回的错误
var s string
s, _ = strconv.Itoa(num) // s = "123"
```

更多的strconv系列函数：

+ strconv.ParseFloat(str, 64)         %s -> %f
+ strconv.FormatFloat(f, 'f', 2/*精度*/, 64)     %f -> %s

