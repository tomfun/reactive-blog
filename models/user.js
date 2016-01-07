class Model {
  create() {
  }

  static find() {
    console.log(arguments)
  }

  save() {
  }
}

function entity(options) {
  options.elastica_meta
  return function (target) {
    console.log('user', target, options.elastica_meta)
  }
}

@entity({
  "elastica_meta": 123
})
class User extends Model {

}



User.find({ where: {
  name: 1
}})
