---
townId: go-AIM
title: AIM项目总结梳理
description: 对最近完成的AIM项目的技术回顾、分析与总结
category: Golang
series: "Agent 与 RAG"
seriesIndex: 2
tags:
  - Golang
  - Agent
  - 项目
  - 后端
date: 2026-06-10
draft: false
cover: /assets/posts/covers/cover38.webp
coverAlt: AIM项目总结梳理
---

# 前言
要写ls最终考核了，我选了AIM这个选题，也就是IM+AI，虽然不知道侧重点在IM还是AI，但是好歹先从CRUD开始写吧

于是，我的AIM项目就这样被划分成了三个阶段：IM - Agent - RAG

在这里，我来一步步地梳理一下在这些阶段中之前没有接触过或者深入过的一些路程......

有关项目的详细解析的话，看项目的Deepwiki吧：**[DeepWiki-ClaranAIM](https://deepwiki.com/Claran309/ClaranAIM.)**

不过，这个项目基本都是vibe coding的产物，自己古法的部分微乎其微，比起后端我就像个产品经理，这样大概很有问题吧......
# 三个阶段

## IM阶段：分布式+CRUD+最终一致性
准确来说，我的项目并不是从IM开始的，因为我最开始只Init了一个Agent执行面，所以反而可以说是从Agent开始的。不过后来我开始先写了一个基础的IM分布式服务

这个阶段，我的项目结构大概是这样的：
```
ClaranAIM/
├── cmd/
├── internal/
    ├── api-gateway/                      
    ├── websocket-gateway/              
    ├── user-service/                      
    ├── group-service/                    
    ├── msg-core-service/                 
    ├── msg-history-service/              
    ├── file-service/                     
├── pkg/
    ├── cache/redis/                     
    ├── config/                                
    ├── eventbus/                       
    ├── events/                        
    ├── governance/                     
    ├── health/                           
    ├── jwt/                             
    ├── logger/                            
    ├── password/                          
    ├── response/                          
├── idl/                                   
├── kitex_gen/                              
├── config/                                
├── dist/
    ├── index.html
    ├── css/
    └── js/
├── docs/
    ├── plan.md
...
```
嗯，其实也就是个简单的分布式CRUD，甚至没上一致性和其他东西，所以其实没什么可讲的

唯一可以将的也许就是一些旧架构的新写法

例如数据库事物和缓存，不像我之前全写在dao层导致dao层比较臃肿，这里的写法是把事物由dao层抽象向上级包装，由service层实现细节编排，而dao层只负责可用接口。同样地，缓存在service处编排，且在redis设施层新增抽象方法返回hit信息。而对于复杂业务，将业务细节和业务编排分开

然后呢，就到了hy五一考核了，虽然我没参加，但是有观战环节。其中，从大神们的聊天和对话中学到了很多，特别是关于一些一致性和可靠性的东西，比如outbox和eventbus（redis 扣减完了，但是 kafka 还没有推送的间隙，服务器挂了或者重启了咋办？或者说 kafka 丢消息了，wal 写到哪里？）

### Outbox & Eventbus
- Outbox是一种业务层WAL，可以在不主动关心业务事件成功与否的情况下进行消息分发
- Eventbus是对消息队列这一基础设施的一种封装模式
#### Outbox
接着上面的问题讨论：redis 扣减完了，但是 kafka 还没有推送的间隙，服务器挂了或者重启了咋办？或者说 kafka 丢消息了，wal 写到哪里？

这些问题源于一个事实：“数据库/Redis/Kafka之间没有天然原子性”。也就是说，**业务事实 和 事件发布 不能原子提交**

于是，我们可以转移思路，尝试让业务事实和事件发布这个流程具有最终一致性——这就是 Outbox 要解决的问题

Outbox的核心思想是：不要在业务事务里直接发 Kafka，而是在业务事务单开一个event_outbox表用来写一条“待发送事件”的WAL。再由解耦的OutboxWorker轮询扫描event_outbox表，根据扫描结果来投递消息或重试消息

也就是：
1. 开启 MySQL 事务
2. 写业务表
3. 写 event_outbox 表
4. 提交事务
5. 后台 worker 扫 event_outbox
6. 投递 Kafka
7. 成功后标记 published

这样，业务事实和事件记录就有了原子性：业务成功，outbox 一定成功；业务失败，outbox 一定失败

有了这种设计思路，我们上面的问题：

redis 扣减完了，但是 kafka 还没有推送的间隙，服务器挂了或者重启了咋办？ —— 用Outbox即可

或者说 kafka 丢消息了，wal 写到哪里？ —— event_outbox表里

同时，我们可以在event_outbox存储当前消息执行状态字段，如pending，retry，dead等，并在worker中配置如遇到retry则尝试再次投递消息，失败超过一定次数后标记为dead等

#### EventBus
EventBus其实就是一种kafka等消息队列的抽象封装方式。Eventbus在把kafka等消息队列抽象成基础设施层的基础上，让消息队列围绕业务事件解耦协作

首先，我们需要把kafka等消息队列的消息都封装为事件Event envelope，把所有kafka的信息如topic、payload都封装到event和envelope中，再把event封装为各种实际方法

同时，我们也要注意业务代码中的幂等操作，防止同一事件被重复执行多次

直观地说：


| 对比点 | 普通 Kafka | 封装 EventBus 模式 |
|---|---|---|
| 抽象层级 | 消息队列层 | 业务事件层 |
| 关注点 | 怎么发消息、怎么消费消息 | 什么事件发生了、谁要处理 |
| 业务代码感知 | topic、key、payload | event type、event payload |
| 扩展方式 | 新增 topic 或新增 consumer | 新增事件订阅者 |
| 耦合程度 | 业务代码容易感知 MQ 细节 | 业务代码只感知业务事件 |
| 事件格式 | 容易散落在各服务 | 通常统一 Envelope |
| 适合场景 | 简单异步任务 | 事件驱动架构、多服务协作 |

##### Event Envelope
为了让 EventBus 能够统一处理不同业务事件，我们常不会直接把业务 payload 裸发出去，而是会包一层统一的事件信封，也就是 Event Envelope

一个事件通常会包含：
- event_id：用于幂等，消费者可以用它判断事件是否处理过
- event_type：表示事件类型，比如 message.created
- aggregate_type：事件属于哪类业务对象，比如 message、group、agent
- aggregate_id：具体业务对象 ID
- occurred_at：事件发生时间
- producer：哪个服务产生的事件
- schema_version：事件结构版本，方便以后升级
- payload：真正的业务数据

例如：
```json
{
  "event_id": "evt_123",
  "event_type": "message.created",
  "aggregate_type": "message",
  "aggregate_id": "msg_456",
  "occurred_at": "2026-06-09T12:00:00Z",
  "producer": "msg-core-service",
  "schema_version": 1,
  "payload": {
    "msg_id": "msg_456",
    "conversation_id": "conv_789",
    "sender_id": "user_1",
    "content": "hello"
  }
}
```

这样做，所有消费者都可以用统一方式解析事件、打日志、做链路追踪、做幂等判断

### client_msg_id
在传统的im场景中，用户很有可能因为网络不佳导致点击多次发送消息，此时就很有可能造成消息重复的问题

在这种情况下，outbox没啥用处。于是，我们可以维护一个client_msg_id，保证当用户重复点击时防止消息重复落库。具体来说，client_msg_id是客户端生产的消息幂等ID。当请求达到后端时，后端判断：该请求是否携带同一个conversation ID，同一个sender ID和同一个client message ID，通过三重判断才会决策是否能落库为新消息

### 其他服务治理
说实话，我这个项目的服务治理这一块做的并不完善，哪怕项目完结了也只有api-gateway一层按ip的令牌桶，甚至在分布式的情况下只能做到保护api-gateway这一个微服务......改天再完善一下吧，把限流这块做进阶一点，上个redis cluster......

### Websocket
Websocket我也是第一次接触使用，总体来说就是维护一个ws hub，并创建注册表哈希：map[user_id] -> 不同连接，在hub里维护client注册表和broadcast广播channel，然后再实现register和unregister方法来实现客户端上下线ws

对于服务端->客户端，可以让client从send管道读取广播内容并回显到浏览器，即创建一个ticker定时向conn发送心跳，开启协程死循环监听send管道和ticker

对于客户端->服务端，我们让client从websocket读取数据并传输给boradcast管道，单开一个协程死循环的从conn读取数据即可

同时，ws也负责作为consumer监听消息，实时推送数据到客户端和其他服务

### 用户消息视图
做这一块之前，我就在想：就QQ这种传统的IM系统来说，聊天记录一般都是保存在本地缓存的，而不是每次都要在服务端拉下来

但是我做是web聊天室，又不是客户端软件，怎么做到类似“本地缓存”的效果呢？难不成把所有信息都丢进redis？先不说数据可能不一致，感觉性能也没有怎么被优化。难不成在客户端创建本地文件？那感觉有点麻烦且难以维护相应文件了...

不过最终我并没有找到什么好的解决办法，也许是我没深入去了解其他开源项目的实现

最终我创了一个新表，用来保存“服务端消息”在“客户端”应该呈现的“用户消息视图”

创建了新表后，客户端“删除消息”之类的只对本地客户端产生影响的操作都操作在用户消息视图表里，但撤回这种影响服务端和其他客户端的操作还是发生在原消息表里

除了“删除消息”这种操作，用户消息视图还负责**已读回执**。客户端POST请求 /api/v1/message/read，服务端就写数据库和outbox，再通过消息让ws推送到其他在线参与者

不过这个已读回执功能可能对数据库的压力有点大，因为每次检查已读状态之类的操作都会直接打到数据库里......不知道有啥优化的方法

### 已读游标、离线同步
已读游标也是im里的一个经典设计，通过维护一个会话参与者表里的last_read_message_id，可以认为该id之下的所有消息都是“用户未读消息”，在用户在线但未读消息时直接用 SQL count 即可达到显示未读消息和数量的效果

但这只能做到“用户在线时不漏消息”，还做不到“补全用户离线时收到的消息”，于是我们要做离线同步：





### 最终链路
发消息
```
用户发消息
  ↓
api-gateway 调 msg-core-service.SendMessage
  ↓
校验会话是否存在
  ↓
校验发送者是否在会话里
  ↓
群聊检查群状态/禁言
  ↓
MySQL 事务：
    写 messages
    更新 conversations.updated_at
    为每个参与者写 message_user_states
    写 event_outbox(message.created)
  ↓
事务提交
  ↓
Outbox Worker 投递 Kafka/EventBus
  ↓
websocket-gateway 消费事件并推给在线用户
  ↓
其他消费者
```
## Agent阶段：管理面+执行面+Agent原生

### 管理/执行分面
做完im的基础部分后，我就开始尝试在im里加ai能力了。不过在最开始，我只是往im里加入了一个可供对话的bot，这个bot基本没有任何特殊能力，虽然有自定义配置/prompt、计费管理等功能，也不能算是AIM里的A面

不过在这一阶段，我就已经把未具雏形的agent划分成了两块微服务：Agent管理面（agent-manager-service）和Agent执行面（agent-runtime-service）

其中，Agent管理面负责管理所有创建的Agent实例，以及不同Agent的配置、计费、权限、触发路由（IM原生后）以及调用runtime-rpc让agent运行；而Agent执行面这负责让某个Agent跑起来，包括基础的Agent运行、Tool使用/Skill读取/长会话等功能

这一部分其实挺简单的，无非就是把Agent拆成了两个部分而已。但是这样也只是把Agent硬生生地搬进了im系统，并没有实现im个agent的融合

### Agent-Native IM
于是我就在想，aim这一说法，到底要有多a呢？只是在项目里提供一个可对话工作的agent就好了吗？哪怕这个agent与im没有半点关系？

最终，我想到的aim理想形态是：Agent原生的IM系统，而不是IM原生的Agent平台

具体来说，就是让agent能够原生存在于im的会话中，例如agent能够自动感知群聊聊天消息，能够在自己判断合适的时候主动发送消息，能够主动检索群聊消息或计划安排并生成相应文件，甚至能够在群聊中与其他agent协作工作流，就类似QQBot或飞书Bot但是更全面

更激进一点，Agent能够跳出会话框架，让Agent接入IM系统，主动操作im系统私发消息、添加好友等。甚至Agent能在会话中自然产生并执行工作流，会主动@其他Agent协作工作，被@的Agent在主Agent的管制下工作，会话记忆和摘要/用户画像全入RAG链路......

这就是我对AIM的构想，尽管现在只实现了我构想的冰山一角不到......

我现在实现的Agent原生存在于两个方面：Agent作为用户实例复用用户链路 + Agent能感知会话内事件

这个阶段，我尝试让Agent原生于im系统。首先，我取消了原有的bot，让Agent能够作为“user”存在于项目中，于是agent创建流程可复用user创建的链路并被标记为“system user”，并且agent创建后也能复用user服务，做到像被添加为好友、拉如群聊、设定个人信息和头像等用户级操作，尽管这些是被动的

#### AgentEventDispatcher
然后，我对im系统做了修改，让im-agent系统更侧向事件驱动：要想让agent原生存在与会话中，agent不能“主动”拉取最近消息，而是让所有消息都“通知”agent，消息事件就很适合这个模式：

传统的msg事件`claran.message.events`主要是为了触发ws推送，而我则新建事件类型为im事件`claran.im.events`，与传统消息事件同步或取代发布。也就是一但im会话中存在改动，如新人入群、发送文件或消息、禁言成员等事件，这些事件就会被封装为`claran.im.events`。而在链路下游的`agent-manager-service/eventconsumer`中的`AgentEventDispatcher`会监听并消费该事件，并判断该事件是否触发agent执行机制

对于我设想的aim理想形态而言，每个事件都应该触发agent思考，并自我判断是否主动发送消息，不过我却没这么做，反而像传统bot一样，做成了触发机制：在Agent管理面会管理Agent触发路由和触发判断规则，manager对`claran.im.events`事件会做出两种决策：`record`和`trigger`。触发`record`决策后，manager只写审计，不调用 runtime，不回复；触发`trigger`决策后，manager会在写审计和调用记录的基础上拉取Agent可见历史，调用`agent-runtime-service`，并以AgentUserID写回消息核心服务`msg-core-service`，将事件标记为completed

`AgentEventDispatcher`中的详细触发规则如下：如果事件来自私聊，这所有事件都默认触发`trigger`；如果来自群聊，则默认只触发当Agent被@的消息。同时，用户配置Agent时可以配置Agent触发路由规则：默认触发/关键词触发/命令触发/保持静默。另外，当同一个 Agent 可能被多个规则命中且非保持静默/触发时，合并优先级`trigger > record > 其他`

这样，我就做到了最基础的Agent原生形态，让Agent天然存在于会话中，尽管感觉跟astrabot没啥区别

在这样的模式下，我们还要考虑agent事件防重复触发和幂等操作。当请求打进来时，服务端会在`consumer`里调用`dao`层`start`方法（开始前检查），用事件的`eventid + userid`查是否落过库来返回事件是否可被执行

## RAG阶段：RAG+知识图谱+进阶Agent能力
这时，AIM已经初具雏形：标准im能力+Agent作为User且能存在于会话中的AIM系统。但这个系统仍缺少一些Agent进阶功能：RAG、MCP、Agent协作

### RAG

于是我开始补全这些功能，首当其冲的就是最重要也是体量最大的RAG系统。因为我并没有接触过实际实现RAG系统的业务知识，我就先去学习了部分RAG策略

不过这部分我感觉体量太大，于是打算单开一个文章详细总结：**[RAG指南：从MVP介绍各种RAG策略](https://www.claran-blog.work/go-rag/)**，所以此处按下不表

### Web-search&Memory&Conversation-Intelligence
在做完完整RAG后，我打算把向量业务拓展成其他功能，于是就有了Web-search 、Memory和Conversation-Intelligence，不过后两个模块都不完善，只有基础架构和部分MVP

#### Web-search
这部分其实并没有用到向量数据，我只完成了基础的web-search并封装为MCP：

搜索
  -> 选官方/高可信页面
  -> 抓网页正文
  -> 清洗正文
  -> 截取相关段落
  -> 给 LLM 回答

#### memory
除了之前在agent-manager里的会话级记忆，我还拓展了agent的用户画像，agent能根据对话候选相应的对话段进入 memory-service 的候选区，在用户确认或系统高置信后进入 memory_facts。或者实现自动记忆提取：Agent 对话结束后，异步判断是否应该生成新记忆，判断这轮对话是否产生长期有用事实

同时也应该有更新旧记忆、降低旧记忆权重、保留时间线等功能，但是我还没有实现。目前只把候选记忆/正式记忆的管理和召回封成了MCP

#### Conversation-Intelligence
这其实是我设想的AIM理想形态的部分之一：Agent能够总结会话消息和事件，并追加相应总结和思考，再把这些数据向量化入RAG链路。例如找历史讨论、总结某段时间发生了什么、问特殊决策、找某个文件/任务/结论出处、Agent 根据长期群聊上下文回答等

但聊天记录有几个难点：噪声大、数量多、权限复杂、实时增长快、短消息语义弱、上下文依赖强......例如单条消息："好""可以"啥的，拿去 embedding 基本没意义。

所以合理的Conversation-Intelligence构想应该是短期上下文直接从 msg-core 拉最近 N 条，长期聊天RAG对会话片段/摘要做向量化

也就是说，聊天记录的rag可以做定时任务，拉取1h内所有信息或者每100条信息做一次，做conversation_summary / decision / task / topic chunk或者金句/用户要求记忆或者价值信息，再入strict rag。并且只对有价值消息入库，比如长文本消息、包含文件/代码/链接的消息、被引用/点赞/标记的消息、Agent 生成的总结、用户手动收藏的消息等

这部分的实现结构也比较清晰：
- Scheduler 每分钟扫描活跃会话 -> 找到满足条件的 conversation -> 创建待处理任务
- Worker 处理待处理任务 -> 拉取消息窗口 -> 清洗消息 -> LLM 提炼 summary/decision/task/topic/memory_candidate -> 写 MySQL -> embedding -> 写 Milvus -> 标记任务completed

不过当前并没有实现这么完善

### 知识图谱
这部分我原本是打算当做GraphRAG的副产物的，结果越做越大，索性做成一个独立的服务了

一般来说，现在流行的知识图谱都是用户手动注入文章关系形成的，但是我想另辟蹊径：上传文档时由LLM抽取文档中的实体与实体关系，然后再保留合理关系放入知识图谱

这样做的优势很多：用户不用再自己手动管理知识图谱、让知识图谱的关系网更多样化......编不出来了。劣势也十分明显：LLM抽取的实体和关系质量都太不稳定，导致知识图谱里基本没有有用的信息或者实体和关系网都很杂乱.....

于是我在业务层给LLM多加了部分限制，严格控制抽取的实体与关系数量和质量，结果又基本不产出实体和关系了。没办法，我又做成了一篇文章分成多层，每层由专门的llm抽取实体/关系/校验等，并让llm自定义关系字段，尽量不限制实体数量......最后总算是做到能看的地步

然后我意识到，我仍然在用MySQL来存图谱数据，真是蠢到家了，于是赶紧转Neo4j

## 其他功能补全
至此，项目基本都三段开发经历也算结束了，后续又陆续补全了一些功能，例如接了个ocr来辅助rag，同时用户也能直接调用ocr模型识图；做了小模型翻译消息的功能；补全了可观测性链路和看板；做了setting-service和面板来单独配置llm预设和skill等；做了admin-service和面板来方便前端直接管理项目状态和用户数据；做了些上传气泡和提示框啥的有的没的。总之就那样吧

# 缺陷
老实说，到截止时间为止，我觉得我的的项目仍然全是缺陷，满目疮痍

用的仍然是old的MySQL，没有进阶的限流策略，没有严格的一致性策略，没有全面的分库分表读写分离，没有Protobuf，没上nacos，没有上过压测和优化，没有合理的降级治理，没有实现我设想的Agent原生和多Agent协作，没有Agent CLI操作，没有完整的memory和conversation-intelligence，没有部署上服务器，甚至没有全面了解过我自己Vibe的这个项目，甚至就连一些项目要求都没完成（离线同步、消息审核）

我说白了，作为一个基本全Vibe Coding的项目，我需要一边当产品经理指挥Codex干活，一边上前端测试所有可能出现的bug，一边明确bug和需求鞭策Codex修bug，一边紧锣密鼓地给项目做规划，一边学习项目可能用到的新技术，一边审阅代码发现看不太懂，一边又让Codex为我生成项目的学习大纲和学习文档，最后因为中转站突然垮掉或者余额不足或者再不睡就猝死而遗憾下机

就这样的一个小项目，烧了10亿token，最后我自己都讲不清楚知道哪些地方是怎么写的，架构是怎么样的，这真的能算我写的一个项目吗？

我到现在也没背过八股，没学过计算机底层，没参加过开源项目，没了解过业务设计和系统优化，没实践过ddd等学过的架构，没深入了解过各种中间件底层，我真的有与其他人相衬的能力进大神遍地的技术组织吗？

说多了，这些我本来想放在随笔或者后记里的，不过我做得一般也是事实

![](/images/albums/blogAlbum/sadmouseonthebed.jpg)

半成品/预留：
- msg-history-service 的 offline_messages 离线索引
- msg-history-service 的独立历史归档读模型

还建议完善：
- 正式 offline-push-service
- 在线状态服务或 Redis 在线状态
- 设备级 sync cursor 持久化
- 每设备 ACK 表
- 离线推送厂商通道
- DLQ 管理后台和重放按钮
- processed_events/outbox 的重放审计工具
- 热会话 Redis 缓存
- 会话级限流和防刷

# 后记
如我上面所说，没背过八股，没学过底层，没全面了解过自己的项目，就要被老登拷打，不敢想

也不知道说什么了，拷打后再更新吧

![](/images/albums/blogAlbum/mousebewound.jpg)

# 参考文章
**[DeepWiki-ClaranAIM](https://deepwiki.com/Claran309/ClaranAIM.)**

**[Go 语言 WebSocket 编程详解](https://juejin.cn/post/7532397956784766995)**

**[使用Golang实现WebSocket：从入门到实践](https://zhuanlan.zhihu.com/p/12482284609)**

**[WebSocket编程](https://topgoer.com/%E7%BD%91%E7%BB%9C%E7%BC%96%E7%A8%8B/WebSocket%E7%BC%96%E7%A8%8B.html)**

**[Go 开发者必备：Protocol Buffers 入门指南](https://juejin.cn/post/7463052032313294902?share_token=8b819bc4-8297-4a7e-9f25-b6ae9a797449)**

**[GO websocket实现简易聊天室](https://juejin.cn/post/7156436348478423047?share_token=2a1b6577-d5b9-4bc4-b599-719a54621b1a)**

**[EventBus使用详解](https://blog.csdn.net/lyabc123456/article/details/90746210)**

**[一个轻量级的事件发布/订阅工具库，可以简化 Go 协程之间的通信](https://zhuanlan.zhihu.com/p/624349284)**

**[典型的 Outbox Pattern 实现，并附上 最小可运行的 Golang demo，方便理解](https://juejin.cn/post/7561660157026435135)**

**[Golang后端面试复盘：从Swoole到IM架构，如何支撑360w用户的实时消息推送](https://juejin.cn/post/7619281869084622902?share_token=f4e236f7-d5ef-4cee-91c1-8da39b6b63ef)**

**[RAG 检索增强生成详解](https://mife-user.github.io/posts/rag%E6%A3%80%E7%B4%A2%E5%A2%9E%E5%BC%BA%E7%94%9F%E6%88%90%E8%AF%A6%E8%A7%A3/#13-rag-%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B%E5%85%A8%E6%99%AF)**

**[RAG 是什么？16 种 RAG 方案一次讲清](https://www.cnblogs.com/yupi/p/19914426)**

**[快速入门 Milvus Lite](https://milvus.io/docs/zh/quickstart.md)**

**[Go构建向量数据库：如何在1小时内完成百万级向量检索环境部署](https://blog.csdn.net/Algorhythm/article/details/153186809)**