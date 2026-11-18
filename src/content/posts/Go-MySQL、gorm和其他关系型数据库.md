---
townId: go-sql
title: 走进MySQL、gorm和其他关系型数据库
description: 学习数据库SQL操作及Gorm包.
category: Golang
tags:
  - Golang
  - 后端
  - 数据库
date: 2025-11-13
draft: false
cover: /assets/posts/covers/cover12.webp
coverAlt: 走进MySQL、gorm和其他关系型数据库
---
# 数据库

## 📚 数据库核心概念

### 数据库定义
数据库是用于**长期保存数据、高并发访问数据、快速查询数据**的系统，是后端的核心基础设施。

### 数据库五大特性
- **持久化存储** - 数据写入后不会丢失
- **并发处理能力** - 多用户同时访问，保证数据正确性
- **高效查询** - 通过索引、优化器实现快速检索
- **安全与权限控制** - 精确控制数据访问权限
- **事务一致性** - 通过ACID保证数据完整性

## 数据库分类

### 关系型数据库（本课重点）

特点：
- 表结构
- SQL标准
- 强一致性

代表：
- MySQL
- PostgreSQL
- Oracle

适用：订单管理、用户系统、业务数据

### 非关系型数据库

特点：
- 无固定结构
- 高扩展性

代表：
- Redis(键值)
- MongoDB(文档)
- ElasticSearch(搜索)

适用：缓存、日志、大数据分析

## ACID 原则
ACID 是数据库事务的四个核心特性，用于确保数据的可靠性和一致性，尤其在关系型数据库（如 MySQL、PostgreSQL）中至关重要：

- A：原子性（Atomicity）​

    事务被视为一个不可分割的最小单元，事务中的所有操作要么全部成功，要么全部失败回滚，不会停留在中间状态。例如，银行转账必须同时完成扣款和收款，否则回滚到初始状态。

- C：一致性（Consistency）​

    事务执行前后，数据库必须保持一致性状态，即所有数据约束、规则（如唯一性、外键）都得到遵守。例如，转账前后账户总金额应保持不变。

- I：隔离性（Isolation）​

    多个并发事务同时执行时，彼此隔离，互不干扰。数据库通过锁或并发控制机制防止脏读、不可重复读等问题。

- D：持久性（Durability）​

    事务一旦提交，其对数据的修改就是永久性的，即使系统发生故障（如断电）也不会丢失，通常通过持久化存储（如硬盘）实现。

## CAP 原则
CAP 理论是分布式系统设计的基础理论，由 Eric Brewer 提出，指出在分布式系统中，以下三个特性无法同时完全满足，最多只能实现其中两个：

- C：一致性（Consistency）​

    在分布式系统的所有节点上，同一时刻读取的数据都是最新的相同版本。例如，用户在任何节点查询数据，都会得到最新的写入结果，否则返回错误。

- A：可用性（Availability）​

    系统始终能够响应请求（不保证数据最新），即使部分节点故障，每个请求都能获得非错误响应。例如，即使数据未同步，系统也返回当前可用的数据。

- P：分区容错性（Partition Tolerance）​

    系统在遇到网络分区（即节点之间因网络问题无法通信）时，仍然能够继续运行。这是分布式系统的基本要求，因为网络分区难以避免。

## CAP 的权衡（常见于分布式数据库设计）：

- CP 系统：保证一致性和分区容错性，牺牲可用性。例如，发生网络分区时，系统可能拒绝写入或读取以确保数据一致。代表：MongoDB（通常配置为 CP）、HBase。

- AP 系统：保证可用性和分区容错性，牺牲一致性。例如，发生网络分区时，系统仍可读写，但数据可能临时不一致。代表：Cassandra、DynamoDB。

- CA 系统：保证一致性和可用性，牺牲分区容错性。这类系统通常不是真正的分布式系统，如单机关系数据库。

# MySQL

## 数据类型
📊 MySQL数据类型速查

| 类型 | 占用空间 | 范围 | 用途 | 注意事项 |
|------|---------|------|------|----------|
| INT | 4字节 | -2^31~2^31-1 | 主键、计数 | 最常用 |
| BIGINT | 8字节 | -2^63~2^63-1 | 分布式ID | 雪花ID |
| VARCHAR(n) | 可变 | 0~65535字符 | 姓名、标题 | **最推荐** |
| DECIMAL(10,2) | 可变 | 精确小数 | 金额、财务 | 无精度误差 |
| DATETIME | 8字节 | 1000~9999年 | 创建时间 | **最推荐** |
| TIMESTAMP | 4字节 | 1970~2038年 | 自动时间戳 | 2038年问题 |

## 基础语法

## SQL三大组成部分

### DDL（数据定义语言）

```sql

-- 创建数据库

CREATE DATABASE school CHARACTER SET utf8mb4;

-- 创建表

CREATE TABLE students (

id INT PRIMARY KEY AUTO_INCREMENT,

name VARCHAR(50) NOT NULL,

age INT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- 修改表结构

ALTER TABLE students ADD COLUMN email VARCHAR(100);

```
### DML（数据操作语言）

```sql

-- 插入数据

INSERT INTO students(name, age) VALUES ('张三', 18);

-- 查询数据

SELECT * FROM students WHERE age > 17;

SELECT * FROM students WHERE name LIKE '%张%';

-- 更新数据

UPDATE students SET age = 20 WHERE id = 1;

-- 删除数据

DELETE FROM students WHERE id = 1;

```
### DCL（权限控制）
```sql

-- 创建用户

CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';

-- 授权

GRANT SELECT, INSERT ON school.* TO 'username'@'localhost';

-- 撤销权限

REVOKE INSERT ON school.* FROM 'username'@'localhost';
```

## 事务（Transaction）

### ACID原则
- **A**tomicity（原子性） - 全部成功或全部失败
- **C**onsistency（一致性） - 数据状态合法转移
- **I**solation（隔离性） - 事务间互不干扰
- **D**urability（持久性） - 提交后数据不丢失

### 事务流程
```sql

-- 开启事务

START TRANSACTION;

-- 执行多条SQL

UPDATE account SET balance = balance - 100 WHERE id = 1;

UPDATE account SET balance = balance + 100 WHERE id = 2;

-- 提交或回滚

COMMIT;  -- 成功提交

-- ROLLBACK;  -- 失败回滚
```

### 并发问题与隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | MySQL默认 |
|---------|------|------------|------|-----------|
| 读未提交 | ✅ | ✅ | ✅ | ❌ |
| 读已提交 | ❌ | ✅ | ✅ | ❌ |
| 可重复读 | ❌ | ❌ | ✅* | ✅ |
| 串行化 | ❌ | ❌ | ❌ | ❌ |

⚠️ **注意**：MySQL默认使用**可重复读(Repeatable Read)**级别，是性能与一致性的最佳平衡。

##  Go操作MySQL

### 原生SQL方式
```go
// 安装驱动

// go get github.com/go-sql-driver/mysql

import (

    "database/sql"

    _ "github.com/go-sql-driver/mysql"

)

// 连接数据库
dsn := "root:123456@tcp(127.0.0.1:3306)/school?charset=utf8mb4&parseTime=True&loc=Local"
db, err := sql.Open("mysql",dsn)

// 插入数据

result, err := db.Exec("INSERT INTO students(name, age) VALUES (?, ?)", "王五", 16)

// 查询单条

var name string

var age int

err := db.QueryRow("SELECT name, age FROM students WHERE id = ?", 1).Scan(&name, &age)

// 查询多条

rows, err := db.Query("SELECT id, name FROM students WHERE age > ?", 15)

defer rows.Close()

for rows.Next() {

    var id int

    var name string

    rows.Scan(&id, &name)
    
    fmt.Println(id, name)

}

// 事务

tx, err := db.Begin()

tx.Exec("UPDATE students SET age = age + 1 WHERE id = 1")

tx.Exec("INSERT INTO score_log(student_id, change_amount) VALUES (1, 1)")

err = tx.Commit()  // 或 tx.Rollback()
```

# Gorm

## 安装与连接
```go
// 安装GORM

// go get -u gorm.io/gorm

// go get -u gorm.io/driver/mysql

import (
    
    "gorm.io/driver/mysql"
    
    "gorm.io/gorm"

)

// 连接数据库

dsn := "root:123456@tcp(127.0.0.1:3306)/school?charset=utf8mb4&parseTime=True&loc=Local"

db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
```

## 定义模型
```go
type Student struct {
    
    ID        uint      gorm:"primaryKey"
    
    Name      string
    
    Age       int
    
    Grade     string
    
    CreatedAt time.Time

}

// 自定义表名

func (Student) TableName() string {

    return "students"

}

// 自动建表

db.AutoMigrate(&Student{})
```

## CRUD操作
```go
// 创建（Create）

student := Student{Name: "张三", Age: 18, Grade: "高三"}

result := db.Create(&student)

fmt.Printf("插入成功，ID: %d\n", student.ID)

// 查询单条（Read）

var stu Student

db.First(&stu, 1)                    // 按主键查询

db.First(&stu, "name = ?", "张三")     // 按条件查询

// 查询多条

var students []Student

db.Where("age > ?", 17).Find(&students)

// 更新（Update）

db.Model(&Student{}).Where("id = ?", 1).Update("age", 20)

db.Model(&Student{}).Where("id = ?", 1).Updates(Student{Age: 20, Grade: "高三"})

// 删除（Delete）

db.Delete(&Student{}, 1)
```
## 链式查询
```go

var list []Student

db.Where("age > ?", 16).

Where("grade = ?", "高三").

Order("age desc").

Limit(10).

Find(&list)
```

## GORM事务
```go

// 写法1：自动事务（推荐）

err := db.Transaction(func(tx *gorm.DB) error {
    
    if err := tx.Create(&Student{Name: "A"}).Error; err != nil {
        
        return err  // 自动回滚 
    
    }
    
    if err := tx.Create(&Student{Name: "B"}).Error; err != nil {
        
            return err  // 自动回滚
    
    }
    
    return nil  // 自动提交

})

// 写法2：手动事务

tx := db.Begin()

tx.Create(&Student{Name: "A"})

tx.Model(&Student{}).Where("id=1").Update("age", 20)

tx.Commit()  // 或 tx.Rollback()
```

## 其他注意事项

1. `LIKE` 语句支持模糊搜索，语法如下：
    - `db.Where("name LIKE ?","%"+Name+"%")` ： 参数 ：%Name只搜索关键字末尾，%Name%不限位置，Name%首关键字
2. SQL注入：攻击者可以通过直接在数据里塞入SQL语句实现非法调用数据库，好在Gorm会自动防范SQL注入，且一般情况下使用？作为索引