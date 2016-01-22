import manager, { entity, field, join } from '../app/helpers/elasticManager';

@field("name", "string")
@field("email", "string")
@entity("user")
class User
{

}
@field("content", field.TYPE.OBJECT)
@join("author", User)
@entity("post")
class Post
{

}

manager.createTypes();


setTimeout(function () {
  console.log(Post);
  var p = new Post();
  console.log(p);
  p.author = new User();
  console.log(p);
}, 5000)
