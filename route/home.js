const express = require('express')
// 导入文章集合构造函数
const {Article} = require('../model/article')
const pagination = require('mongoose-sex-page')
const {Comment} = require('../model/comment')
//创建博客展示页面路由
const home = express.Router()
// 博客前台首页的展示页面
home.get('/',async (req,res)=>{
    // 接收客户端传递过来的页码
    const page = req.query.page
    // 查询文章数据
    const articleList = await pagination(Article).page(page).size(2).display(5).find().exec()
    res.render('home/default', {
        articleList: articleList
    })
    // res.send(articleList)
})
// 博客前台文章详情展示页面
home.get('/article', async (req,res) => {
    // 接收客户端传递过来的文章id
    const id = req.query.id
    // 根据id查询文章详细信息
    const detail = await Article.findOne({_id: id})

    // 查询当前文章所对应的评论信息
    let comment = await Comment.findOne({aid: id})
    res.render('home/article', {
        article: detail,
        comment: comment
    })
    // res.send(comment)
})
// 创建评论功能路由
home.post('/comment', async (req,res) => {
    const { content, uid, aid } = req.body
    // 将评论信息存储到评论集合中
    await Comment.create({
        content: content,
        uid: uid,
        aid: aid,
        time: new Date()
    })
    res.redirect('/home/article?id=' + aid)
    // res.send('ok')
})
module.exports = home