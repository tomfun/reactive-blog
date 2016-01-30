import manager, { entity, field, join } from '../app/helpers/elasticManager';

@field("name", "string")
@field("email", "string")
@entity("user")
class User
{

}
@field('content', field.TYPE.OBJECT)
@join('author', User, 'authorId')
@entity('post')
class Post
{

}

manager.createTypes();


setTimeout(function () {
  console.log("\n\n")
  //console.log(Post);
  //var p = new Post();
  //p.title = "новый пост";
  //console.log(p);
  //p.author = new User();
  //p.author.then(function (author) {
  //  author.name = "новый пользователь";
  //  author.email = "some@mail.ru";
  //})
  //console.log(p);
  //console.log("\n\n\n")
  //manager.create(p);

  //manager.findOne({Class: Post, id: 'ek1gneaox'}).then(function (data) {
  //  console.log(data)
  //});
  //var _ = require('lodash');
  //var time0 = new Date();
  //let loadTest = _.range(1, 2).map(function (i) {
  //  return manager.findById({Class: Post, id: 'Ek1GnEAOx'}).then(function (post) {
  //    if (i%1000 === 0)
  //    console.log('%%%%%%%', post)
  //    return post.author.then(function (author) {
  //      if (i%1000 === 0)
  //      console.log(author)
  //    })
  //  }).catch(function (some) {
  //    console.error(some, some.stack)
  //  });
  //});
  //Promise.all(loadTest).then(function () {
  //  var length = (new Date()) - (+time0);
  //  console.log('\n Took: ', length, '(ms)');
  //})

  manager.findOne({Class: Post}).then(function (data) {
    console.log(data)
  }).catch(function (some) {
    console.error(some, some ? some.stack : '');
  });
}, 1000)
