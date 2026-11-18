---
townId: java-basic
title: Java-基础语法知识
description: Java基础语法知识的学习.
category: 其他语言
series: "Java 入门"
seriesIndex: 0
tags:
  - 杂项
  - 其他语言
date: 2025-10-16
draft: false
cover: /assets/posts/covers/cover18.webp
coverAlt: Java-基础语法知识
---

## 头文件（包）的声明：import
`import java.util......`

---



## java 基本框架：
```java
public class Main {
    public static void main(String[] args){
        ...
    }    
}
```

---



## 变量
注：Java的变量在**使用前要初始化**，否则会报错！

---



## 输入：Scanner
所在包 `import java.util.Scanner`

用法：

```java
Scannner scan = new Scanner(System.in);
int n = scan.nextInt();//nextInt()方法会从读入流中读取一个整数
scan.close;
```

读入流类型

+ nextInt()：整形
+ nextByte()：byte型
+ nextShort()：short型
+ nextLong()：long型
+ nextFloat()：float型
+ nextDouble()：double型
+ next()：读入一个字符串，直到'\0'
+ nextLine()：读入一整行字符串，直到'\n'

> 注：next()后直接继续使用nextLine()回到是后者返回NULL，徐涛需要手动额外调动一次nextLine()以清除换行符
>

---



## 输出：Print
用法：

```java
System.out.Print("字符串1"+a+"字符串2");
System.out.Println("Auto \n");
System.out.Printf("数字之和为%d，a = %d，b = %d",sum,a,b);
```

特殊字面量：

`%t //制表符，在打印时将前面字符串的长度补齐到8或8的整数倍`

---



## for/if/else/while/函数/return
与C++类似

---



## 数组 (存在重点差异)
```java
int[] a = {0}; //声明一个长度为1、初始值为0的数组
int[] a = new int[5] // 声明一个长度为5、已初始化（初始值为0）的数组
```

