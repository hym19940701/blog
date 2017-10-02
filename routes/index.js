var express = require('express');
var crypto=require('crypto');
var router = express.Router();

var db=require('../models/db.js');


/*首页*/
router.get('/', function(req, res, next) {
  if(req.session.users){
      db.find("contents",{"username":req.session.users[0].username},function(err,r){
          if(err){
              console.log(err);
              return;
          }else{
              console.log(r[1].content);
              res.render('index', {"active":"index","users":req.session.users,"logincontents":r});
          }

      })
  }else {
    res.render('index', {"active":"index","users":false});
  }
});

/*注册*/
router.get('/register',function (req,res) {
  if(req.session.users){
    res.render('register', {"active":"register","users":req.session.users});
  }else {
    res.render('register', {"active":"register","users":false});
  }
});

/*注册功能*/
router.post('/register',function (req,res) {
  res.locals={
    "username":req.body.username,
    "password":req.body.password,
    "sex":req.body.sex,
    "age":req.body.age,
    "avatar": "/images/avatar/avatar.jpg"
  };
  if(res.locals.username==null){
    res.send('请输入的用户名');
    return;
  }
  if(res.locals.password==null){
    res.send('请输入的密码');
    return;
  }
  db.find("users",{"username":res.locals.username},function (err,result) {
    if(err){
      console.log(err);
      return;
    }
    if(result.length==0){
      var md5=crypto.createHash('md5');
      var sbt=parseInt(res.locals.password)*10000+res.locals.username;
      var scretPsw=md5.update(sbt).digest('hex');
      db.insertMany("users",[{"username":res.locals.username,"psw":scretPsw,"sex":res.locals.sex,"age":res.locals.age,"avatar":res.locals.avatar}],function (err,r) {
        if(err){
          console.log(err);
          return;
        }
        res.redirect('/login');
        return;
      })
    }else {
      if(result[0].username==res.locals.username){
        res.send('用户已存在');
        return;
      }else {
        var md5=crypto.createHash('md5');
        var sbt=parseInt(res.locals.password)*10000+res.locals.username;
        var scretPsw=md5.update(sbt).digest('hex');
        db.insertMany("users",[{"username":res.locals.username,"psw":scretPsw}],function (err,r) {
          if(err){
            console.log(err);
            return;
          }
          console.log(r);
          res.send('注册成功');
          return;
        })
      }
    }
  });
});

/*登录*/
router.get('/login',function (req,res) {
  if(req.session.users){
    db.find("contents",{"username":req.session.users[0].username},function(err,r){
      if(err){
        console.log(err);
        return;
      }
        res.render('login', {"active":"login","users":req.session.users,"logincontents":r});
      })

  }else {
    res.render('login', {"active":"login","users":false});
  }
});

/*登录功能  登录成功req.seesion.users是一个数组*/
router.post('/login',function (req,res) {
  res.locals={
    "username":req.body.username,
    "password":req.body.password
  };
  var md5=crypto.createHash('md5');
  var sbt=parseInt(res.locals.password)*10000+res.locals.username;
  var scretPsw=md5.update(sbt).digest('hex');
  db.find("users",{"username":res.locals.username},function (err,r) {
    if (r.length==0){
      res.send('用户不存在,请注册');
    }else {
      if(r[0].username==res.locals.username&&scretPsw==r[0].psw){
        //会话状态的设置是不是需要登录成功才设置
        req.session.users=r;
        res.redirect('/');
      }else if(scretPsw!=r[0].psw){
        res.send('密码错误');
      }
    }
  })
});

/*注销登录*/
router.get('/logout',function (req,res) {
  req.session.users=null;
  res.redirect('/');
});

//获取所有的留言
router.get('/getallcontent',function (req,res) {
  var page=parseInt(req.query.page);
  db.find("contents",{},{"skipNumber":6*page,"limit":6},function (err,result) {
    if(err){
      res.send('-1');
      return;
    }
    res.json({"r":result})//@@@@@@
  })
});

//获取留言的留言者头像
router.get('/getuseravatar',function (req,res) {
  var username=req.query.username;
  db.find("users",{"username":username},function (err,r) {
    if(err){
      res.send('-1');
      return;
    }
    res.json({"avatar":r[0].avatar});
  })
});

//获取留言总数
router.get('/getallcount',function (req,res) {
  db.getCount("contents",function (err,r) {
    if(err){
      res.send('-1');
      return;
    }
    res.json(r);
  });
});


module.exports = router;
