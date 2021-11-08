本项目由于时间原因，并没有部署前端代码，只保留了`NFTManage.sol`合约代码。合约代码可以在remix上直接运行、部署，通过function交互可以模拟实现NFT的铸造、拍卖等。

## 交易流程

账户1铸造NFT1

账户1将NFT1拍卖，设定好拍卖end时间与起拍价格

不同账户可以对NFT1进行竞价拍卖，一旦有更高价格出现，上一个最高价竞拍者的竞价自动退回

拍卖end时间到，账户1手动结束拍卖

拍卖结束后，最高价竞拍者手动claim，转移NFT所有权

现任NFT1拥有者（为保证隐私）可以查看NFT1所有权转移记录

任意账户可以查看所有正在被拍卖的NFT，及其拍卖情况

## 具体实现截图如下

##### NFT铸造

铸造NFT

![image-20211106232159684](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232159684.png)



可以单独查看到铸造好的NFT信息：

![image-20211106232233982](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232233982.png)



可以查看所有NFT信息：

![image-20211106232420490](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232420490.png)



##### NFT拍卖

创建拍卖（限NFT拥有者

![image-20211106232350379](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232350379.png)



可以通过拍卖号查看拍卖信息（所有账户

![image-20211106232626154](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232626154.png)



可以通过拍卖的NFT号查看拍卖信息（所有账户

![image-20211106232706220](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106232706220.png)



##### NFT竞拍

切换账户，对相应NFT进行竞拍，可以看到auction信息变动

![image-20211106233332955](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106233332955.png)

![image-20211106233739389](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106233739389.png)

![image-20211106233723120](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106233723120.png)

但现在拍卖时间还没结束，还剩余406秒，所以最终owner还没有变化

![image-20211106233902395](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106233902395.png)



##### 结束拍卖

时间到了之后，由拍卖发起者手动结束竞拍，可以看到余额变化

![image-20211106234552595](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106234552595.png)

![image-20211106234616549](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106234616549.png)



有最高价竞拍者手动认领NFT

![image-20211106234659583](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106234659583.png)



拍卖状态发生变化

![image-20211106234724247](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106234724247.png)



NFT所属权发生变化

![image-20211106234755036](C:\Users\HUAWEI\AppData\Roaming\Typora\typora-user-images\image-20211106234755036.png)







