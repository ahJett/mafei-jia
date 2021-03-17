const express = require('express')
//创建网站服务器
const app = express()
//引入boduparsre模块
const bodyParser  =require('body-parser')
//导入express-session模块
const session = require('express-session')
//引入路由模块
const home = require('./route/home')
const admin = require('./route/admin')
const path = require('path')
const { nextTick } = require('process')
// 导入art-template
const template = require('art-template')
// 引入事件处理模块dateformat
const dateFormat = require('dateformat')
//引入数据库模块
require('./model/connect')

//处理post请求参数
app.use(bodyParser.urlencoded({extended:false}))
//配置session
app.use(session({
    secret:'secret key',
    //设置cookie过期时间
    cookie:{
        maxAge:24*60*60*1000
    }
}))

//告诉express框架模板的位置是什么
app.set('views',path.join(__dirname,'views'))
//告诉express 框架模板的默认后缀是什么
app.set('view engine','art')
//当渲染模板后缀为art时 所使用的模板引擎是什么
app.engine('art',require('express-art-template'))

// 向模板内部导入dateformat变量
template.defaults.imports.dateFormat = dateFormat
//开放静态资源文件
app.use(express.static(path.join(__dirname,'public')))

//拦截请求 判断登录状态
app.use('/admin',(req,res,next)=>{
    //判断用户访问的是否是登陆页面
    //判断用户的登录状态
    //如果用户是登录状态 将请求放行 否则重定向到登录页面
    if(req.url != '/login'&& !req.session.username){
        res.redirect('/admin/login')
    }else{
        if (req.session.role == 'normal') {
            return res.redirect('/home/')
        }
        next()
    }
})
//为路由匹配请求路径
app.use('/home',home)
app.use('/admin',admin)

app.use((err,req,res,next)=>{
    const result = JSON.parse(err)
    let arr = []
    for(let attr in result) {
        if (attr != 'path') {
            arr.push(attr + '=' + result[attr])
        }
    }
    res.redirect(`${result.path}?${arr.join('&')}`)
})

app.listen(80,function(){
    console.log('loading..........')
})