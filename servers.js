function Server(id, studentsInviteId, teachersInviteId) {
  this.id = id;
  this.studentsInviteId = studentsInviteId;
  this.teachersInviteId = teachersInviteId;
  this.init = true;
}

module.exports = Server