module.exports = {
  name: 'deleteDB',
  description: "deletes element in DB test",
  execute(message, args, db) {
    deleteElementTest(args[0], db);
  }
}

function deleteElementTest(index, db) {
  if (index == "all") {
    db.set("test", []);
  }
  else {
    db.get("test").then(result => {
      if (result.length > index) {
        result.splice(index, 1);
        db.set("test", result);
        console.log(result);
      }
  });
  }
}