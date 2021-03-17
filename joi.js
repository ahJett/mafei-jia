//引入joi模块
const Joi = require('joi')
//定义对象的验证规则

const schema = {
    //Error用来自定义错误信息
    username:Joi.string().min(2).max(5).error(new Error('username属性没有通过验证'))
}



async function run(){
    try{
        //实施验证
        await Joi.valid({username:'zheng'},schema)
    }catch(error){
        console.log(error)
        return
    }
    console.log('验证通过')
    
}

run()