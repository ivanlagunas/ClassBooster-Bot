module.exports = {
  name: 'addDB',
  description: "add element to DB test",
  execute(message, args, db) {
    addElementTest({name: args[0], value: parseInt(args[1])}, db)
  }
}

function addElementTest(element, db) {
  db.get("test").then(result => {
    result.push(element);
    db.set("test", result);
    console.log(result);
})
}