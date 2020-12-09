# 光线工场 shape-reviewer-v1
----


图纸审阅工具。

相关项目：

react-svg-pan-zoom-custom  :   修改过的 react UI component.
shape-worker-v1        :   web thread. 所有线条管理和算法

继承于项目：

contor-reviewer

相对上一版本改动：

* 开始使用 Antd 
* 使用 create-react-app 脚手架；
* 名称 从contor-reviewer 改为 shape-reviewer-v1；
* 全面使用 yarn 工具

[TOC]

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

## 项目工具与操作

### 主题更换办法：
参考 https://ant.design/docs/react/customize-theme-cn

主要是更新 craco.config.js 文件，中的配置。




### 公网测试
使用 ngrok 来发布到公网：

shape-reviewer-v1 发布出去：

~/worktools/ngrok  http 3000




## reviewer的设计 20200909

这次(shape-reviewer-v1)的设计经历了多少次的重构，才慢慢的掌握了svg图形化处理 以及 react的编程。其中使用了 antd，的确大大提升了效率，很多细节都给你照顾到了，比如 message，spin什么的用起来很方便。
在设计上，我也形成了自己的一点小小的规范，在处理界面和逻辑方面，我大致将代码分为：components、layouts和views，对应的可以看到代码文件夹。

layouts主要划分页面区域，views中的代码，则重点组织数据，和填充layout。

其中最为重量的就是 "views/editor.js"。编辑器所有逻辑都在这个文件中。

### 地址编辑器的设计 2020 1119

代码参考 components/addressEdit.js

借鉴了 https://github.com/gitSirzh/react-smart-address，从其中借到中国各个行政区的省市区分类信息 lib/address.js。
该组件使用父组件提供的 addr和setAddr 状态管理。其渲染后可以是可读地址，点击就可以编辑之。
其提供保存，和放弃保存按钮，分别可以为父组件提供 保存 和 刷新数据的 回调。

### 登录管理 useAuth的设计 20201110

在 hook/中 有useAuth.js用来处理登录注册等各种用户相关的逻辑。其建立在 useContext函数的基础上。细节看代码。

其参考与：https://usehooks.com/useAuth/

### reCaptch集成

前端：

参考：./lib/loadReCaptcha.js，该部分用于加载recaptcha的js代码。
在 app.js中 useEffect 调用之，将recaptcha相关接口安装在 window对象上。

在具体的与后端api交互代码上，例如 views/signInUp.js中，可以在具体交互动作时，获取recaptcha的token，并将其带入后台检验。

例如：

```js
    window.grecaptcha && window.grecaptcha.ready(() => {
      //不同动作 用不同的action
      window.grecaptcha.execute(config.recapcha.site_key, { action: 'SignIn' }).then(token => {
        //将token带入后台。
        auth.signin(email, password, token)
          .then(isOK => { if (isOK) message.info("登录成功") })
          .catch(error => message.error(error.message));
      });
    });
```


后端：

用户注册登录都借助strapi的cms，所以需要修改users-permissions插件。

参考了 https://www.youtube.com/watch?v=xviMhw49REg  这个视频

通过 源代码 packages/strapi-plugin-users-permissions/config/routes.json 可以找出register接口，在 strapi原始代码中的 packages/strapi-plugin-users-permisions/controllers/Auth.js。
拷贝到 服务器实例的 相同的 controllers/路径下。

我们在服务器实例下做修改，主要就是改动Auth.register这个函数。
请参考具体代码。
```js
...
        try {
            //console.log('-------recaptcha params: -------- ');
            //console.log(params);

            let response = await axios.post(verificationURL);

            if (!response.data.success) {
                console.log('-------recaptcha verification err: -------- ');
                console.log(response.data);

                throw { message: "reCaptcha protection." }
            }
        }
        catch (err) {

            return ctx.badRequest(null, formatError({
                id: 'Auth.form.error.recaptcha.invalid',
                message: err.message
            }));
        }
...
```
简而言之就是收到 token之后，再向 recaptcha的服务器发送token，获取 判断，进而决定是否允许该controller的请求得以通过。

github上还有一个使用 http头部添加 x-recaptcha-token 自定义头部的方式来实现向后端传递 token，这种方式可以使用 strapi的 middleware 方式来检验token（其实就是koa的middleware）。这种方式中间件会接触到每一个请求，所以需要对路径做出判断，进而才能决定是否对 recaptcha的token做出检查。有点麻烦，我就没有选择这个方式。


```

### css 如何用div填满视口

主界面需要垂直居中的设计，所以，需要中间块元素垂直填满。在 layoutMain.css 中使用了 100vh 来获取100%的视口高度，并使用 calc 计算出中间部位的高度。

```css

.site-content {
  /* 视口总高减去 导航 和 页脚 */
  min-height: calc(100vh -  64px - 68px);
}

```

### 如何使用 reCaptcha

https://www.google.com/recaptcha/admin/create 创建网站key

注意 可以使用 localhost 定义自己的目标域名。


在 app.js中加载 ./lib/loadReCaptcha.js

并 使用 useEffect首次加载


可以登录 https://www.google.com/recaptcha/admin/ 查看网站情况。



### 关于操作进度（progress）的机制
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





### svg动画属性
应用中需要强调图像元素，如果使用react的机制 刷新几次那么大的dom树，难免负担太重。所以采用了useref 来索引每一个path元素。

为dom元素添加css 非常简单：

定义好 css class，类如"svgPath-focus"

    domEle.classList.add("svgPath-focus");
    domEle.classList.remove("svgPath-focus");

### 获取规划板 信息的格式

访问： /sheet-materials

```json

[
  {
    "name": "普通椴木板",
    "code": "basswoodSimple",
    "description": "普通椴木板\n\n----\n\n价格便宜量又足。公差0.2mm。切缝0.1mm。\n\n",
    "category": "木材-椴木",
    "images": [
      {
        "width": 480,
        "height": 480,
        "url": "/uploads/basswood_sheet1_11dac5aae5.jpeg"
      },
      {
        "width": 400,
        "height": 400,
        "url": "/uploads/1_4_x_4_x_24_basswood_sheet_product_IMG_0040_04_c2fa6f2eed.jpg"
      }
    ],
    "plans": [
      {
        "station": "华中站",
        "width": 300,
        "height": 200,
        "column": 4,
        "row": 6,
        "price": 15,
        "thickness": 4,
        "name": "普椴板4mm[300x200][4x6]"
      },
      {
        "station": "华中站",
        "width": 300,
        "height": 200,
        "column": 4,
        "row": 6,
        "price": 15,
        "thickness": 3,
        "name": "普椴板6mm[300x200][4x6]"
      }
    ]
  }
]



```



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


icons:

https://2fd.github.io/ant-design-icons/#


主题编辑：

https://antdtheme.com/

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
