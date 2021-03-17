const guard = (req,res,next)=>{
    //判断用户访问的是否是登陆页面
    //判断用户的登录状态
    //如果用户是登录状态 将请求放行 否则重定向到登录页面
    if(req.url != '/login'&& !req.session.username){
        res.redirect('/admin/login')
    }else{
        next()
    }
}
module.exports = guard