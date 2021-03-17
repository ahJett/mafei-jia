//创建数据库集合规则
const mongoose = require('mongoose')
const Joi = require('joi')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        minlength:2,
        maxlength:20
    },
    email:{
        type:String,
        unique:true, //保证唯一性
        require:true
    },
    password:{
        type:String,
        required:true
    },
    //如果是管理员 用admin代表
    role:{
        type:String,
        required:true
    },
    state:{
        type:Number,
        //如果值为0 则时启动状态
        default:0
    }
})


//创建集合
const User = mongoose.model('User',userSchema)

// User.create({
//     username:'刘麻匪',
//     email:'lmj@blog.com',
//     password:'lmj15767495506',
//     role:'admin',
//     state:0
// }).then(()=>{
//     console.log('success')
// }).catch(()=>{
//     console.log('default')
// })

// 验证用户信息
const validateUser = (user) =>{
     //定义对象的验证规则
     const  schema = {
        username:Joi.string().min(2).max(12).required().error(new Error('用户名不符合规则!')),
        email:Joi.string().email().required().error(new Error('邮箱格式不符合')),
        password:Joi.string().regex(/^[a-zA-Z0-9]{3,20}$/).required().error(new Error('密码格式错误!')),
        role:Joi.string().valid('normal','admin').required().error(new Error('角色值非法')),
        state:Joi.number().valid('0','1').required().error(new Error('状态值非法!'))
    }
    //实施验证 返回值是promise对象
    return Joi.validate(user,schema)
}
module.exports= {
    User: User,
    validateUser: validateUser
}