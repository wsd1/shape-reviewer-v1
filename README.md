# 光线工场 shape-reviewer-v1
----


图纸审阅工具。

相关项目：

react-svg-pan-zoom-custom  :   修改过的 react UI component.
shape-worker-v1        :   web thread. 所有线条管理和算法

继承于项目：

contor-reviewer

改动：

* 开始使用 Antd 
* 使用 create-react-app 脚手架；
* 名称 从contor-reviewer 改为 shape-reviewer-v1；
* 全面使用 yarn 工具



## 项目延续历史背景


1、dxfRender

https://github.com/wsd1/dxfRender.git

fork于 https://github.com/bjnortier/dxf 尝试使用canvas和svg显示解析数据；最后决定使用svg


2、polygonr

https://github.com/wsd1/polygonr

这是切割机图纸审阅项目起点，尝试加入众多处理算法。类如 刀路生成、扫描线 间距检测等

3、blueprintWorker 和 svg-reviewer

https://github.com/wsd1/blueprintWorker
https://github.com/wsd1/svg-reviewer

第一版react的app，能够简单的检测图纸issue，分层，批量检查gap。缺点是批量检测，操作不方便。
算是 react练手用

4、contorWorker 和 contor-reviewer

https://github.com/wsd1/contorWorker
https://github.com/wsd1/contor-reviewer

第二版 react app，正式确定了以单线条为操作对象，深度修改了svg查看器的编辑能力，实现了 点选、框选，删除、打断点等功能，使用鼠标可以很流畅的操作线条。


5、shape-worker-v1 和 shape-reviewer-v1

2020 9月

https://github.com/wsd1/shape-worker-v1
https://github.com/wsd1/shape-reviewer-v1

正式版 react app，做好了UI设计，将囊括 图纸处理、下单和订单查看的能力。作为可发布的一代版本。
项目名称正式定义为 ‘光线工场’，请查看文档库中相关设计。




## 依赖：react-svg-pan-zoom-custom 的编译

使用了 yarn link 处理本地组件的依赖

在 react-svg-pan-zoom-custom 中 
    
    yarn run library:build:commonjs #须编译
    yarn link


在本项目中使用：

    yarn link "react-svg-pan-zoom"

    #这个动作会在本地 node_modules 路径下生成 软连接，直接使用 react-svg-pan-zoom-custom 项目下的编译的代码

以后，如果修改了 react-svg-pan-zoom-custom 的代码，就直接在根目录运行：

    yarn run library:build:commonjs #须编译

即可。


## 依赖：shape-worker-v1 的编译
路径下

    yarn start 

正式发布时，修改 webpack.config.js 将其中 development 换为 production。再编译。

## reviewer的设计 20200909
这次(shape-reviewer-v1)的设计经历了多少次的重构，才慢慢的掌握了svg图形化处理 以及 react的编程。其中使用了 antd，的确大大提升了效率，很多细节都给你照顾到了，比如 message，spin什么的用起来很方便。
在设计上，我也形成了自己的一点小小的规范，在处理界面和逻辑方面，我大致将代码分为：components、layouts和views，对应的可以看到代码文件夹。

layouts主要划分页面区域，views中的代码，则重点组织数据，和填充layout。

其中最为重量的就是 "views/editor.js"。编辑器所有逻辑都在这个文件中。


### 关于进度的机制
worker中有个得意的设计，（见 worker代码 updater.js） 可以设定步数，并且回调发出进度信息，其格式如：

  {PARSE_DXF: 30, SET_LAYER: 20}

在reviewer 这一侧，“views/editor.js” 搜索 “generalProgress()” 函数，可以看到大概的处理方法。

### 关于svg的缩略图

这个机制是在 worker中输出 svg文本，然后在 reviewer中将其变为 URL。搜索 “views/editor.js” 中 createSvgURL()函数。

### 关于引导 worker的流程
worker是另一个项目，其中所有的图形处理都在其中，其被build之后需要手工放置到 public 路径下面。
在reviewer中editor的引导流程，详细搜索 “views/editor.js” 中 createWorker()

### 关于 大型数据结构 在react中 hook管理状态的说明

第一次做react的项目，懵懵懂懂开始设计，重构，再重构，慢慢的对 react环境下的各种工具有了深入的把握。

在 editor.js 的 ViewEditor()函数中，我构造了不少的 state。这些 state 皆来自于 worker 发回消息中的各种片段，有的大有的小。

这些 state 依赖worker发回的大数据树，每一个方面都有相应的处理流程，比如，图形信息 stateGraphs，还有 类如 进度信息、反馈消息啊。最重要的就是 stateGraphs，这里面包含了图纸内所有线条信息。

由于各方面的需求不确定，所以我构造了一个对象 workerStateHandles ，将这些状态和对应处理流程都放入这个对象。该对象被传入 worker的消息处理逻辑中： 

      const { command: workerCommand } = useShapeWorker(createWorker, workerStateHandles);

useShapeWorker 是引导worker的函数，参考了网上一个大神写的短小精悍的 hook，见 https://github.com/dai-shi/react-hooks-worker/  。理解与原理之后做了深入的修改。

其实也很简单，就是引导worker之后，在onMessage中间各种setState。

理解这个原理之后，editor.js的巨大体积，看起来也就没有那么复杂了。

### markdown 文档系统

需求：

该app需要在提供功能的同时，提供一定的帮助能力。我想到的方式，就是在需要的时候，跳出一个modal，里面就是文档（markdown）。

文档自然要独立出来，最好就是md文件。

实现：

我没有使用 webpack的loader来加载md文件，毕竟不想破坏（eject） create-react-app 的配置。
所以使用了动态加载的方式，类如：

    import mdFilePath from '../doc/xxx.md'
    ...
    fetch(mdFilePath).then(text=>{
        mdParser(text)
    })

md文件可以加元数据进去，所以用了front matter的解析器：https://github.com/jxson/front-matter

还有 gray-matter 这个库，没有选。虽然其npm rank稍高一点，但是更新时间是3年前了。前者更新时间3个月，而且体积只有1/3。

markdown解析器使用了：

https://github.com/probablyup/markdown-to-jsx

这个parser可以override对象处理流程，我就重新处理了img的渲染，使用了antd的Img组件（点击可以放大啊）。另外，也做了图片资源路径的配置，可以通过配置图床地址，来实现可以切换图片存放位置。
详细 见 components/doc.js





## 各种资源整理

### 使用CreateReactApp 创建与安装

    npx create-react-app shape-reviewer-v1
    cd shape-reviewer-v1

### Antd资源 整理

https://ant.design/docs/react/recommendation-cn

hoooks:

https://ahooks.js.org/hooks/dom/use-size


Sunflower 基于 antd 的流程组件:

https://ant-design.github.io/sunflower/zh-CN


### webworker知识
重点参考： https://github.com/dai-shi/react-hooks-worker/

https://github.com/webpack-contrib/worker-loader

https://github.com/deebloo/things-you-can-do-in-a-web-worker

worker两种模式: classic module 前者

importScripts('greet.js');

后者可以

import { sayHello } from './greet.js';

来自于：https://web.dev/module-workers/




### svg在React中的深入应用

参考svg map
https://github.com/VictorCazanave/react-svg-map/blob/master/src/svg-map.jsx




### gh-pages 的安装和使用


https://github.com/gitname/react-gh-pages

项目路径下：

    yarn add gh-pages --dev


package.json中加入：

    "homepage": "https://wsd1.github.io/shape-reviewer-v1",

script字段加入：

    "scripts": {
      ...
      "predeploy": "npm run build",
      "deploy": "gh-pages -d build"
    },


github上建立同名repo之后，commit push一下。

回到目录

    yarn start

没有问题就可以：

    npm run deploy

然后，打开 https://wsd1.github.io/shape-reviewer-v1


在使用 router时定义的路径，可能与gh-page上部署的路径正好不一样，上面可以看到 域名后面跟的是 repo名字。

所以，app.js中定义路由时，也需要做相应修改：

    <Route path={process.env.PUBLIC_URL + "/"} exact component={ViewMain} />
    <Route path={process.env.PUBLIC_URL + "/editor"} component={ViewEditor} />

这样就可以适应 本地调试 和 gh-page了。

参考了 https://github.com/facebook/create-react-app/issues/1765





----
以下是 CRA 原工具 README

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).



----




# 原README


## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
