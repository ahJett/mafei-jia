const express = require('express')
//导入用户集合构造函数
const {User} = require('../model/user')
// 导入文章集合构造函数
const {Article} = require('../model/article')
// 导入分页模块
const pagination = require('mongoose-sex-page')
//引入joi模块
var Joi = require('joi')
const user = require('../model/user')
const { json } = require('body-parser')
const path = require('path')
// 表单处理模块
const formidable = require('formidable')
//创建博客展示页面路由
const admin = express.Router()

admin.get('/login',(req,res)=>{
    res.render('admin/login',{})
})

//实现登陆功能
admin.post('/login', async (req,res)=>{
    //接收请求参数
    // res.send(req.body) //接收到的对象形式的参数
    const {email,password} = req.body
    if(email.trim().length == 0){
        res.status(400).send('<h1>账号或者密码错误</h1>')
        return
    }
    if(password.trim().length == 0){
        res.status(400).send('<h1>账号或者密码错误</h1>')
        return
    }
    //根据邮箱地址查询用户信息
    let user = await User.findOne({email:email})
    //如果用户存在
    if(user){
        // res.send('存在')
        //将客户端传递过来的参数和数据库中的数据进行比对
        if(password == user.password){
            //登录成功
            //将用户名存储在请求对象中
            req.session.username = user.username
            // 将用户角色存储在session中
            req.session.role = user.role
            // res.send('登录成功')
            
            req.app.locals.userInfo = user
            // 对用户的角色进行判断
            if (user.role == 'admin') {
                // 重定向
                res.redirect('/admin/user')
            } else {
                // 重定向到博客首页
                res.redirect('/home/')
            }
            
            
        }else{
            res.status(400).render('admin/error',{
                msg:'邮箱密码或者地址错误'
            })
        }
    }else{
        //没有查询到用户给
        res.status(400).render('admin/error',{
            msg:'邮箱密码或者地址错误'
        })
    }
    
})
//创建用户列表路由
admin.get('/user',async(req,res)=>{
    // 表示当前访问的是用户管理页面 里面的值可以直接在模板中使用
    req.app.locals.currentLink = 'user'
    //接收客户端传递过来的当前页参数
    let page = req.query.page || 1
    //每一页显示的数据条数
    let pagesize = 5
    //查询用户数据的总条数
    let usercount = await User.countDocuments({})
    // console.log(usercount)
    //总页数
    let total = Math.ceil(usercount/pagesize)
    // res.send('总数为'+total)
    // 页码对应的开始位置
    let start = (page - 1) * pagesize
    //将用户信息从数据库查询出来
    const userlist = await User.find({}).limit(pagesize).skip(start)
    res.render('admin/user',{
        userlist:userlist,
        page:page,
        total:total
    })
})

//实现退出功能
admin.get('/logout',(req,res)=>{
    //删除session   
    req.session.destroy(function(){
        //删除cookie
        res.clearCookie('connect.sid')
        //重定向到登录页面
        res.redirect('/admin/login')
        req.app.locals.userInfo = null
    })
    

})

//创建用户编辑页面路由
admin.get('/user-edit',async (req,res)=>{

    // 表示当前访问的是用户编辑页面 里面的值可以直接在模板中使用
    req.app.locals.currentLink = 'user'

    // 获取地址栏中的id参数
    const{message, id} = req.query
    // 判断地址中是否携带id参数
    if (id) {
        // 修改操作
        let user  = await User.findOne({_id: id})
        // 渲染用户编辑（修改）页面
        res.render('admin/user-edit',{
            message:message,
            user:user,
            link: '/admin/user-modify?id=' + id,
            button: '修改'
        })
    } else {
        res.render('admin/user-edit',{
            message:message,
            link: '/admin/user-edit',
            button: '提交'
        })
    }
    
})

//创建添加用户表单处理路由
admin.post('/user-edit',async (req,res,next)=>{
    //定义对象的验证规则
     const  schema = {
        username:Joi.string().min(2).max(12).required().error(new Error('用户名不符合规则!')),
        email:Joi.string().email().required().error(new Error('邮箱格式不符合')),
        password:Joi.string().regex(/^[a-zA-Z0-9]{3,20}$/).required().error(new Error('密码格式错误!')),
        role:Joi.string().valid('normal','admin').required().error(new Error('角色值非法')),
        state:Joi.number().valid('0','1').required().error(new Error('状态值非法!'))
    }
    try{
        //实施验证 返回值是promise对象
        await Joi.validate(req.body,schema)
        // console.log(req.body)
    }catch(error){
        //验证没通过
        //重定向回用户添加页面
        return res.redirect('/admin/user-edit?message='+error.message)
        // return next(JSON.stringify({path:'/admin/user-edit',message:error.message}))
        
    }
    // return
    //根据邮箱 地址查询用户是否存在
    let user = await User.findOne({email:req.body.email})
    
    //如果邮箱已经注册
    if(user){   
         //重定向回用户添加页面
        return res.redirect('/admin/user-edit?message='+'邮箱地址被占用')
    }
    //将用户信息添加到数据库
    // console.log(req.body)
    await User.create(req.body)
    //重定向回用户列表页面
    res.redirect('/admin/user')
})

// 修改用户信息路由
admin.post('/user-modify',async (req,res,next) => {
    // res.send(req.query.id)
    // 用户id
    const id = req.query.id
    // 接收客户端传递过来的请求参数
    const body = req.body
    // 查询ID用户信息 找出数据库中的密码 和填写的密码进行比较
    let user = await User.findOne({_id: id})
    if (user.password !== body.password) {
        // alert("输入的密码不正确!")
        let obj = {
            path: '/admin/user-edit',
            message: '密码错误',
            id: id
        }
        next(JSON.stringify(obj))
    } else {
        await User.updateOne({_id: id},{
            username: body.username,
            email: body.email,
            role: body.role,
            state: body.state
        })
        // res.send('成功')
        // 重定向页面
        return res.redirect('/admin/user')
    }
})

// 删除用户功能路由
admin.get('/delete',async (req,res) => {
    const userid = req.query.id
    await User.findOneAndDelete({_id: userid})
    res.redirect('/admin/user')
})


// 文章列表页面路由
admin.get('/article',async (req,res) => {
    // 接收客户端传递过来的页码
    const page = req.query.page
    // 表示当前访问的是文章管理页面 里面的值可以直接在模板中使用
    req.app.locals.currentLink = 'article'
    // 查询所有的文章
    let articleList = await pagination(Article).find().page(page).size(2).display(3).exec()
    // res.send(articleList)
    res.render('admin/article.art', {
        articleList:articleList
    })
})
// 文章编辑页面路由
admin.get('/article-edit', (req,res) => {
    // 表示当前访问的是文章管理页面 里面的值可以直接在模板中使用
    req.app.locals.currentLink = 'article'


    res.render('admin/article-edit.art')
})
// 文章文章表单添加处理路由
admin.post('/article-add', (req,res) => {
    // 1 创建表单解析对象
    const form = new formidable.IncomingForm()
    // 2 配置上传文件的存放位置
    form.uploadDir = path.join(__dirname,'../', 'public', 'upload')
    // 保留上传文件的后缀
    form.keepExtensions = true
    // 5.对表单进行解析
    form.parse(req, async (err,fields,files) => {
        // 1 err表示错误对象 如果表单解析失败 err里面存储错误信息 否则解析成功 err值为null
        //fields 对象类型 保存普通表单数据
        //files 对象类型 保存了和上传文件相关的数据
        // res.send(files.cover.path.split('public')[1])
        await Article.create({
            title: fields.title,
            author: fields.author,
            publishDate: fields.publishDate,
            cover: files.cover.path.split('public')[1],
            content: fields.content
        })
        res.redirect('/admin/article')
    })
    // res.send('ok')
})

module.exports = admin