---
townId: java-class
title: Java-面向对象与类
description: Java中面向对象与类的学习.
category: 其他语言
series: "Java 入门"
seriesIndex: 1
tags:
  - 杂项
  - 其他语言
date: 2025-10-17
draft: false
cover: /assets/posts/covers/cover20.webp
coverAlt: Java-面向对象与类
---
# Part.1 基础
## 面向对象&面相过程
### 面向对象
#### 定义
把数据及数据的操作方法放在一起，作为一个相互依存的整体——对象。也就是把一个物体相关的信息全部放在一个整体的容器中。

#### 三大特性
1. 封装：把对象的构造方法/方法/变量等数据存在类中，并选择暴露可供调用的接口以允许外界进行相应操作，而为暴露的内容则会自我隐藏，外部代码不能直接访问或修改内部数据
2. 继承：可在一个类外定义其子类，子类自动拥有父类的属性或方法，并可拓展子类特有的内容。
3. 多态：对于同名方法/属性，可创造其不同的特殊内容

### 面向过程
#### 定义
把事件裁缝为几个步骤，并将其按照一定的顺序执行

### 面向对象和面向过程的区别
以洗衣服为例：



**面向对象**be like：

创建对象 "人"&"洗衣机"

在"人"中创建方法：人.放衣服、人.加洗衣液、人.取衣服

在"洗衣机"中创建方法：洗衣机.启动、洗衣机.甩干、洗衣机.停止

执行：人.放衣服 -> 人.加洗衣液 -> 洗衣机.启动 -> 洗衣机.甩干 -> 洗衣机.停止 -> 人.取衣服



**面相过程**be like：

创建函数：洗衣服、放衣服、加洗衣液、拿衣服

执行：放衣服 -> 加洗衣液 -> 洗衣服 -> 拿衣服



这样看起来，面相过程不是更加简单吗？

那如果现在要让用户额外写一个 洗衣机自清洁 的功能呢？

面向过程就需要结合全局函数变量，重新写一个洗衣机自清洁的函数

但是面相过程只需要在"洗衣机"类中额外拓展一个方法：洗衣机.自清洁即可



由此，我们便可总结二者的差别优劣：

| |                             面向对象 |                             面相过程 |
| --- | --- | --- |
|     思路 |       自内而外 |       自上而下 |
|  程序单元 |    对象 |    函数 |
|  设计过程 |    程序=对象=方法+数据 |            函数=功能=算法+数据 |
|     优点 |     使用便携、易于维护、易拓展 |         独立化、性能高 |
|     缺点 |    性能相对更低 |                        修改、维护困难 |




由此，我们正式进入面向对象

---

## Java中的类与对象
科普：命名习惯：

类名首字母大写，后续单词首字母大写

变量/方法首字母小写，后续单词字母大写

### 类/方法的声明/使用
声明格式：

```java
public class FightingRound { //注：类名一定要与文件名保持一致！
    private String bossName;
    private int bossHealth;
    private int atk;// 成员变量

    public void attack(){// 成员方法1
        bossHealth -= atk;
        System.out.printf("你对Boss造成了%d点伤害！",atk);
        if(bossHealth <= 0) this.end();// 调用成员方法2
    }

    public void end(){// 成员方法2
        System.out.printf("你打败了Boss!");
    }
}
```

### 对象的声明/使用
对象的声明：【 FightingRound bossFight = new FightingRound(); 】

声明变量相当于声明一个struct的数据类型，类型为类Fightinground

### 方法的调用
```java
FightingRound bossFight = new FightingRound();

bossFight.bossName = "Mon3tr";
bossFight.bossHeath = 100;
bossFight.atk = 30;

for(int i = 1;i <= 4;i++)
    bossFight.attack();
```

> 注：吃醋的bossFight本质上保存的并非具体的值，二十指向保存着这些值的地址
>

### 匿名对象
即不直接创建对象便调用方法的操作：

```java
System.out.printf("你遭遇了Boss！但是它很虚弱，你可以一击秒杀它！\n");
new FightingRound.end();
```

这种方法可以让我们在调用方法后迅速回收内存，提升程序运行效率

### 访问修饰符
即【private】【default】【protect】【public】

用来修饰变量/方法/类等数据的访问权限的修饰符

以下为以上访问修饰符的区别：

| 访问修饰符 | 本类 | 同包 | 子类 | 不同包 |
| --- | --- | --- | --- | --- |
| private | ✓ | | | |
| default | ✓ | ✓ | | |
| protect | ✓ | ✓ | ✓ | |
| public | ✓ | ✓ | ✓ | ✓ |


### 构造方法
在初始化对象的同时给对象的属性赋值

格式为

```java
class 类名称{
    访问修饰符 类名称(数据类型 参数...){
        ... //构造方法是没有返回值的！
    }
}
```

eg.

```java
public class FightingRound { 
    private String bossName;
    private int bossHealth;
    private int atk;
    public FightingRound{// 构造方法的名称必须与类名称一致！
        System.out.printf("对象建立成功\n");
    }
    public FightingRound(String bossName,int bossHealth,int atk){// 构造方法的名称必须与类名称一致！
        this();
        this.bossName = bossName;
        this.bossHealth = bossHealth;
        this.atk = atk;// 构造方法无返回值！
    }
    
    public void attack(){
        bossHealth -= atk;
        System.out.printf("你对Boss造成了%d点伤害！",atk);
        if(bossHealth <= 0) this.end();
    }

    public void end(){
        System.out.printf("你打败了Boss!");
    }
}
```

像这样子建立一个构造方法，在后许对象的创建时就能直接给对象赋值：

```java
FightingRound bossFight = new FightingRound("Mon3tr",100,30);

bossFight.attack();
...
```

### this
上述代码中存在没学过的关键词：this

this：是对自身对象的一个地址引用，即指自身

使用意义：

1. 一般情况下，在函数参数或函数中的局部变量和成员变量**同名**的情况下，成员变量会被局部变量或参数覆盖屏蔽，此时若要访问成员变量，这可以用【 this.成员变量名 】的方式引用成员变量，即引用被屏蔽的上级变量。
2. 在函数中，需要引用改行书所属类的当前对象是，使用this实现
3. 类内部之间可以互相调用，构造方法也是一样。使用this调用另一个构造方法，使用【this(参数列表)】实现。注意，使用该语法时，【this(参数列表);】必须被放置在第一行，否则就会报错。

```java
private String bossName;
    private int bossHealth;
    private int atk;
    public FightingRound{// 构造方法1
        System.out.printf("对象建立成功\n");
    }
    public FightingRound(String bossName,int bossHealth,int atk){// 构造方法2
        this();// 调用 构造方法1
        this.bossName = bossName;// 访问外部变量，即外部的bossName = 参数的bossName
        this.bossHealth = bossHealth;// 访问外部变量，同上
        this.atk = atk;// 构造方法无返回值！
    }
```

### 方法重载
即可以定义两个同名的方法，通过在方法定义是添加不同函数参数，来实现同名方法的不同调用方法

eg：

```java
public void end(){
    System.out.printf("你打败了Boss!\n");
}
public void end(int atk){
    System.out.printf("你打败了Boss，终结一击为%d伤害！\n",atk);
}
```

这样定义两个同名方法，在后续调用时通过添加不同的参数列表达到方法的不同调用，就叫做方法重载

```java
bossFight.end();
bossFight.end(30);
```

运行结果为：

> 你打败了Boss！
>
>你打败了Boss！终结一击为30伤害！


> 注意：返回值不会算成判断方法重载的要素
>



