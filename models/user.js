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

  //manager.findOne({class: Post, id: 'e1h_y9nde'}).then(function (data) {
  //  console.log(data)
  //});

  manager.findById({class: Post, id: 'E1H_Y9nde'}).then(function (data) {
    console.log(data)
  });

  //manager.findOne({class: Post}).then(function (data) {
  //  console.log(data)
  //});
}, 2000)
